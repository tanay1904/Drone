const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const cors = require('cors');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const fs = require('fs');
const redis = require('redis');
const { Peer } = require('simple-peer');
const wrtc = require('wrtc');

// DJI-style infrastructure components
const app = express();
const server = http.createServer(app);

// Multi-protocol support
const protocols = {
  ws: new WebSocket.Server({ noServer: true }),
  mqtt: null,
  webrtc: new Map(),
  cellular: null
};

// Redis for session management and pub/sub
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Server cluster configuration for dynamic switching
const serverClusters = {
  primary: {
    url: process.env.PRIMARY_SERVER || 'https://drone-primary.example.com',
    region: 'us-west',
    priority: 1,
    latency: 0,
    available: true
  },
  secondary: {
    url: process.env.SECONDARY_SERVER || 'https://drone-secondary.example.com',
    region: 'us-east',
    priority: 2,
    latency: 0,
    available: true
  },
  edge: {
    url: process.env.EDGE_SERVER || 'https://drone-edge.example.com',
    region: 'edge',
    priority: 3,
    latency: 0,
    available: true
  },
  cellular: {
    url: process.env.CELLULAR_SERVER || 'https://drone-lte.example.com',
    region: 'cellular',
    priority: 4,
    latency: 0,
    available: true
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Enhanced drone state with DJI-like telemetry
let droneState = {
  // Connection state
  connected: false,
  connectionType: 'none', // wifi, lte, 5g, satellite
  signalQuality: {
    rssi: -50,
    snr: 30,
    ber: 0,
    latency: 20,
    bandwidth: 100
  },
  
  // Flight state
  armed: false,
  flying: false,
  mode: 'STABILIZE',
  
  // Navigation
  gps: {
    lat: 37.7749,
    lng: -122.4194,
    alt: 0,
    satellites: 0,
    hdop: 1.0,
    vdop: 1.0,
    fix: 'NO_FIX', // NO_FIX, 2D, 3D, DGPS, RTK_FLOAT, RTK_FIXED
    speed: 0,
    heading: 0
  },
  
  // Attitude and motion
  attitude: { roll: 0, pitch: 0, yaw: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 9.81 },
  
  // Power system
  battery: {
    voltage: 12.6,
    current: 0,
    percentage: 100,
    remaining: 1800, // seconds
    temperature: 25,
    cells: [4.2, 4.2, 4.2], // Individual cell voltages
    cycles: 0,
    health: 100
  },
  
  // Sensors
  sensors: {
    imu: {
      accelerometer: { x: 0, y: 0, z: 9.81 },
      gyroscope: { x: 0, y: 0, z: 0 },
      magnetometer: { x: 25, y: 2, z: -40 },
      temperature: 25
    },
    barometer: {
      pressure: 1013.25,
      altitude: 0,
      temperature: 25,
      humidity: 60
    },
    optical: {
      flow: { x: 0, y: 0 },
      distance: 0,
      quality: 100
    },
    radar: {
      front: 100,
      rear: 100,
      left: 100,
      right: 100,
      top: 100,
      bottom: 0
    }
  },
  
  // Mission
  mission: {
    waypoints: [],
    currentWaypoint: 0,
    status: 'IDLE',
    progress: 0,
    eta: 0,
    distance: 0
  },
  
  // Camera/Gimbal
  camera: {
    recording: false,
    streaming: false,
    resolution: '4K',
    fps: 30,
    bitrate: 100000,
    gimbal: {
      pitch: 0,
      roll: 0,
      yaw: 0,
      mode: 'FPV' // FPV, FOLLOW, FREE
    },
    zoom: 1.0,
    exposure: 0,
    iso: 100,
    shutter: '1/60'
  },
  
  // Telemetry history
  telemetry: [],
  
  // System health
  system: {
    cpu: 45,
    memory: 512,
    storage: 8192,
    temperature: 45,
    uptime: 0,
    errors: [],
    warnings: []
  },
  
  // Cellular/eSIM state
  cellular: {
    enabled: false,
    simType: 'none', // physical, esim, dual
    carrier: '',
    technology: '', // 3G, 4G, 5G
    signal: -100,
    dataUsage: 0,
    roaming: false,
    apn: '',
    imei: '',
    iccid: ''
  }
};

// MQTT Configuration for telemetry
function setupMQTT() {
  const mqttOptions = {
    host: process.env.MQTT_HOST || 'localhost',
    port: process.env.MQTT_PORT || 1883,
    protocol: 'mqtt',
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clientId: `drone_server_${Date.now()}`
  };

  protocols.mqtt = mqtt.connect(mqttOptions);

  protocols.mqtt.on('connect', () => {
    console.log('MQTT broker connected');
    
    // Subscribe to drone telemetry topics
    protocols.mqtt.subscribe('drone/+/telemetry');
    protocols.mqtt.subscribe('drone/+/status');
    protocols.mqtt.subscribe('drone/+/command');
    protocols.mqtt.subscribe('drone/+/mission');
    protocols.mqtt.subscribe('drone/+/video');
  });

  protocols.mqtt.on('message', (topic, message) => {
    handleMQTTMessage(topic, message);
  });
}

// Handle MQTT messages
function handleMQTTMessage(topic, message) {
  const topicParts = topic.split('/');
  const droneId = topicParts[1];
  const messageType = topicParts[2];
  
  try {
    const data = JSON.parse(message.toString());
    
    switch (messageType) {
      case 'telemetry':
        updateDroneTelemetry(droneId, data);
        break;
      case 'status':
        updateDroneStatus(droneId, data);
        break;
      case 'mission':
        updateMissionStatus(droneId, data);
        break;
      case 'video':
        handleVideoStream(droneId, data);
        break;
    }
    
    // Broadcast to WebSocket clients
    broadcastState();
  } catch (err) {
    console.error('Error processing MQTT message:', err);
  }
}

// WebRTC setup for video streaming
function setupWebRTC(ws, droneId) {
  const peer = new Peer({
    initiator: true,
    wrtc: wrtc,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:turnserver.example.com:3478',
          username: process.env.TURN_USER,
          credential: process.env.TURN_PASS
        }
      ]
    }
  });

  peer.on('signal', (data) => {
    ws.send(JSON.stringify({
      type: 'WEBRTC_SIGNAL',
      droneId: droneId,
      signal: data
    }));
  });

  peer.on('connect', () => {
    console.log(`WebRTC connected for drone ${droneId}`);
    protocols.webrtc.set(droneId, peer);
  });

  peer.on('data', (data) => {
    handleWebRTCData(droneId, data);
  });

  peer.on('stream', (stream) => {
    handleWebRTCStream(droneId, stream);
  });

  return peer;
}

