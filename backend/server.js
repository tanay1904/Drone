const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Drone state management
let droneState = {
  connected: false,
  armed: false,
  flying: false,
  mode: 'STABILIZE',
  battery: 100,
  altitude: 0,
  gps: { lat: 37.7749, lng: -122.4194, satellites: 0 },
  attitude: { roll: 0, pitch: 0, yaw: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  signalStrength: 100,
  sensors: {
    accelerometer: { x: 0, y: 0, z: 9.8 },
    gyroscope: { x: 0, y: 0, z: 0 },
    magnetometer: { x: 0, y: 0, z: 0 },
    barometer: 1013.25,
    temperature: 25
  },
  telemetry: [],
  mission: {
    waypoints: [],
    currentWaypoint: 0,
    status: 'IDLE'
  },
  camera: {
    recording: false,
    gimbalPitch: 0,
    gimbalRoll: 0,
    gimbalYaw: 0
  }
};

// Serial port for drone communication
let serialPort = null;
let parser = null;

// Connect to drone via serial port
function connectToDrone(portName = '/dev/ttyACM0') {
  try {
    serialPort = new SerialPort(portName, {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPort.on('open', () => {
      console.log(`Connected to drone on ${portName}`);
      droneState.connected = true;
      broadcastState();
    });

    parser.on('data', (data) => {
      processDroneData(data);
    });

    serialPort.on('error', (err) => {
      console.error('Serial port error:', err);
      droneState.connected = false;
      broadcastState();
    });

    serialPort.on('close', () => {
      console.log('Drone disconnected');
      droneState.connected = false;
      broadcastState();
    });
  } catch (err) {
    console.error('Failed to connect to drone:', err);
  }
}

// Process incoming data from drone
function processDroneData(data) {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'TELEMETRY':
        updateTelemetry(message.data);
        break;
      case 'STATUS':
        updateStatus(message.data);
        break;
      case 'GPS':
        updateGPS(message.data);
        break;
      case 'ATTITUDE':
        updateAttitude(message.data);
        break;
      case 'SENSOR':
        updateSensors(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
    
    broadcastState();
  } catch (err) {
    console.error('Error processing drone data:', err);
  }
}

// Update functions
function updateTelemetry(data) {
  droneState.battery = data.battery || droneState.battery;
  droneState.altitude = data.altitude || droneState.altitude;
  droneState.signalStrength = data.signal || droneState.signalStrength;
  
  // Add to telemetry history
  droneState.telemetry.push({
    timestamp: Date.now(),
    ...data
  });
  
  // Keep only last 100 entries
  if (droneState.telemetry.length > 100) {
    droneState.telemetry.shift();
  }
}

function updateStatus(data) {
  droneState.armed = data.armed || droneState.armed;
  droneState.flying = data.flying || droneState.flying;
  droneState.mode = data.mode || droneState.mode;
}

function updateGPS(data) {
  droneState.gps = {
    lat: data.lat || droneState.gps.lat,
    lng: data.lng || droneState.gps.lng,
    satellites: data.satellites || droneState.gps.satellites
  };
}

function updateAttitude(data) {
  droneState.attitude = {
    roll: data.roll || droneState.attitude.roll,
    pitch: data.pitch || droneState.attitude.pitch,
    yaw: data.yaw || droneState.attitude.yaw
  };
}

function updateSensors(data) {
  droneState.sensors = { ...droneState.sensors, ...data };
}

// Send command to drone
function sendDroneCommand(command) {
  if (serialPort && serialPort.isOpen) {
    const cmdString = JSON.stringify(command) + '\n';
    serialPort.write(cmdString, (err) => {
      if (err) {
        console.error('Error sending command:', err);
      } else {
        console.log('Command sent:', command);
      }
    });
  } else {
    console.error('Drone not connected');
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'STATE',
    data: droneState
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
});

// Handle client messages
function handleClientMessage(message, ws) {
  console.log('Received from client:', message.type);
  
  switch (message.type) {
    case 'CONNECT':
      connectToDrone(message.port);
      break;
      
    case 'DISCONNECT':
      if (serialPort) {
        serialPort.close();
      }
      break;
      
    case 'ARM':
      sendDroneCommand({ cmd: 'ARM' });
      droneState.armed = true;
      break;
      
    case 'DISARM':
      sendDroneCommand({ cmd: 'DISARM' });
      droneState.armed = false;
      break;
      
    case 'TAKEOFF':
      sendDroneCommand({ cmd: 'TAKEOFF', altitude: message.altitude || 2 });
      droneState.flying = true;
      break;
      
    case 'LAND':
      sendDroneCommand({ cmd: 'LAND' });
      droneState.flying = false;
      break;
      
    case 'RTH':
      sendDroneCommand({ cmd: 'RTH' });
      break;
      
    case 'EMERGENCY':
      sendDroneCommand({ cmd: 'EMERGENCY_STOP' });
      droneState.flying = false;
      droneState.armed = false;
      break;
      
    case 'CONTROL':
      sendDroneCommand({
        cmd: 'CONTROL',
        throttle: message.throttle,
        yaw: message.yaw,
        pitch: message.pitch,
        roll: message.roll
      });
      break;
      
    case 'SET_MODE':
      sendDroneCommand({ cmd: 'SET_MODE', mode: message.mode });
      droneState.mode = message.mode;
      break;
      
    case 'WAYPOINT':
      handleWaypointCommand(message);
      break;
      
    case 'CAMERA':
      handleCameraCommand(message);
      break;
      
    case 'GET_STATE':
      ws.send(JSON.stringify({
        type: 'STATE',
        data: droneState
      }));
      break;
      
    default:
      console.log('Unknown command:', message.type);
  }
  
  broadcastState();
}

// Handle waypoint commands
function handleWaypointCommand(message) {
  switch (message.action) {
    case 'ADD':
      droneState.mission.waypoints.push(message.waypoint);
      break;
    case 'REMOVE':
      droneState.mission.waypoints.splice(message.index, 1);
      break;
    case 'CLEAR':
      droneState.mission.waypoints = [];
      break;
    case 'START':
      droneState.mission.status = 'ACTIVE';
      sendDroneCommand({
        cmd: 'MISSION_START',
        waypoints: droneState.mission.waypoints
      });
      break;
    case 'PAUSE':
      droneState.mission.status = 'PAUSED';
      sendDroneCommand({ cmd: 'MISSION_PAUSE' });
      break;
    case 'RESUME':
      droneState.mission.status = 'ACTIVE';
      sendDroneCommand({ cmd: 'MISSION_RESUME' });
      break;
    case 'STOP':
      droneState.mission.status = 'IDLE';
      sendDroneCommand({ cmd: 'MISSION_STOP' });
      break;
  }
}

// Handle camera commands
function handleCameraCommand(message) {
  switch (message.action) {
    case 'START_RECORDING':
      droneState.camera.recording = true;
      sendDroneCommand({ cmd: 'CAMERA_RECORD', action: 'START' });
      break;
    case 'STOP_RECORDING':
      droneState.camera.recording = false;
      sendDroneCommand({ cmd: 'CAMERA_RECORD', action: 'STOP' });
      break;
    case 'TAKE_PHOTO':
      sendDroneCommand({ cmd: 'CAMERA_PHOTO' });
      break;
    case 'GIMBAL':
      droneState.camera.gimbalPitch = message.pitch || droneState.camera.gimbalPitch;
      droneState.camera.gimbalRoll = message.roll || droneState.camera.gimbalRoll;
      droneState.camera.gimbalYaw = message.yaw || droneState.camera.gimbalYaw;
      sendDroneCommand({
        cmd: 'GIMBAL_CONTROL',
        pitch: message.pitch,
        roll: message.roll,
        yaw: message.yaw
      });
      break;
  }
}

// Broadcast state to all connected clients
function broadcastState() {
  const stateMessage = JSON.stringify({
    type: 'STATE',
    data: droneState
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateMessage);
    }
  });
}

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json(droneState);
});

