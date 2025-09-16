# 🚁 Drone Control System - Enterprise Edition

Professional drone control system with DJI-level infrastructure, supporting multiple protocols (HTTP, WebSocket, MQTT, WebRTC), cellular connectivity, and dynamic server switching.

## 🌐 Public Access & Deployment

### Quick Deploy Options

#### 1. **Deploy to Vercel** (Frontend + Serverless)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/drone-control-system)

#### 2. **Deploy to Heroku** (Full Stack)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/YOUR_USERNAME/drone-control-system)

#### 3. **Deploy to Railway** (Full Stack + Database)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/drone-control-system)

### 🔑 Public Endpoints

Once deployed, your drone control system will be accessible at:

```yaml
Production Endpoints:
  Web Interface: https://drone-control.yourdomain.com
  API Base: https://api.drone-control.yourdomain.com
  WebSocket: wss://ws.drone-control.yourdomain.com
  MQTT: mqtts://mqtt.drone-control.yourdomain.com:8883
  WebRTC: https://webrtc.drone-control.yourdomain.com

Development/Testing:
  Staging: https://staging.drone-control.yourdomain.com
  Dev API: https://dev-api.drone-control.yourdomain.com
```

## 🚀 Cloud Deployment Guide

### AWS Deployment

```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure

# Deploy using CloudFormation
aws cloudformation deploy \
  --template-file deployment/aws-stack.yaml \
  --stack-name drone-control-system \
  --parameter-overrides \
    DomainName=drone.yourdomain.com \
    CertificateArn=arn:aws:acm:us-east-1:xxxx:certificate/xxxx

# Get public endpoints
aws cloudformation describe-stacks \
  --stack-name drone-control-system \
  --query 'Stacks[0].Outputs'
```

### Google Cloud Platform

```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth login

# Deploy to Cloud Run
gcloud run deploy drone-control \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"

# Get public URL
gcloud run services describe drone-control \
  --region us-central1 \
  --format 'value(status.url)'
```

### Azure Deployment

```bash
# Install Azure CLI
brew install azure-cli

# Login
az login

# Create resource group
az group create --name DroneControlRG --location eastus

# Deploy using ARM template
az deployment group create \
  --resource-group DroneControlRG \
  --template-file deployment/azure-template.json

# Get public endpoints
az webapp show --name drone-control-app \
  --resource-group DroneControlRG \
  --query 'defaultHostName'
```

## 🔐 API Keys & Authentication

### Generate API Keys

```javascript
// Generate secure API keys
const crypto = require('crypto');

// Master API Key
const masterKey = crypto.randomBytes(32).toString('hex');
console.log('MASTER_API_KEY=' + masterKey);

// Client Keys
const clientKey = crypto.randomBytes(24).toString('hex');
console.log('CLIENT_API_KEY=' + clientKey);

// WebRTC Keys
const webrtcKey = crypto.randomBytes(16).toString('hex');
console.log('WEBRTC_KEY=' + webrtcKey);
```

### Public API Keys for Testing

```env
# Development Keys (Rate Limited)
PUBLIC_API_KEY=pk_test_51DroneControlTestKeyForDevelopment
PUBLIC_WS_KEY=ws_test_51WebSocketTestKeyForStreaming
PUBLIC_MQTT_KEY=mqtt_test_51MQTTTestKeyForTelemetry

# Production Keys (Request from admin)
PROD_API_KEY=pk_live_[contact_admin_for_production_key]
PROD_WS_KEY=ws_live_[contact_admin_for_production_key]
PROD_MQTT_KEY=mqtt_live_[contact_admin_for_production_key]
```

## 🌍 Global CDN Setup

### Cloudflare Configuration

1. Add your domain to Cloudflare
2. Update DNS records:

```yaml
Type: A
Name: @
Value: YOUR_SERVER_IP
Proxied: Yes

Type: CNAME
Name: www
Value: @
Proxied: Yes

Type: CNAME
Name: api
Value: @
Proxied: Yes

Type: CNAME
Name: ws
Value: @
Proxied: No  # WebSocket needs to bypass CF proxy
```

### SSL/TLS Certificates

```bash
# Generate Let's Encrypt certificates
certbot certonly --standalone -d drone-control.yourdomain.com \
  -d api.drone-control.yourdomain.com \
  -d ws.drone-control.yourdomain.com

# Or use Cloudflare Origin CA
openssl req -new -newkey rsa:2048 -nodes \
  -keyout drone-control.key \
  -out drone-control.csr
```

## 📡 Public MQTT Broker

