import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'https://localhost')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'https://localhost');

function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const loadEntry = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/entries/${id}`);
      setEntry(res.data);
    } catch (e) {
      setError('Failed to load entry');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title || 'Untitled Entry');
    setEditContent(entry.content || '');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const saveEdit = async (reanalyzeAll = false) => {
    if (!entry) return;
    try {
      setLoading(true);
      setError('');
      const updated = await axios.put(`${API_URL}/api/entries/${entry.id}`, {
        title: editTitle,
        content: editContent,
        ai_response: entry.ai_response || null,
      });
      let newEntry = updated.data;
      if (reanalyzeAll) {
        // Recompute metadata and AI analysis
        const meta = await axios.post(`${API_URL}/api/entries/${entry.id}/metadata`);
        newEntry = meta.data;
        const analyzed = await axios.post(`${API_URL}/api/entries/${entry.id}/analyze`);
        newEntry = analyzed.data;
        toast.success('Saved and reanalyzed successfully');
      } else {
        toast.success('Entry updated');
      }
      setEntry(newEntry);
      setEditMode(false);
    } catch (e) {
      console.error(e);
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!entry) return;
    try {
      setAnalyzing(true);
      const updated = await axios.post(`${API_URL}/api/entries/${entry.id}/analyze`);
      setEntry(updated.data);
      toast.success('AI analysis updated');
    } catch (e) {
      console.error(e);
      setError('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReanalyzeMetadata = async () => {
    if (!entry) return;
    try {
      setAnalyzing(true);
      const updated = await axios.post(`${API_URL}/api/entries/${entry.id}/metadata`);
      setEntry(updated.data);
      toast.success('Tags and emotions updated');
    } catch (e) {
      console.error(e);
      setError('Failed to re-analyze tags/emotions');
    } finally {
      setAnalyzing(false);
    }
  };

  const Chips = ({ items, type }) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <div className="chips-row">
        {items.map((t, idx) => (
          <span key={idx} className={`chip ${type === 'emotion' ? 'chip-emotion' : 'chip-tag'}`}>{type === 'tag' ? `#${t}` : t}</span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="container"><div className="loading">Loading entry…</div></div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!entry) return null;

  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>

      <div className="settings-card" style={{ marginTop: '1rem' }}>
        {editMode ? (
          <input
            className="input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ marginBottom: '0.75rem' }}
          />
        ) : (
          <h2 className="card-title">{entry.title}</h2>
        )}
        <div className="entry-meta" style={{ marginBottom: '0.75rem', color: 'var(--text-tertiary)' }}>
          <time>{new Date(entry.created_at).toLocaleString()}</time>
        </div>

        <Chips items={entry.tags} type="tag" />
        <Chips items={entry.emotions} type="emotion" />

        {editMode ? (
          <textarea
            className="textarea"
            rows={10}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{ marginTop: '1rem' }}
          />
        ) : (
          <div className="timeline-text" style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            {entry.content}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          {entry.ai_response ? (
            <div className="entry-ai-preview">
              <strong>AI Insight:</strong>
              <div style={{ marginTop: '0.5rem' }}>{entry.ai_response}</div>
            </div>
          ) : (
            <div className="entry-ai-preview">
              <strong>AI Insight:</strong> <em>No analysis yet.</em>
            </div>
          )}
        </div>

        <div className="button-group" style={{ marginTop: '1rem' }}>
          {editMode ? (
            <>
              <button className="btn btn-primary" onClick={() => saveEdit(false)} disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ai" onClick={() => saveEdit(true)} disabled={loading}>
                {loading ? 'Saving…' : 'Save + Reanalyze All'}
              </button>
              <button className="btn btn-secondary" onClick={cancelEdit} disabled={loading}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={startEdit}>Edit</button>
              <button className="btn btn-ai" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'Analyzing…' : 'Reanalyze AI'}
              </button>
              <button className="btn btn-ai" onClick={handleReanalyzeMetadata} disabled={analyzing}>
                {analyzing ? 'Analyzing…' : 'Reanalyze Tags/Emotions'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntryDetail;
