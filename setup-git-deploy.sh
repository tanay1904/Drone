#!/bin/bash

echo "=========================================="
echo "🚁 DRONE CONTROL - GIT & DEPLOYMENT SETUP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Generate SSH keys for deployment
generate_ssh_keys() {
    echo -e "${BLUE}🔑 Generating SSH Keys for Deployment...${NC}"
    
    # Check if SSH key already exists
    if [ ! -f ~/.ssh/drone_deploy_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/drone_deploy_rsa -C "drone-deploy@yourdomain.com" -N ""
        echo -e "${GREEN}✅ SSH keys generated${NC}"
    else
        echo -e "${YELLOW}SSH keys already exist${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📋 Your PUBLIC Key (Add this to GitHub/GitLab/Cloud Provider):${NC}"
    echo "=========================================="
    cat ~/.ssh/drone_deploy_rsa.pub
    echo "=========================================="
    echo ""
    
    # Copy to clipboard if on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cat ~/.ssh/drone_deploy_rsa.pub | pbcopy
        echo -e "${GREEN}✅ Public key copied to clipboard!${NC}"
    fi
}

# Initialize Git repository
init_git() {
    echo -e "${BLUE}📦 Initializing Git Repository...${NC}"
    
    if [ ! -d .git ]; then
        git init
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    else
        echo -e "${YELLOW}Git repository already exists${NC}"
    fi
    
    # Add all files
    git add .
    git commit -m "Initial commit: Drone Control System with multi-protocol support" 2>/dev/null || true
}

# Setup GitHub repository
setup_github() {
    echo -e "${BLUE}🐙 GitHub Repository Setup${NC}"
    echo ""
    
    read -p "Enter your GitHub username: " github_user
    read -p "Enter repository name (drone-control-system): " repo_name
    repo_name=${repo_name:-drone-control-system}
    
    echo ""
    echo "Creating GitHub repository..."
    
    # Create GitHub repo using API (requires personal access token)
    echo "To create a repo automatically, you need a GitHub Personal Access Token"
    echo "Get one at: https://github.com/settings/tokens"
    read -p "Enter your GitHub Personal Access Token (or press Enter to skip): " github_token
    
    if [ ! -z "$github_token" ]; then
        curl -H "Authorization: token $github_token" \
             -d "{\"name\":\"$repo_name\",\"description\":\"Professional drone control system with DJI-level infrastructure\",\"private\":false}" \
             https://api.github.com/user/repos
        
        # Add remote
        git remote add origin "git@github.com:$github_user/$repo_name.git" 2>/dev/null || \
        git remote set-url origin "git@github.com:$github_user/$repo_name.git"
        
        # Push to GitHub
        git push -u origin main 2>/dev/null || git push -u origin master
        
        echo -e "${GREEN}✅ GitHub repository created and code pushed${NC}"
    else
        echo ""
        echo "Manual steps to complete GitHub setup:"
        echo "1. Go to https://github.com/new"
        echo "2. Create repository: $repo_name"
        echo "3. Run these commands:"
        echo ""
        echo "   git remote add origin git@github.com:$github_user/$repo_name.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
    fi
}

# Generate API keys
generate_api_keys() {
    echo ""
    echo -e "${BLUE}🔐 Generating API Keys...${NC}"
    echo ""
    
    # Generate secure random keys
    MASTER_KEY=$(openssl rand -hex 32)
    CLIENT_KEY=$(openssl rand -hex 24)
    WEBRTC_KEY=$(openssl rand -hex 16)
    MQTT_KEY=$(openssl rand -hex 20)
    JWT_SECRET=$(openssl rand -hex 64)
    
    # Create .env.production file
    cat > .env.production << EOF
# Generated API Keys - KEEP THESE SECRET!
# Created: $(date)

# Master Keys (Server-side only)
MASTER_API_KEY=$MASTER_KEY
JWT_SECRET=$JWT_SECRET

# Public Client Keys
PUBLIC_API_KEY=pk_live_$CLIENT_KEY
PUBLIC_WS_KEY=ws_live_$(openssl rand -hex 16)
PUBLIC_MQTT_KEY=mqtt_live_$MQTT_KEY
PUBLIC_WEBRTC_KEY=rtc_live_$WEBRTC_KEY

# Test Keys (Rate limited)
TEST_API_KEY=pk_test_$(openssl rand -hex 16)
TEST_WS_KEY=ws_test_$(openssl rand -hex 16)
TEST_MQTT_KEY=mqtt_test_$(openssl rand -hex 16)

# Webhook Signing Secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 20)

# Encryption Keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
ENCRYPTION_IV=$(openssl rand -hex 16)
EOF

    echo -e "${GREEN}✅ API Keys generated and saved to .env.production${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Never commit .env.production to Git!${NC}"
    echo ""
    
    # Display public keys
    echo -e "${GREEN}📋 Your PUBLIC API Keys:${NC}"
    echo "=========================================="
    echo "Production:"
    echo "  API Key:    pk_live_$CLIENT_KEY"
    echo "  WS Key:     ws_live_$(openssl rand -hex 16)"
    echo "  MQTT Key:   mqtt_live_$MQTT_KEY"
    echo ""
    echo "Testing:"
    echo "  API Key:    pk_test_$(openssl rand -hex 16)"
    echo "=========================================="
}

# Setup deployment configurations
setup_deployments() {
    echo ""
    echo -e "${BLUE}☁️  Creating Deployment Configurations...${NC}"
    
    # Create deployment directory
    mkdir -p deployment
    
    # Create Heroku app.json
    cat > app.json << 'EOF'
{
  "name": "Drone Control System",
  "description": "Professional drone control with multi-protocol support",
  "repository": "https://github.com/YOUR_USERNAME/drone-control-system",
  "keywords": ["drone", "iot", "mqtt", "webrtc", "realtime"],
  "addons": [
    "heroku-redis:hobby-dev",
    "heroku-postgresql:hobby-dev"
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "PUBLIC_API_KEY": {
      "description": "Public API key for client access",
      "generator": "secret"
    },
    "JWT_SECRET": {
      "description": "Secret for JWT tokens",
      "generator": "secret"
    },
    "MQTT_HOST": {
      "description": "MQTT broker hostname",
      "value": "broker.hivemq.com"
    },
    "ENABLE_CELLULAR": {
      "description": "Enable cellular connectivity",
      "value": "false"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "free"
    }
  },
  "scripts": {
    "postdeploy": "npm run setup-db"
  }
}
EOF

    # Create Vercel configuration
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "backend/enhanced-server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/enhanced-server.js"
    },
    {
      "src": "/ws",
      "dest": "/backend/enhanced-server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

    # Create Dockerfile
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend code
COPY backend/ .

# Build frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ .
RUN npm run build

# Setup final workdir
WORKDIR /app/backend

# Expose ports
EXPOSE 3001 1883 3478

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start server
CMD ["node", "enhanced-server.js"]
EOF

    # Create GitHub Actions workflow
    mkdir -p .github/workflows
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy Drone Control System

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    
    steps:
      - uses: actions/checkout@v3
      
      # Deploy to your cloud provider
      - name: Deploy to Production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          echo "Deploying to production..."
          # Add your deployment script here
EOF

    echo -e "${GREEN}✅ Deployment configurations created${NC}"
}

# Create cloud deployment scripts
create_cloud_scripts() {
    echo ""
    echo -e "${BLUE}☁️  Creating Cloud Deployment Scripts...${NC}"
    
    # Create deploy script
    cat > deploy.sh << 'EOF'
#!/bin/bash

# Drone Control System - Deploy Script

echo "🚁 Deploying Drone Control System..."

# Function to deploy to different platforms
deploy_heroku() {
    echo "Deploying to Heroku..."
    heroku create drone-control-$USER 2>/dev/null || true
    heroku addons:create heroku-redis:hobby-dev
    heroku addons:create heroku-postgresql:hobby-dev
    git push heroku main || git push heroku master
    heroku open
}

deploy_railway() {
    echo "Deploying to Railway..."
    railway login
    railway init
    railway up
    railway open
}

deploy_vercel() {
    echo "Deploying to Vercel..."
    vercel --prod
}

deploy_aws() {
    echo "Deploying to AWS..."
    # Build Docker image
    docker build -t drone-control .
    
    # Push to ECR
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
    docker tag drone-control:latest $ECR_URI/drone-control:latest
    docker push $ECR_URI/drone-control:latest
    
    # Deploy to ECS or EB
    eb deploy
}

# Select deployment target
echo "Select deployment target:"
echo "1) Heroku"
echo "2) Railway"
echo "3) Vercel"
echo "4) AWS"
echo "5) All"

read -p "Enter choice [1-5]: " choice

case $choice in
    1) deploy_heroku ;;
    2) deploy_railway ;;
    3) deploy_vercel ;;
    4) deploy_aws ;;
    5) 
        deploy_heroku
        deploy_vercel
        ;;
    *) echo "Invalid choice" ;;