### Free Public Brokers for Testing

```javascript
// Test MQTT Brokers
const publicBrokers = {
  mosquitto: {
    host: 'test.mosquitto.org',
    port: 1883,
    wsPort: 8080,
    wssPort: 8081
  },
  hivemq: {
    host: 'broker.hivemq.com',
    port: 1883,
    wsPort: 8000
  },
  emqx: {
    host: 'broker.emqx.io',
    port: 1883,
    wsPort: 8083,
    wssPort: 8084
  }
};
```

### Production MQTT Setup

```yaml
# docker-compose.mqtt.yml
version: '3.8'
services:
  mqtt:
    image: emqx/emqx:latest
    ports:
      - "1883:1883"  # MQTT
      - "8883:8883"  # MQTT/SSL
      - "8083:8083"  # WebSocket
      - "8084:8084"  # WSS
      - "18083:18083" # Dashboard
    environment:
      - EMQX_ALLOW_ANONYMOUS=false
      - EMQX_ACL_NOMATCH=deny
    volumes:
      - ./config/emqx.conf:/opt/emqx/etc/emqx.conf
```

## 🚁 WebRTC TURN/STUN Servers

### Public STUN Servers

```javascript
const publicStunServers = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
  'stun:stun.fastly.com:3478'
];
```

### Free TURN Server Setup

```bash
# Using Coturn on your server
apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
realm=drone.yourdomain.com
server-name=drone.yourdomain.com
lt-cred-mech
user=drone:dronepass123
cert=/etc/letsencrypt/live/drone.yourdomain.com/cert.pem
pkey=/etc/letsencrypt/live/drone.yourdomain.com/privkey.pem

# Start TURN server
turnserver -c /etc/turnserver.conf
```

## 🌐 Environment Variables

```bash
# .env.production
NODE_ENV=production

# Public URLs
PUBLIC_URL=https://drone-control.yourdomain.com
API_URL=https://api.drone-control.yourdomain.com
WS_URL=wss://ws.drone-control.yourdomain.com
MQTT_URL=wss://mqtt.drone-control.yourdomain.com:8084

# API Keys (Public)
PUBLIC_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxx
MAPBOX_PUBLIC_TOKEN=pk.eyJ1Ijoixxxxxxxxxxxxxxxxxxxxxx

# Redis (Use Redis Cloud free tier)
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345

# Database (Use Supabase/Neon/PlanetScale free tier)
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/drone_telemetry

# TURN Server
TURN_URLS=turn:turn.yourdomain.com:3478
TURN_USERNAME=drone
TURN_CREDENTIAL=your_turn_password

# Monitoring
SENTRY_DSN=https://xxxxxxxxx@sentry.io/xxxxxxx
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxx
```

## 📊 Monitoring & Analytics

### Free Monitoring Services

```yaml
Uptime Monitoring:
  - UptimeRobot: https://uptimerobot.com (50 monitors free)
  - Pingdom: https://www.pingdom.com (1 site free)
  - StatusCake: https://www.statuscake.com (10 tests free)

Error Tracking:
  - Sentry: https://sentry.io (5K events/month free)
  - Rollbar: https://rollbar.com (5K events/month free)
  - Bugsnag: https://bugsnag.com (7.5K events/month free)

Analytics:
  - Google Analytics: https://analytics.google.com (free)
  - Plausible: https://plausible.io (open source)
  - Mixpanel: https://mixpanel.com (100K events/month free)
```

## 🔗 API Documentation

Once deployed, access interactive API docs at:

- Swagger UI: `https://api.drone-control.yourdomain.com/docs`
- GraphQL Playground: `https://api.drone-control.yourdomain.com/graphql`
- WebSocket Test: `https://api.drone-control.yourdomain.com/ws-test`

## 📱 Mobile App Distribution

### TestFlight (iOS)
```bash
# Build for TestFlight
cd ios && fastlane beta
```

### Google Play Beta (Android)
```bash
# Build for Play Store Beta
cd android && fastlane beta
```

## 🛡️ Security Headers

```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' wss: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "camera=*, microphone=*, geolocation=*" always;
```

## 📞 Support & Contact

- **Documentation**: https://docs.drone-control.yourdomain.com
- **API Status**: https://status.drone-control.yourdomain.com
- **Support Email**: support@drone-control.yourdomain.com
- **Discord**: https://discord.gg/dronecontrol
- **Telegram**: https://t.me/dronecontrol

## 📜 License

MIT License - See LICENSE file for details

---

**Ready to fly globally! 🚁🌍**