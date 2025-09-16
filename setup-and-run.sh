#!/bin/bash

# Enhanced Drone Control System Setup Script
# Supports MQTT, WebRTC, HTTP, WebSocket, and Cellular connectivity

echo "=========================================="
echo "🚁 DRONE CONTROL SYSTEM - SETUP"
echo "=========================================="
echo ""
echo "This will set up the complete drone control infrastructure"
echo "including all protocols and services."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 16 or higher"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
        DOCKER_AVAILABLE=true
    else
        echo -e "${YELLOW}⚠️  Docker not found (optional)${NC}"
        DOCKER_AVAILABLE=false
    fi
    
    # Check for serial ports
    if [ -e /dev/ttyACM0 ] || [ -e /dev/ttyUSB0 ]; then
        echo -e "${GREEN}✅ Serial ports detected${NC}"
    else
        echo -e "${YELLOW}⚠️  No serial ports detected (will run in simulation mode)${NC}"
    fi
    
    echo ""
}

# Setup backend
setup_backend() {
    echo "🔧 Setting up backend server..."
    cd backend
    
    # Install dependencies
    echo "Installing backend dependencies..."
    npm install
    
    # Copy enhanced package.json if needed
    if [ -f enhanced-package.json ]; then
        echo "Using enhanced package configuration..."
        mv package.json package-original.json
        cp enhanced-package.json package.json
        npm install
    fi
    
    # Create .env file if not exists
    if [ ! -f .env ]; then
        echo "Creating environment configuration..."
        cat > .env << EOF
NODE_ENV=development
PORT=3001

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASS=

# WebRTC
TURN_SERVER=stun:stun.l.google.com:19302
TURN_USER=
TURN_PASS=

# Servers
PRIMARY_SERVER=http://localhost:3001
SECONDARY_SERVER=http://localhost:3002
EDGE_SERVER=http://localhost:3003
CELLULAR_SERVER=http://localhost:3004

# Cellular
ENABLE_CELLULAR=false
CELLULAR_PORT=/dev/ttyUSB0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=drone_user
DB_PASS=drone_pass
DB_NAME=drone_telemetry
EOF
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi
    
    cd ..
    echo ""
}

# Setup frontend
setup_frontend() {
    echo "🎨 Setting up frontend..."
    
    # Check if frontend directory exists
    if [ ! -d frontend ]; then
        echo "Creating React frontend..."
        npx create-react-app frontend
        cd frontend
        
        # Install additional dependencies
        npm install axios socket.io-client mqtt mapbox-gl chart.js react-chartjs-2
        npm install @mui/material @emotion/react @emotion/styled
        npm install react-router-dom react-joystick-component
        
        # Copy App.js if exists
        if [ -f ../src/App.js ]; then
            cp ../src/App.js src/
        fi
        
        cd ..
    else
        echo "Frontend already exists, installing dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    echo ""
}

# Start local services
start_local_services() {
    echo "🚀 Starting local services..."
    
    # Start Redis if Docker available
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "Starting Redis..."
        docker run -d --name drone-redis -p 6379:6379 redis:alpine 2>/dev/null || \
            docker start drone-redis 2>/dev/null || \
            echo -e "${YELLOW}Redis already running${NC}"
        
        echo "Starting MQTT broker..."
        docker run -d --name drone-mqtt -p 1883:1883 -p 9001:9001 eclipse-mosquitto 2>/dev/null || \
            docker start drone-mqtt 2>/dev/null || \
            echo -e "${YELLOW}MQTT already running${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker not available, skipping service containers${NC}"
        echo "Please install and run Redis and MQTT manually or use Docker"
    fi
    
    echo ""
}

# Run the system
run_system() {
    echo "🎯 Starting Drone Control System..."
    echo ""
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo "Shutting down..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        
        if [ "$DOCKER_AVAILABLE" = true ]; then
            docker stop drone-redis drone-mqtt 2>/dev/null
        fi
        
        exit 0
    }
    
    trap cleanup EXIT INT TERM
    
    # Start backend
    echo "Starting backend server..."
    cd backend
    if [ -f enhanced-server.js ]; then
        node enhanced-server.js &
    else
        node server.js &
    fi
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 3
    
    # Check if backend is running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend server running on http://localhost:3001${NC}"
    
    # Build and serve frontend
    echo "Building frontend..."
    cd frontend
    
    if [ "$1" = "--dev" ]; then
        echo "Starting frontend in development mode..."
        npm start &
        FRONTEND_PID=$!
    else
        echo "Building frontend for production..."
        npm run build
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
        echo "Frontend will be served by backend at http://localhost:3001"
    fi
    
    cd ..
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ DRONE CONTROL SYSTEM READY${NC}"
    echo "=========================================="
    echo ""
    echo "📡 Services Status:"
    echo "  • Backend:  http://localhost:3001"
    echo "  • WebSocket: ws://localhost:3001"
    echo "  • MQTT:      localhost:1883"
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "  • Redis:     localhost:6379"
    fi
    
    if [ "$1" = "--dev" ]; then
        echo "  • Frontend:  http://localhost:3000 (dev mode)"
    fi
    
    echo ""
    echo "🌐 Web Interface: http://localhost:3001"
    echo ""
    echo "📊 API Endpoints:"
    echo "  • Status:    http://localhost:3001/api/status"
    echo "  • Servers:   http://localhost:3001/api/servers"
    echo "  • Cellular:  http://localhost:3001/api/cellular/status"
    echo "  • Health:    http://localhost:3001/health"
    echo ""
    echo "🎮 Features:"
    echo "  • Multi-protocol support (HTTP, WebSocket, MQTT, WebRTC)"
    echo "  • Dynamic server switching with failover"
    echo "  • Cellular/eSIM connectivity support"
    echo "  • Real-time telemetry streaming"
    echo "  • Video streaming via WebRTC"
    echo "  • Mission planning and waypoint management"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Keep script running
    wait $BACKEND_PID
}

# Docker mode
run_docker() {
    echo "🐳 Running with Docker Compose..."
    
    if [ ! "$DOCKER_AVAILABLE" = true ]; then
        echo -e "${RED}❌ Docker is required for this mode${NC}"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p config/grafana/dashboards config/grafana/datasources config/ssl
    
    # Start all services
    docker-compose up -d
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ DOCKER SERVICES STARTED${NC}"
    echo "=========================================="
    echo ""
    echo "📡 Services:"
    echo "  • Web Interface:  http://localhost"
    echo "  • Backend Primary: http://localhost:3001"
    echo "  • Backend Secondary: http://localhost:3002"
    echo "  • Grafana:        http://localhost:3000"
    echo "  • Prometheus:     http://localhost:9090"
    echo "  • MQTT:           localhost:1883"
    echo "  • Redis:          localhost:6379"
    echo ""
    echo "Run 'docker-compose logs -f' to view logs"
    echo "Run 'docker-compose down' to stop all services"
}

# Main execution
main() {
    check_prerequisites
    
    case "$1" in
        --docker)
            run_docker
            ;;
        --setup-only)
            setup_backend
            setup_frontend
            echo -e "${GREEN}✅ Setup complete. Run './setup-and-run.sh' to start${NC}"
            ;;
        --dev)
            setup_backend
            setup_frontend
            start_local_services
            run_system --dev
            ;;
        *)
            setup_backend
            setup_frontend
            start_local_services
            run_system
            ;;
    esac
}

# Run main function
main "$@"