#!/bin/bash

# Hedera Stalker Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
COMMAND=${1:-start}

case $COMMAND in
    start|up)
        print_info "Starting Hedera Stalker..."
        print_info "Building and starting containers..."
        
        # Docker Compose automatically reads .env file if it exists
        if [ -f .env ]; then
            print_info "Found .env file - will use it for configuration"
        else
            print_warn "No .env file found - using default values"
        fi
        
        print_info "Starting containers..."
        
        docker-compose up -d --build
        
        print_info "Waiting for services to be ready..."
        sleep 5
        
        # Wait for postgres to be ready
        print_info "Waiting for PostgreSQL to be ready..."
        until docker-compose exec -T postgres pg_isready -U hedera_stalker > /dev/null 2>&1; do
            sleep 1
        done
        
        print_info "Services are starting up..."
        print_info "Application will be available at: http://localhost:3000"
        print_info ""
        print_info "To view logs, run: ./docker.sh logs"
        print_info "To stop, run: ./docker.sh stop"
        ;;
    
    stop|down)
        print_info "Stopping Hedera Stalker..."
        docker-compose down
        print_info "Services stopped."
        ;;
    
    restart)
        print_info "Restarting Hedera Stalker..."
        docker-compose restart
        print_info "Services restarted."
        ;;
    
    logs)
        print_info "Showing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    logs-app)
        print_info "Showing application logs..."
        docker-compose logs -f app
        ;;
    
    logs-db)
        print_info "Showing database logs..."
        docker-compose logs -f postgres
        ;;
    
    status)
        print_info "Container status:"
        docker-compose ps
        ;;
    
    shell)
        print_info "Opening shell in app container..."
        docker-compose exec app sh
        ;;
    
    db-shell)
        print_info "Opening PostgreSQL shell..."
        docker-compose exec postgres psql -U hedera_stalker -d hedera_stalker
        ;;
    
    clean)
        print_warn "This will remove containers, networks, and volumes!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker-compose down -v
            print_info "Cleanup complete."
        else
            print_info "Cleanup cancelled."
        fi
        ;;
    
    rebuild)
        print_info "Rebuilding and restarting containers..."
        docker-compose down
        docker-compose up -d --build
        print_info "Rebuild complete."
        ;;
    
    help|--help|-h)
        echo "Hedera Stalker Docker Management"
        echo ""
        echo "Usage: ./docker.sh [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  start, up      Start the application (default)"
        echo "  stop, down     Stop the application"
        echo "  restart        Restart the application"
        echo "  logs           Show logs from all services"
        echo "  logs-app       Show logs from application only"
        echo "  logs-db        Show logs from database only"
        echo "  status         Show container status"
        echo "  shell          Open shell in app container"
        echo "  db-shell       Open PostgreSQL shell"
        echo "  rebuild        Rebuild and restart containers"
        echo "  clean          Remove containers, networks, and volumes"
        echo "  help           Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  HEDERA_NETWORK  Hedera network to use (mainnet, testnet, previewnet)"
        echo "                  Default: testnet"
        echo ""
        ;;
    
    *)
        print_error "Unknown command: $COMMAND"
        echo "Run './docker.sh help' for usage information."
        exit 1
        ;;
esac

