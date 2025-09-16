import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ConnectionPanel from './components/ConnectionPanel';
import FlightControls from './components/FlightControls';
import TelemetryPanel from './components/TelemetryPanel';
import MapView from './components/MapView';
import CameraView from './components/CameraView';
import AttitudeIndicator from './components/AttitudeIndicator';
import MissionPlanner from './components/MissionPlanner';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [droneState, setDroneState] = useState({
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
  });

  const [activeView, setActiveView] = useState('flight');
  const [controlValues, setControlValues] = useState({
    throttle: 0,
    yaw: 0,
    pitch: 0,
    roll: 0
  });

  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to server');
      sendCommand({ type: 'GET_STATE' });
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'STATE') {
          setDroneState(message.data);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('Disconnected from server');
      setDroneState(prev => ({ ...prev, connected: false }));
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
  };

  const sendCommand = (command) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(command));
    }
  };

  const handleConnect = (port) => {
    sendCommand({ type: 'CONNECT', port });
  };

  const handleDisconnect = () => {
    sendCommand({ type: 'DISCONNECT' });
  };

  const handleArm = () => {
    sendCommand({ type: droneState.armed ? 'DISARM' : 'ARM' });
  };

  const handleTakeoff = () => {
    if (!droneState.armed) {
      alert('Please arm the drone first');
      return;
    }
    sendCommand({ type: 'TAKEOFF', altitude: 2 });
  };

  const handleLand = () => {
    sendCommand({ type: 'LAND' });
  };

  const handleRTH = () => {
    sendCommand({ type: 'RTH' });
  };

  const handleEmergency = () => {
    if (window.confirm('Emergency stop will immediately cut power to all motors. Continue?')) {
      sendCommand({ type: 'EMERGENCY' });
    }
  };

  const handleControlChange = (values) => {
    setControlValues(values);
    sendCommand({
      type: 'CONTROL',
      ...values
    });
  };

  const handleModeChange = (mode) => {
    sendCommand({ type: 'SET_MODE', mode });
  };

  const handleWaypointCommand = (action, data = {}) => {
    sendCommand({
      type: 'WAYPOINT',
      action,
      ...data
    });
  };

  const handleCameraCommand = (action, data = {}) => {
    sendCommand({
      type: 'CAMERA',
      action,
      ...data
    });
  };

  return (
    <div className="App">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo">
          <span className="logo-icon">🚁</span>
          <span className="logo-text">DRONE CONTROL</span>
        </div>
        
        <div className="status-indicators">
          <div className={`indicator ${droneState.connected ? 'connected' : 'disconnected'}`}>
            <span className="indicator-icon">📡</span>
            <span>{droneState.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className={`indicator ${droneState.armed ? 'armed' : ''}`}>
            <span className="indicator-icon">🔓</span>
            <span>{droneState.armed ? 'Armed' : 'Disarmed'}</span>
          </div>
          <div className="indicator">
            <span className="indicator-icon">🛰️</span>
            <span>{droneState.gps.satellites} sats</span>
          </div>
          <div className="indicator">
            <span className="indicator-icon">🔋</span>
            <span>{droneState.battery.toFixed(0)}%</span>
          </div>
        </div>

        <div className="view-selector">
          <button 
            className={activeView === 'flight' ? 'active' : ''}
            onClick={() => setActiveView('flight')}
          >
            Flight
          </button>
          <button 
            className={activeView === 'camera' ? 'active' : ''}
            onClick={() => setActiveView('camera')}
          >
            Camera
          </button>
          <button 
            className={activeView === 'map' ? 'active' : ''}
            onClick={() => setActiveView('map')}
          >
            Map
          </button>
          <button 
            className={activeView === 'mission' ? 'active' : ''}
            onClick={() => setActiveView('mission')}
          >
            Mission
          </button>
          <button 
            className={activeView === 'settings' ? 'active' : ''}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel */}
        <div className="left-panel">
          <ConnectionPanel
            connected={droneState.connected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          
          <TelemetryPanel
            altitude={droneState.altitude}
            speed={Math.sqrt(
              droneState.velocity.x ** 2 + 
              droneState.velocity.y ** 2 + 
              droneState.velocity.z ** 2
            )}
            distance={0}
            flightTime={0}
            mode={droneState.mode}
            onModeChange={handleModeChange}
          />

          <AttitudeIndicator
            roll={droneState.attitude.roll}
            pitch={droneState.attitude.pitch}
            yaw={droneState.attitude.yaw}
          />
        </div>

        {/* Center View */}
        <div className="center-view">
          {activeView === 'flight' && (
            <div className="flight-view">
              <div className="flight-status">
                <h2>{droneState.flying ? 'In Flight' : 'On Ground'}</h2>
                <p>Mode: {droneState.mode}</p>
                <p>Altitude: {droneState.altitude.toFixed(1)} m</p>
              </div>
              
              <FlightControls
                armed={droneState.armed}
                flying={droneState.flying}
                onArm={handleArm}
                onTakeoff={handleTakeoff}
                onLand={handleLand}
                onRTH={handleRTH}
                onEmergency={handleEmergency}
                onControlChange={handleControlChange}
                controlValues={controlValues}
              />
            </div>
          )}

          {activeView === 'camera' && (
            <CameraView
              recording={droneState.camera.recording}
              gimbalPitch={droneState.camera.gimbalPitch}
              onCameraCommand={handleCameraCommand}
              telemetry={{
                battery: droneState.battery,
                altitude: droneState.altitude,
                satellites: droneState.gps.satellites,
                mode: droneState.mode
              }}
            />
          )}

          {activeView === 'map' && (
            <MapView
              dronePosition={droneState.gps}
              waypoints={droneState.mission.waypoints}
              onWaypointAdd={(waypoint) => 
                handleWaypointCommand('ADD', { waypoint })
              }
              onWaypointRemove={(index) => 
                handleWaypointCommand('REMOVE', { index })
              }
            />
          )}

          {activeView === 'mission' && (
            <MissionPlanner
              waypoints={droneState.mission.waypoints}
              missionStatus={droneState.mission.status}
              currentWaypoint={droneState.mission.currentWaypoint}
              onWaypointCommand={handleWaypointCommand}
            />
          )}

          {activeView === 'settings' && (
            <SettingsPanel
              droneState={droneState}
              onSettingChange={(setting, value) => {
                sendCommand({ type: 'SETTING', setting, value });
              }}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="sensor-data">
            <h3>Sensors</h3>
            <div className="sensor-item">
              <span>Acc X:</span>
              <span>{droneState.sensors.accelerometer.x.toFixed(2)} m/s²</span>
            </div>
            <div className="sensor-item">
              <span>Acc Y:</span>
              <span>{droneState.sensors.accelerometer.y.toFixed(2)} m/s²</span>
            </div>
            <div className="sensor-item">
              <span>Acc Z:</span>
              <span>{droneState.sensors.accelerometer.z.toFixed(2)} m/s²</span>
            </div>
            <div className="sensor-item">
              <span>Gyro X:</span>
              <span>{droneState.sensors.gyroscope.x.toFixed(2)} °/s</span>
            </div>
            <div className="sensor-item">
              <span>Gyro Y:</span>
              <span>{droneState.sensors.gyroscope.y.toFixed(2)} °/s</span>
            </div>
            <div className="sensor-item">
              <span>Gyro Z:</span>
              <span>{droneState.sensors.gyroscope.z.toFixed(2)} °/s</span>
            </div>
            <div className="sensor-item">
              <span>Pressure:</span>
              <span>{droneState.sensors.barometer.toFixed(1)} hPa</span>
            </div>
            <div className="sensor-item">
              <span>Temp:</span>
              <span>{droneState.sensors.temperature.toFixed(1)} °C</span>
            </div>
          </div>

          <div className="gps-info">
            <h3>GPS</h3>
            <div className="gps-item">
              <span>Lat:</span>
              <span>{droneState.gps.lat.toFixed(6)}°</span>
            </div>
            <div className="gps-item">
              <span>Lng:</span>
              <span>{droneState.gps.lng.toFixed(6)}°</span>
            </div>
            <div className="gps-item">
              <span>Satellites:</span>
              <span>{droneState.gps.satellites}</span>
            </div>
            <div className="gps-item">
              <span>Fix:</span>
              <span className={droneState.gps.satellites >= 6 ? 'good' : 'poor'}>
                {droneState.gps.satellites >= 6 ? '3D Fix' : 'No Fix'}
              </span>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button 
              className="quick-btn"
              onClick={() => handleCameraCommand('TAKE_PHOTO')}
            >
              📷 Photo
            </button>
            <button 
              className={`quick-btn ${droneState.camera.recording ? 'recording' : ''}`}
              onClick={() => handleCameraCommand(
                droneState.camera.recording ? 'STOP_RECORDING' : 'START_RECORDING'
              )}
            >
              {droneState.camera.recording ? '⏹️ Stop' : '🔴 Record'}
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleWaypointCommand('START')}
              disabled={droneState.mission.waypoints.length === 0}
            >
              ▶️ Start Mission
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bottom-bar">
        <div className="status-text">
          Signal: {droneState.signalStrength}% | 
          Alt: {droneState.altitude.toFixed(1)}m | 
          Battery: {droneState.battery.toFixed(0)}% | 
          Mode: {droneState.mode} | 
          {droneState.flying ? 'FLYING' : 'LANDED'}
        </div>
      </div>
    </div>
  );
}

export default App;