// Cellular modem interface
class CellularModem {
  constructor() {
    this.connected = false;
    this.port = null;
    this.simType = 'none';
    this.dataConnection = null;
  }

  async connect(portName = '/dev/ttyUSB0') {
    try {
      this.port = new SerialPort(portName, {
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      this.port.on('open', () => {
        console.log('Cellular modem connected');
        this.initializeModem();
      });

      parser.on('data', (data) => {
        this.processModemResponse(data);
      });

    } catch (err) {
      console.error('Failed to connect cellular modem:', err);
    }
  }

  async initializeModem() {
    // Initialize modem with AT commands
    await this.sendATCommand('AT');                    // Check modem
    await this.sendATCommand('AT+CPIN?');             // Check SIM status
    await this.sendATCommand('AT+CREG?');             // Check network registration
    await this.sendATCommand('AT+CSQ');               // Check signal quality
    await this.sendATCommand('AT+COPS?');             // Check operator
    await this.sendATCommand('AT+CGATT=1');           // Attach to packet service
    await this.sendATCommand('AT+CGDCONT=1,"IP","internet"'); // Set APN
    await this.sendATCommand('AT+CGACT=1,1');         // Activate PDP context
    
    // Check for eSIM
    await this.checkESIM();
  }

  async checkESIM() {
    const response = await this.sendATCommand('AT+CEUICC?');
    if (response.includes('OK')) {
      this.simType = 'esim';
      // Get eSIM profiles
      await this.sendATCommand('AT+CEUICCPROFILE?');
    }
  }

  async switchProfile(profileId) {
    if (this.simType === 'esim') {
      await this.sendATCommand(`AT+CEUICCSWITCH=${profileId}`);
    }
  }

  sendATCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        reject('Modem not connected');
        return;
      }

      this.port.write(command + '\r\n', (err) => {
        if (err) {
          reject(err);
        } else {
          // Wait for response
          setTimeout(() => resolve('OK'), 500);
        }
      });
    });
  }

  processModemResponse(data) {
    // Process modem responses
    if (data.includes('+CSQ:')) {
      // Signal quality
      const match = data.match(/\+CSQ: (\d+),(\d+)/);
      if (match) {
        const rssi = parseInt(match[1]);
        const ber = parseInt(match[2]);
        droneState.cellular.signal = -113 + (rssi * 2); // Convert to dBm
      }
    } else if (data.includes('+COPS:')) {
      // Operator info
      const match = data.match(/\+COPS: \d+,\d+,"([^"]+)"/);
      if (match) {
        droneState.cellular.carrier = match[1];
      }
    } else if (data.includes('+CREG:')) {
      // Network registration
      const match = data.match(/\+CREG: \d+,(\d+)/);
      if (match) {
        droneState.cellular.enabled = match[1] === '1' || match[1] === '5';
        droneState.cellular.roaming = match[1] === '5';
      }
    }
  }

  async enableDataConnection() {
    // Establish data connection
    await this.sendATCommand('AT+CGDATA="PPP",1');
    this.dataConnection = true;
    droneState.connectionType = this.getNetworkTechnology();
  }

  getNetworkTechnology() {
    // Detect network technology (3G/4G/5G)
    // This would be based on modem responses
    return '4G'; // Simplified
  }
}

