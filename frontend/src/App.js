import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [aiStatus, setAiStatus] = useState({ status: 'unknown', models: [] });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent(prevContent => {
          if (prevContent && !prevContent.endsWith(' ')) {
            return prevContent + ' ' + transcript;
          }
          return prevContent + transcript;
        });
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Voice recording error: ' + event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

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
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/entries`);
      setEntries(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.post(`${API_URL}/api/entries`, {
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
      });
      
      setSuccess('Entry saved successfully!');
      setTitle('');
      setContent('');
      loadEntries();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/entries/${id}`);
      setSuccess('Entry deleted successfully!');
      loadEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
    }
  };

  const handleAIAnalysis = async (entry) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/ai/analyze`, {
        content: entry.content,
      });

      await axios.put(`${API_URL}/api/entries/${entry.id}`, {
        ...entry,
        ai_response: response.data.response,
      });

      loadEntries();
      setSuccess('AI analysis completed!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to get AI analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      setError('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌟 Mental Health Journal</h1>
        <p>Your safe space for reflection and growth</p>
      </header>

      <div className="main-content">
        {/* AI Status */}
        <div className="ai-status">
          <div className={`status-indicator ${aiStatus.status === 'connected' ? 'connected' : 'disconnected'}`}></div>
          <span>
            AI Status: {aiStatus.status === 'connected' ? 'Connected' : 'Disconnected'}
            {aiStatus.models && aiStatus.models.length > 0 && 
              ` (${aiStatus.models.length} model${aiStatus.models.length > 1 ? 's' : ''} available)`
            }
          </span>
        </div>

        {/* Messages */}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Journal Form */}
        <form onSubmit={handleSubmit} className="journal-form">
          <h2>New Journal Entry</h2>
          
          <div className="form-group">
            <label htmlFor="title">Title (Optional)</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Your Thoughts</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write or speak your thoughts here..."
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
            
            {recognition && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`btn-voice ${isRecording ? 'recording' : ''}`}
              >
                🎤 {isRecording ? 'Stop Recording' : 'Voice Input'}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => { setTitle(''); setContent(''); }}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Entries List */}
        <div className="entries-list">
          <h2>Previous Entries</h2>
          
          {loading && <div className="loading">Loading...</div>}
          
          {entries.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No entries yet. Start journaling to see your entries here!
            </p>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <h3 className="entry-title">{entry.title}</h3>
                <span className="entry-date">{formatDate(entry.created_at)}</span>
              </div>
              
              <div className="entry-content">{entry.content}</div>
              
              {entry.ai_response && (
                <div className="entry-ai-response">
                  <h4>💡 AI Insights</h4>
                  <p>{entry.ai_response}</p>
                </div>
              )}
              
              <div className="entry-actions">
                {!entry.ai_response && (
                  <button
                    onClick={() => handleAIAnalysis(entry)}
                    className="btn-info btn-small"
                    disabled={loading || aiStatus.status !== 'connected'}
                  >
                    Get AI Insights
                  </button>
                )}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
