import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import Navigation from './components/Navigation';
import Home from './components/Home';
import History from './components/History';
import Settings from './components/Settings';
import CalendarView from './components/CalendarView';
import EntryDetail from './components/EntryDetail';

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'https://localhost')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'https://localhost');

function App() {
  const [entries, setEntries] = useState([]);
  const [aiStatus, setAiStatus] = useState({ status: 'unknown', models: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load entries and check AI status on mount
  useEffect(() => {
    loadEntries();
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ai/status`);
      setAiStatus(response.data);
    } catch (err) {
      console.error('Error checking AI status:', err);
      setAiStatus({ status: 'disconnected', models: [] });
    }
  };

  const loadEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/entries`);
      setEntries(response.data);
    } catch (err) {
      console.error('Error loading entries:', err);
    }
  };

  const handleEntryAdded = () => {
    loadEntries();
  };

  const handleEntryDeleted = () => {
    loadEntries();
  };

  const handleEntryUpdated = () => {
    loadEntries();
  };

  return (
    <Router>
      <div className="App">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span className={sidebarOpen ? 'hamburger open' : 'hamburger'}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Sidebar Overlay */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div className={`sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-section">
            <div className="logo">JOURNAL</div>
            <div className="tagline">AI-Powered Mental Health</div>
          </div>

          <Navigation onLinkClick={() => setSidebarOpen(false)} />

          <div className="ai-status-sidebar">
            <div className="status-label">AI Status</div>
            <div className="status-content">
              <div className={`status-dot ${aiStatus.status === 'connected' ? 'connected' : 'disconnected'}`}></div>
              <span className="status-text">
                {aiStatus.status === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
            {aiStatus.models && aiStatus.models.length > 0 && (
              <div className="models-count">{aiStatus.models.length} models available</div>
            )}
          </div>
        </div>

        <main className="main-view">
          <Routes>
            <Route
              path="/"
              element={<Home entries={entries} onEntryAdded={handleEntryAdded} aiStatus={aiStatus} />}
            />
            <Route
              path="/history"
              element={
                <History
                  entries={entries}
                  aiStatus={aiStatus}
                  onEntryDeleted={handleEntryDeleted}
                  onEntryUpdated={handleEntryUpdated}
                />
              }
            />
            <Route
              path="/calendar"
              element={<CalendarView entries={entries} />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/entries/:id" element={<EntryDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