esac

echo "✅ Deployment complete!"
EOF

    chmod +x deploy.sh
    echo -e "${GREEN}✅ Cloud deployment scripts created${NC}"
}

# Display public URLs
display_public_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}🌐 PUBLIC ACCESS INFORMATION${NC}"
    echo "=========================================="
    echo ""
    
    echo "Once deployed, your drone control system will be accessible at:"
    echo ""
    echo "📍 Public Endpoints:"
    echo "  • Web App:    https://your-app.herokuapp.com"
    echo "  • API:        https://your-app.herokuapp.com/api"
    echo "  • WebSocket:  wss://your-app.herokuapp.com/ws"
    echo "  • Docs:       https://your-app.herokuapp.com/docs"
    echo ""
    
    echo "🔑 Add these SSH keys to your cloud provider:"
    echo "  • GitHub:     https://github.com/settings/keys"
    echo "  • Heroku:     heroku keys:add ~/.ssh/drone_deploy_rsa.pub"
    echo "  • AWS:        aws ec2 import-key-pair --key-name drone-key --public-key-material file://~/.ssh/drone_deploy_rsa.pub"
    echo ""
    
    echo "📡 Free Services to Use:"
    echo "  • MQTT:       broker.hivemq.com (public)"
    echo "  • Redis:      Redis Cloud (30MB free)"
    echo "  • Database:   Supabase (500MB free)"
    echo "  • Hosting:    Vercel/Netlify (free tier)"
    echo "  • CDN:        Cloudflare (free)"
    echo ""
    
    echo "🚀 Quick Deploy Commands:"
    echo "  • Heroku:     git push heroku main"
    echo "  • Vercel:     vercel --prod"
    echo "  • Railway:    railway up"
    echo "  • Netlify:    netlify deploy --prod"
    echo ""
    
    # Save public info to file
    cat > PUBLIC_ACCESS.md << 'EOF'