// Dynamic server switching logic
class ServerManager {
  constructor() {
    this.activeServer = 'primary';
    this.failoverInProgress = false;
    this.healthCheckInterval = null;
  }

  start() {
    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkServersHealth();
    }, 5000);

    // Initial server selection
    this.selectBestServer();
  }

  async checkServersHealth() {
    for (const [name, server] of Object.entries(serverClusters)) {
      try {
        const start = Date.now();
        const response = await fetch(`${server.url}/health`, {
          timeout: 2000
        }).catch(() => null);
        
        if (response && response.ok) {
          server.latency = Date.now() - start;
          server.available = true;
        } else {
          server.available = false;
        }
      } catch (err) {
        server.available = false;
      }
    }

    // Check if we need to switch servers
    if (!serverClusters[this.activeServer].available) {
      this.failover();
    } else {
      this.optimizeServerSelection();
    }
  }

  selectBestServer() {
    // Select server based on availability, latency, and priority
    const availableServers = Object.entries(serverClusters)
      .filter(([name, server]) => server.available)
      .sort((a, b) => {
        // First sort by priority
        if (a[1].priority !== b[1].priority) {
          return a[1].priority - b[1].priority;
        }
        // Then by latency
        return a[1].latency - b[1].latency;
      });

    if (availableServers.length > 0) {
      this.switchToServer(availableServers[0][0]);
    }
  }

  async failover() {
    if (this.failoverInProgress) return;
    
    this.failoverInProgress = true;
    console.log(`Server ${this.activeServer} failed, initiating failover...`);

    // Find next available server
    const servers = Object.entries(serverClusters)
      .filter(([name, server]) => name !== this.activeServer && server.available)
      .sort((a, b) => a[1].priority - b[1].priority);

    if (servers.length > 0) {
      await this.switchToServer(servers[0][0]);
    } else {
      console.error('No available servers for failover!');
      // Activate emergency local mode
      this.activateLocalMode();
    }

    this.failoverInProgress = false;
  }

  async switchToServer(serverName) {
    console.log(`Switching from ${this.activeServer} to ${serverName}`);
    
    const oldServer = this.activeServer;
    const newServer = serverClusters[serverName];

    try {
      // Notify clients about server switch
      broadcastMessage({
        type: 'SERVER_SWITCH',
        from: oldServer,
        to: serverName,
        url: newServer.url
      });

      // Migrate active sessions
      await this.migrateSessions(oldServer, serverName);

      // Update active server
      this.activeServer = serverName;

      // Update connection endpoints
      this.updateConnectionEndpoints(newServer);

      console.log(`Successfully switched to ${serverName}`);
    } catch (err) {
      console.error('Server switch failed:', err);
      // Rollback if needed
      this.activeServer = oldServer;
    }
  }

  async migrateSessions(fromServer, toServer) {
    // Get active sessions from Redis
    const sessions = await redisClient.keys('session:*');
    
    for (const sessionKey of sessions) {
      const sessionData = await redisClient.get(sessionKey);
      // Replicate session to new server
      await this.replicateSession(toServer, sessionKey, sessionData);
    }
  }

  async replicateSession(server, key, data) {
    // Send session data to new server
    const serverUrl = serverClusters[server].url;
    await fetch(`${serverUrl}/api/session/replicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data })
    });
  }

  updateConnectionEndpoints(server) {
    // Update WebSocket endpoint
    if (protocols.ws) {
      // Notify clients to reconnect
      protocols.ws.clients.forEach(client => {
        client.send(JSON.stringify({
          type: 'RECONNECT',
          url: server.url
        }));
      });
    }

    // Update MQTT broker
    if (protocols.mqtt) {
      protocols.mqtt.end();
      // Reconnect to new MQTT broker
      setupMQTT();
    }
  }

  optimizeServerSelection() {
    // Check if there's a better server available
    const currentLatency = serverClusters[this.activeServer].latency;
    
    for (const [name, server] of Object.entries(serverClusters)) {
      if (server.available && 
          server.priority <= serverClusters[this.activeServer].priority &&
          server.latency < currentLatency - 50) { // 50ms improvement threshold
        console.log(`Found better server: ${name} (${server.latency}ms vs ${currentLatency}ms)`);
        this.switchToServer(name);
        break;
      }
    }
  }

  activateLocalMode() {
    console.log('Activating local emergency mode');
    // Switch to local processing only
    droneState.connectionType = 'local';
    // Implement emergency procedures
  }
}

// Initialize cellular modem
const cellularModem = new CellularModem();

// Initialize server manager
const serverManager = new ServerManager();

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    protocols.ws.handleUpgrade(request, socket, head, (ws) => {
      protocols.ws.emit('connection', ws, request);
      handleWebSocketConnection(ws);
    });
  }
});

// WebSocket connection handling
function handleWebSocketConnection(ws) {
  console.log('New WebSocket client connected');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'STATE',
    data: droneState,
    server: serverManager.activeServer,
    cluster: serverClusters
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      handleClientMessage(msg, ws);
    } catch (err) {
      console.error('Error handling client message:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
}

// Enhanced client message handling
function handleClientMessage(message, ws) {
  console.log('Received from client:', message.type);
  
  switch (message.type) {
    case 'CONNECT_SERIAL':
      connectDroneSerial(message.port);
      break;
      
    case 'CONNECT_CELLULAR':
      connectCellular();
      break;
      
    case 'SWITCH_NETWORK':
      switchNetwork(message.networkType);
      break;
      
    case 'WEBRTC_INIT':
      setupWebRTC(ws, message.droneId);
      break;
      
    case 'WEBRTC_SIGNAL':
      handleWebRTCSignal(message.droneId, message.signal);
      break;
      
    case 'CONTROL':
      sendControlCommand(message);
      publishMQTT('drone/control', message);
      break;
      
    case 'MISSION':
      handleMissionCommand(message);
      publishMQTT('drone/mission', message);
      break;
      
    case 'CAMERA':
      handleCameraCommand(message);
      publishMQTT('drone/camera', message);
      break;
      
    case 'EMERGENCY':
      handleEmergencyCommand();
      break;
      
    case 'SERVER_SELECT':
      serverManager.switchToServer(message.server);
      break;
      
    default:
      // Forward to MQTT
      publishMQTT(`drone/command/${message.type}`, message);
  }
  
  broadcastState();
}

// Connect via cellular
async function connectCellular() {
  try {
    await cellularModem.connect();
    await cellularModem.enableDataConnection();
    droneState.cellular.enabled = true;
    droneState.connectionType = 'lte';
    console.log('Cellular connection established');
  } catch (err) {
    console.error('Cellular connection failed:', err);
  }
}

// Switch network type
async function switchNetwork(networkType) {
  console.log(`Switching to network: ${networkType}`);
  
  switch (networkType) {
    case 'wifi':
      droneState.connectionType = 'wifi';
      break;
    case 'cellular':
      await connectCellular();
      break;
    case 'satellite':
      // Connect to satellite network
      droneState.connectionType = 'satellite';
      break;
  }
}

// Publish to MQTT
function publishMQTT(topic, data) {
  if (protocols.mqtt && protocols.mqtt.connected) {
    protocols.mqtt.publish(topic, JSON.stringify(data));
  }
}

// Broadcast state to all connected clients
function broadcastState() {
  const stateMessage = JSON.stringify({
    type: 'STATE',
    data: droneState,
    server: serverManager.activeServer,
    timestamp: Date.now()
  });
  
  // WebSocket broadcast
  protocols.ws.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateMessage);
    }
  });
  
  // MQTT publish
  publishMQTT('drone/state', droneState);
  
  // Redis publish for cluster sync
  redisClient.publish('drone:state', stateMessage);
}

// Broadcast message to all clients
function broadcastMessage(message) {
  const msgString = JSON.stringify(message);
  
  protocols.ws.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgString);
    }
  });
}

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    drone: droneState,
    server: serverManager.activeServer,
    clusters: serverClusters,
    connections: {
      ws: protocols.ws.clients.size,
      mqtt: protocols.mqtt ? protocols.mqtt.connected : false,
      webrtc: protocols.webrtc.size,
      cellular: droneState.cellular.enabled
    }
  });
});

app.get('/api/servers', (req, res) => {
  res.json(serverClusters);
});

app.post('/api/server/switch', (req, res) => {
  const { server } = req.body;
  serverManager.switchToServer(server);
  res.json({ message: `Switching to ${server}` });
});

app.get('/api/cellular/status', (req, res) => {
  res.json(droneState.cellular);
});

app.post('/api/cellular/esim/profile', async (req, res) => {
  const { profileId } = req.body;
  try {
    await cellularModem.switchProfile(profileId);
    res.json({ message: 'eSIM profile switched', profileId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    server: serverManager.activeServer
  });
});

// WebRTC signaling endpoint
app.post('/api/webrtc/signal', (req, res) => {
  const { droneId, signal } = req.body;
  // Forward signal to drone
  publishMQTT(`drone/${droneId}/webrtc`, signal);
  res.json({ message: 'Signal sent' });
});

// Mission API
app.post('/api/mission/upload', (req, res) => {
  const mission = req.body;
  droneState.mission.waypoints = mission.waypoints;
  publishMQTT('drone/mission/upload', mission);
  res.json({ message: 'Mission uploaded', waypoints: mission.waypoints.length });
});

// Telemetry data endpoint
app.post('/api/telemetry', (req, res) => {
  const telemetry = req.body;
  
  // Store in time-series database
  droneState.telemetry.push({
    timestamp: Date.now(),
    ...telemetry
  });
  
  // Keep only last 1000 entries
  if (droneState.telemetry.length > 1000) {
    droneState.telemetry.shift();
  }
  
  // Forward to MQTT
  publishMQTT('drone/telemetry', telemetry);
  
  res.json({ message: 'Telemetry received' });
});

// Initialize services
async function initialize() {
  // Connect to Redis
  await redisClient.connect();
  console.log('Redis connected');
  
  // Setup MQTT
  setupMQTT();
  
  // Initialize server manager
  serverManager.start();
  
  // Check for cellular modem
  if (process.env.ENABLE_CELLULAR === 'true') {
    await connectCellular();
  }
  
  console.log('All services initialized');
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`Enhanced drone server running on port ${PORT}`);
  console.log('Protocols: WebSocket, MQTT, WebRTC, HTTP');
  console.log('Features: Dynamic server switching, Cellular/eSIM support');
  
  await initialize();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  
  if (protocols.mqtt) protocols.mqtt.end();
  if (cellularModem.port) cellularModem.port.close();
  
  await redisClient.quit();
  server.close();
  process.exit(0);
});

module.exports = { droneState, serverManager, cellularModem };