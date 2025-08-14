#!/bin/bash

# ROI Analysis Platform - Startup Script
echo "🚀 Starting ROI Analysis Platform..."

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
}

# Function to check if dependencies are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Backend dependencies missing. Installing...${NC}"
        cd backend && npm install && cd ..
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Frontend dependencies missing. Installing...${NC}"
        cd frontend && npm install && cd ..
    fi
    
    echo -e "${GREEN}✅ Dependencies verified${NC}"
}

# Function to create uploads directory
create_directories() {
    echo -e "${BLUE}📁 Creating required directories...${NC}"
    mkdir -p backend/uploads
    mkdir -p backend/exports
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Function to start backend server
start_backend() {
    echo -e "${BLUE}🖥️  Starting Backend Server...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend server starting on http://localhost:5000${NC}"
    sleep 3
}

# Function to start frontend server
start_frontend() {
    echo -e "${BLUE}🌐 Starting Frontend Server...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend server starting on http://localhost:3000${NC}"
    sleep 3
}

# Function to handle cleanup on script exit
cleanup() {
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}    ROI Analysis Platform v1.0      ${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    
    check_node
    check_dependencies
    create_directories
    
    echo -e "${BLUE}🚀 Starting application servers...${NC}"
    echo ""
    
    start_backend
    start_frontend
    
    echo ""
    echo -e "${GREEN}🎉 Application is ready!${NC}"
    echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}🔧 Backend:  http://localhost:5000${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    echo ""
    
    # Wait for user to stop the application
    wait
}

# Run the main function
main