# Drone Control System - Public Access

## Your Public Endpoints

After deployment, your system will be available at:

### Production URLs
- Web Interface: `https://drone-control.yourdomain.com`
- API Endpoint: `https://api.drone-control.yourdomain.com`
- WebSocket: `wss://ws.drone-control.yourdomain.com`
- MQTT over WS: `wss://mqtt.drone-control.yourdomain.com:8084`

### API Keys (Public)
Add these to your client applications:

```javascript
const config = {
  apiKey: 'YOUR_PUBLIC_API_KEY',
  wsKey: 'YOUR_PUBLIC_WS_KEY',
  mqttKey: 'YOUR_PUBLIC_MQTT_KEY'
};
```

### Quick Test

Test your deployment:

```bash
# Test API
curl https://your-app.herokuapp.com/api/status

# Test WebSocket
wscat -c wss://your-app.herokuapp.com/ws

# Test MQTT
mqtt pub -h broker.hivemq.com -t drone/test -m "Hello Drone"
```

### Mobile Access

Access from anywhere:
1. Open browser on your phone
2. Navigate to your public URL
3. Add to home screen for app-like experience

### Security

Your system includes:
- HTTPS/WSS encryption
- API key authentication
- Rate limiting
- CORS protection
- JWT tokens
EOF

    echo -e "${GREEN}✅ Public access information saved to PUBLIC_ACCESS.md${NC}"
}

# Main execution
main() {
    echo "This script will:"
    echo "  1. Generate SSH keys for deployment"
    echo "  2. Initialize Git repository"
    echo "  3. Setup GitHub/GitLab remote"
    echo "  4. Generate API keys"
    echo "  5. Create deployment configurations"
    echo "  6. Provide public access information"
    echo ""
    
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_ssh_keys
        init_git
        setup_github
        generate_api_keys
        setup_deployments
        create_cloud_scripts
        display_public_info
        
        echo ""
        echo "=========================================="
        echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
        echo "=========================================="
        echo ""
        echo "Next steps:"
        echo "1. Review and commit your changes:"
        echo "   git add ."
        echo "   git commit -m 'Add deployment configurations'"
        echo "   git push origin main"
        echo ""
        echo "2. Deploy to cloud:"
        echo "   ./deploy.sh"
        echo ""
        echo "3. Share your public URL with users!"
        echo ""
        echo "Your system is ready for global access! 🚁🌍"
    else
        echo "Setup cancelled."
    fi
}

# Run main function
main