# Setup Script for Jean Monnet Serious Game (Windows)
# Run with: .\setup.ps1

Write-Host "🚀 Setting up Jean Monnet Serious Game..." -ForegroundColor Green

# Create required directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "lib\redis" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\queues" | Out-Null
New-Item -ItemType Directory -Force -Path "workers\processors" | Out-Null

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Copy environment file if it doesn't exist
<<<<<<< Updated upstream
if (-Not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please edit .env with your Supabase credentials" -ForegroundColor Red
=======
if (-Not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "⚠️  Please edit .env.local with your Supabase credentials" -ForegroundColor Red
>>>>>>> Stashed changes
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
<<<<<<< Updated upstream
Write-Host "1. Edit .env with your Supabase credentials"
Write-Host "2. Run 'docker-compose up -d' to start all services"
Write-Host "3. Access the app at http://localhost:3000"
Write-Host "4. Access Bull Board at http://localhost:3001"
=======
Write-Host "1. Edit .env.local with your Supabase credentials"
Write-Host "2. Run 'docker-compose up -d' to start all services"
Write-Host "3. Run 'restore-db.bat' to restore the database backup (first time only)"
Write-Host "4. Access the app at http://localhost:3000"
Write-Host "5. Access Bull Board at http://localhost:3001"
Write-Host ""
Write-Host "For detailed instructions, see QUICK-START.md" -ForegroundColor Yellow
>>>>>>> Stashed changes
