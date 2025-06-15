const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR code to log in');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is ready!');
});

client.on('message', async (message) => {
    const chat = await message.getChat();
    const userInput = message.body;
    const userId = message.from; // Nomor WhatsApp user

    console.log(`📩 From ${userId}: ${userInput}`);

    try {
        await chat.sendStateTyping();

        const response = await axios.post('http://localhost:3000/api/chat', {
            userId,      // Kirim userId ke endpoint AI
            message: userInput
        });

        const aiReply = response?.data?.data?.response;

        if (aiReply) {
            await client.sendMessage(message.from, aiReply);
            await chat.clearState();
        } else {
            await client.sendMessage(message.from, 'Maaf, kami belum menemukan jawaban yang pas 😔');
            await chat.clearState();
        }

    } catch (err) {
        console.error('❌ Error saat memanggil API:', err);
        await client.sendMessage(message.from, '⚠️ Maaf, terjadi kesalahan teknis. Silakan coba lagi nanti.');
        await chat.clearState();
    }
});

client.initialize();
