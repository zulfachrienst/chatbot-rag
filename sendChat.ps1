# Test Chatbot PowerShell Script

Write-Host "Testing Product Chatbot..." -ForegroundColor Cyan

# Test 1: Smartphone query
Write-Host "`Test 1: Smartphone Query" -ForegroundColor Yellow
$smartphone = @{
    message = "Saya butuh smartphone dengan kamera bagus budget 20 juta"
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $smartphone -ContentType "application/json"
Write-Host "Response: $($response1.data.response.Substring(0, 100))..." -ForegroundColor Green
Write-Host "Related Products: $($response1.data.relatedProducts.Count)" -ForegroundColor Blue

# Test 2: Laptop query
Write-Host "`Test 2: Laptop Query" -ForegroundColor Yellow
$laptop = @{
    message = "Laptop untuk programming dan design grafis"
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $laptop -ContentType "application/json"
Write-Host "Response: $($response2.data.response.Substring(0, 100))..." -ForegroundColor Green
Write-Host "Related Products: $($response2.data.relatedProducts.Count)" -ForegroundColor Blue

# Test 3: Audio query
Write-Host "`Test 3: Audio Query" -ForegroundColor Yellow
$audio = @{
    message = "Headphone wireless terbaik untuk dengerin musik"
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $audio -ContentType "application/json"
Write-Host "Response: $($response3.data.response.Substring(0, 100))..." -ForegroundColor Green
Write-Host "Related Products: $($response3.data.relatedProducts.Count)" -ForegroundColor Blue

# Test 4: Get all products
Write-Host "`Test 4: Get All Products" -ForegroundColor Yellow
$products = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method GET
Write-Host "Total Products: $($products.data.Count)" -ForegroundColor Green

Write-Host "`All tests completed!" -ForegroundColor Cyan