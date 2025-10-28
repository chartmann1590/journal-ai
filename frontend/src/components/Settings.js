import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../index.css';

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'https://localhost')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'https://localhost');

function Settings() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    recipient_email: '',
    email_enabled: false,
    email_schedule: 'sunday_6pm',
    ollama_host: 'host.docker.internal:11434',
    ollama_model: 'llama2'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings`);
      setSettings(response.data);
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Failed to load settings');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/settings`, settings);
      toast.success('Settings saved successfully!');
      setSettings(response.data.settings);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);

    try {
      await axios.post(`${API_URL}/api/settings/test-email`);
      toast.success('Test email sent successfully! Check your inbox.');
    } catch (err) {
      console.error('Error sending test email:', err);
      toast.error(err.response?.data?.error || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleSendSummary = async () => {
    if (!window.confirm('Send weekly summary email now? This will use the past week\'s entries.')) {
      return;
    }

    setSending(true);

    try {
      const response = await axios.post(`${API_URL}/api/settings/send-summary`);
      if (response.data.success) {
        toast.success(`Weekly summary sent successfully! (${response.data.entriesCount} entries)`);
      } else {
        toast.info(response.data.message || 'Weekly summary not sent');
      }
    } catch (err) {
      console.error('Error sending weekly summary:', err);
      toast.error(err.response?.data?.error || 'Failed to send weekly summary');
    } finally {
      setSending(false);
    }
  };

  const loadOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const response = await axios.get(`${API_URL}/api/ollama/models`);
      setAvailableModels(response.data.models);
      setOllamaStatus('connected');
      toast.success('Models loaded successfully!');
    } catch (err) {
      console.error('Error loading Ollama models:', err);
      setOllamaStatus('disconnected');
      toast.error('Failed to load models. Check Ollama connection.');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestOllama = async () => {
    setTestingOllama(true);
    try {
      const response = await axios.post(`${API_URL}/api/ollama/test`, {
        host: settings.ollama_host
      });
      setOllamaStatus('connected');
      setAvailableModels(response.data.models);
      toast.success(`Connected to Ollama! Found ${response.data.models.length} models.`);
    } catch (err) {
      console.error('Error testing Ollama:', err);
      setOllamaStatus('disconnected');
      toast.error('Failed to connect to Ollama. Check host and ensure Ollama is running.');
    } finally {
      setTestingOllama(false);
    }
  };

  useEffect(() => {
    if (settings.ollama_host) {
      loadOllamaModels();
    }
  }, [settings.ollama_host]);

  return (
    <div className="settings-container">
      <div className="settings-grid">
        <div className="settings-card">
          <h2 className="card-title">📧 Email Configuration</h2>
          <p className="card-description">
            Set up SMTP to receive weekly journal summaries and insights.
          </p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="email_enabled">
                <input
                  type="checkbox"
                  id="email_enabled"
                  name="email_enabled"
                  checked={settings.email_enabled}
                  onChange={handleChange}
                />
                <span className="checkbox-label">Enable weekly email summaries</span>
              </label>
              <small>Receive a weekly summary every Sunday at 6 PM</small>
            </div>

            {settings.email_enabled && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="smtp_host">SMTP Host *</label>
                    <input
                      type="text"
                      id="smtp_host"
                      name="smtp_host"
                      value={settings.smtp_host}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                      className="input"
                      required={settings.email_enabled}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtp_port">SMTP Port *</label>
                    <input
                      type="number"
                      id="smtp_port"
                      name="smtp_port"
                      value={settings.smtp_port}
                      onChange={handleChange}
                      placeholder="587"
                      className="input"
                      required={settings.email_enabled}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="smtp_username">SMTP Username *</label>
                  <input
                    type="text"
                    id="smtp_username"
                    name="smtp_username"
                    value={settings.smtp_username}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                    className="input"
                    required={settings.email_enabled}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="smtp_password">SMTP Password *</label>
                  <input
                    type="password"
                    id="smtp_password"
                    name="smtp_password"
                    value={settings.smtp_password}
                    onChange={handleChange}
                    placeholder={settings.smtp_password === '********' ? 'Keep current password' : 'Enter password'}
                    className="input"
                    required={settings.email_enabled && settings.smtp_password === ''}
                  />
                  <small>Leave blank to keep current password</small>
                </div>

                <div className="form-group">
                  <label htmlFor="smtp_from_email">From Email *</label>
                  <input
                    type="email"
                    id="smtp_from_email"
                    name="smtp_from_email"
                    value={settings.smtp_from_email}
                    onChange={handleChange}
                    placeholder="noreply@yourjournal.com"
                    className="input"
                    required={settings.email_enabled}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recipient_email">Recipient Email</label>
                  <input
                    type="email"
                    id="recipient_email"
                    name="recipient_email"
                    value={settings.recipient_email}
                    onChange={handleChange}
                    placeholder="recipient@example.com (defaults to SMTP username)"
                    className="input"
                  />
                  <small>Email address to receive weekly summaries (defaults to SMTP username)</small>
                </div>

                <div className="settings-help">
                  <h4>📋 Common SMTP Providers</h4>
                  <ul>
                    <li><strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, Requires App Password</li>
                    <li><strong>SendGrid:</strong> Host: smtp.sendgrid.net, Port: 587</li>
                    <li><strong>Outlook:</strong> Host: smtp.office365.com, Port: 587</li>
                  </ul>
                </div>
              </>
            )}

            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '💾 Saving...' : '💾 Save Settings'}
              </button>

              {settings.email_enabled && (
                <>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    className="btn btn-secondary"
                    disabled={testing}
                  >
                    {testing ? '📧 Testing...' : '📧 Send Test Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendSummary}
                    className="btn btn-ai"
                    disabled={sending}
                  >
                    {sending ? '📬 Sending...' : '📬 Send Weekly Summary Now'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="settings-card">
          <h2 className="card-title">📊 Email Schedule</h2>
          <p className="card-description">
            Currently set to send weekly summaries every Sunday at 6:00 PM.
          </p>
          <div className="schedule-info">
            <div className="schedule-item">
              <span className="schedule-icon">📅</span>
              <div>
                <strong>Frequency:</strong> Weekly
              </div>
            </div>
            <div className="schedule-item">
              <span className="schedule-icon">⏰</span>
              <div>
                <strong>Day:</strong> Sunday
              </div>
            </div>
            <div className="schedule-item">
              <span className="schedule-icon">🕐</span>
              <div>
                <strong>Time:</strong> 6:00 PM
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="card-title">🤖 Ollama AI Configuration</h2>
          <p className="card-description">
            Configure your local Ollama instance for AI-powered journal analysis.
          </p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="ollama_host">Ollama Host</label>
              <input
                type="text"
                id="ollama_host"
                name="ollama_host"
                value={settings.ollama_host}
                onChange={handleChange}
                placeholder="host.docker.internal:11434"
                className="input"
              />
              <small>Host and port where Ollama is running (e.g., localhost:11434 or host.docker.internal:11434)</small>
            </div>

            <div className="form-group">
              <label htmlFor="ollama_model">AI Model</label>
              <select
                id="ollama_model"
                name="ollama_model"
                value={settings.ollama_model}
                onChange={handleChange}
                className="input"
                disabled={availableModels.length === 0}
              >
                {availableModels.length === 0 ? (
                  <option value="">No models available - Test connection first</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))
                )}
              </select>
              <small>Select the AI model to use for journal analysis</small>
            </div>

            <div className="connection-status">
              <div className={`status-indicator ${ollamaStatus === 'connected' ? 'connected' : ollamaStatus === 'disconnected' ? 'disconnected' : 'unknown'}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {ollamaStatus === 'connected' ? '✓ Connected' : ollamaStatus === 'disconnected' ? '✗ Disconnected' : '⚠ Unknown'}
                </span>
              </div>
              {availableModels.length > 0 && (
                <small>{availableModels.length} models available</small>
              )}
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '💾 Saving...' : '💾 Save Settings'}
              </button>

              <button
                type="button"
                onClick={handleTestOllama}
                className="btn btn-secondary"
                disabled={testingOllama}
              >
                {testingOllama ? '🔄 Testing...' : '🔌 Test Connection'}
              </button>

              <button
                type="button"
                onClick={loadOllamaModels}
                className="btn btn-ai"
                disabled={loadingModels}
              >
                {loadingModels ? '🔄 Loading...' : '🔄 Refresh Models'}
              </button>
            </div>
          </form>

          <div className="settings-help">
            <h4>💡 Ollama Setup Tips</h4>
            <ul>
              <li><strong>Local:</strong> Use localhost:11434 if Ollama is on your machine</li>
              <li><strong>Docker:</strong> Use host.docker.internal:11434 to access host from container</li>
              <li><strong>Install:</strong> Download Ollama from ollama.ai and run 'ollama serve'</li>
              <li><strong>Pull Models:</strong> Run 'ollama pull llama2' or 'ollama pull mistral' to download models</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