app.get('/api/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json(ports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/connect', (req, res) => {
  const { port } = req.body;
  connectToDrone(port);
  res.json({ message: 'Connecting to drone...' });
});

app.post('/api/disconnect', (req, res) => {
  if (serialPort) {
    serialPort.close();
  }
  res.json({ message: 'Disconnected from drone' });
});

app.post('/api/command', (req, res) => {
  const command = req.body;
  sendDroneCommand(command);
  res.json({ message: 'Command sent', command });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Simulation mode (for testing without real drone)
let simulationInterval = null;

function startSimulation() {
  console.log('Starting simulation mode...');
  droneState.connected = true;
  
  simulationInterval = setInterval(() => {
    // Simulate telemetry updates
    droneState.battery = Math.max(0, droneState.battery - 0.1);
    droneState.altitude += (Math.random() - 0.5) * 0.2;
    droneState.attitude.roll += (Math.random() - 0.5) * 2;
    droneState.attitude.pitch += (Math.random() - 0.5) * 2;
    droneState.attitude.yaw += (Math.random() - 0.5) * 1;
    droneState.gps.lat += (Math.random() - 0.5) * 0.00001;
    droneState.gps.lng += (Math.random() - 0.5) * 0.00001;
    droneState.gps.satellites = Math.floor(Math.random() * 5) + 8;
    
    // Normalize attitude values
    droneState.attitude.roll = Math.max(-30, Math.min(30, droneState.attitude.roll));
    droneState.attitude.pitch = Math.max(-30, Math.min(30, droneState.attitude.pitch));
    droneState.attitude.yaw = droneState.attitude.yaw % 360;
    
    broadcastState();
  }, 100);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  
  // Start in simulation mode if no drone connected
  if (!serialPort) {
    startSimulation();
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  stopSimulation();
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  server.close();
  process.exit(0);
});