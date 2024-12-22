import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Details from './pages/Details';
import Inspection from './pages/Inspection';
import Return from './pages/Return';
import Profile from './pages/Profile';
import Logs from './pages/Logs';
import Navbar from './components/layout/Navbar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inspectionState, setInspectionState] = useState(null);
  const [returnState, setReturnState] = useState(null);
  const [logsState, setLogsState] = useState({
    details: null,
    logs: [],
    startTime: null,
    lastActionTime: null
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    resetAllStates();
  };

  const resetAllStates = () => {
    setInspectionState(null);
    setReturnState(null);
    setLogsState({
      details: null,
      logs: [],
      startTime: null,
      lastActionTime: null
    });
  };

  const handleDetailsSubmit = (details) => {
    const initialState = {
      inspectionData: details,
      defects: {},
      currentDefectCount: {},
      checkedQuantity: 0,
      goodOutput: 0,
      defectPieces: 0,
      language: 'english',
      view: 'list',
      isPlaying: false,
      timer: 0,
      startTime: null,
      hasDefectSelected: false
    };

    setInspectionState(initialState);
    setReturnState({
      ...initialState,
      returnDefectQty: 0
    });
    setLogsState(prev => ({
      ...prev,
      details
    }));
  };

  const handleLogEntry = (entry) => {
    const currentTime = new Date().getTime();
    let inspectionTime;

    if (logsState.logs.length === 0) {
      // First entry - calculate time from start
      inspectionTime = (currentTime - logsState.startTime) / 60000; // Convert to minutes
    } else {
      // Subsequent entries - calculate time from last action
      inspectionTime = (currentTime - logsState.lastActionTime) / 60000;
    }

    const newEntry = {
      ...entry,
      inspectionTime: inspectionTime.toFixed(2)
    };

    setLogsState(prev => ({
      ...prev,
      logs: [...prev.logs, newEntry],
      lastActionTime: currentTime
    }));
  };

  const handleSubmit = () => {
    // Generate PDF logic here
    resetAllStates();
    return <Navigate to="/details" replace />;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar onLogout={handleLogout} />}
        <div className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            {isAuthenticated ? (
              <>
                <Route path="/home" element={<Home />} />
                <Route 
                  path="/details" 
                  element={<Details onDetailsSubmit={handleDetailsSubmit} />} 
                />
                <Route 
                  path="/inspection" 
                  element={
                    <Inspection 
                      savedState={inspectionState}
                      onStateChange={setInspectionState}
                      onLogEntry={handleLogEntry}
                      onStartTime={(time) => setLogsState(prev => ({
                        ...prev,
                        startTime: time,
                        lastActionTime: time
                      }))}
                      onSubmit={handleSubmit}
                    />
                  }
                />
                <Route 
                  path="/return" 
                  element={
                    <Return 
                      savedState={returnState}
                      onStateChange={setReturnState}
                      onLogEntry={handleLogEntry}
                    />
                  }
                />
                <Route 
                  path="/logs" 
                  element={<Logs logsState={logsState} />} 
                />
                <Route path="/profile" element={<Profile />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/" replace />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
