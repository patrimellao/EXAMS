# Setup Script for Jean Monnet Serious Game
# Run with: ./setup.sh

echo "🚀 Setting up Jean Monnet Serious Game..."

# Create required directories
echo "📁 Creating directories..."
mkdir -p lib/redis
mkdir -p lib/queues  
mkdir -p workers/processors

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Supabase credentials"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase credentials"
echo "2. Run 'docker-compose up -d' to start all services"
echo "3. Access the app at http://localhost:3000"
echo "4. Access Bull Board at http://localhost:3001"
