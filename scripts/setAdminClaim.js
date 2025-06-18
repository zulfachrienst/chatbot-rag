// scripts/setAdminClaim.js
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service.json'))
});

const uid = '<ADMIN_UID>'; // ganti dengan UID admin kamu

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log('Custom claim set!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });