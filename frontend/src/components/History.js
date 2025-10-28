import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'https://localhost')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'https://localhost');

function History({ entries, aiStatus, onEntryDeleted, onEntryUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [tagsQuery, setTagsQuery] = useState('');
  const [emotionsQuery, setEmotionsQuery] = useState('');

  const filterAndSortEntries = useCallback(() => {
    let filtered = entries;

    if (searchTerm.trim() !== '') {
      filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const parseList = (s) => s.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    const tagList = parseList(tagsQuery);
    const emoList = parseList(emotionsQuery);

    if (tagList.length > 0) {
      filtered = filtered.filter(e => Array.isArray(e.tags) && e.tags.some(t => tagList.includes(String(t).toLowerCase())));
    }
    if (emoList.length > 0) {
      filtered = filtered.filter(e => Array.isArray(e.emotions) && e.emotions.some(em => emoList.includes(String(em).toLowerCase())));
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredEntries(sorted);
  }, [entries, searchTerm, sortBy, tagsQuery, emotionsQuery]);

  useEffect(() => {
    filterAndSortEntries();
  }, [filterAndSortEntries]);

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

      if (onEntryUpdated) {
        onEntryUpdated();
      }

      toast.success('AI analysis completed!');
    } catch (err) {
      toast.error('Failed to get AI analysis');
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
      toast.success('Entry deleted successfully!');

      if (onEntryDeleted) {
        onEntryDeleted();
      }
    } catch (err) {
      toast.error('Failed to delete entry');
      console.error(err);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-entries-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Journal entries exported!');
  };

  const totalEntries = entries.length;
  const entriesWithAI = entries.filter(e => e.ai_response).length;

  const highlightPreview = (entry) => {
    const text = entry.content || '';
    const keywords = Array.isArray(entry.emotion_keywords) ? entry.emotion_keywords : [];
    if (keywords.length === 0) return (
      <>
        {text.substring(0, 200)}
        {text.length > 200 && '...'}
      </>
    );
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b(${keywords.map(k => escape(String(k))).join('|')})\\b`, 'gi');
    const limited = text.substring(0, 200);
    const parts = [];
    let lastIndex = 0;
    let m;
    while ((m = pattern.exec(limited)) !== null) {
      const start = m.index;
      const end = pattern.lastIndex;
      if (start > lastIndex) parts.push(limited.slice(lastIndex, start));
      parts.push(<mark key={start} className="emotion-highlight">{limited.slice(start, end)}</mark>);
      lastIndex = end;
    }
    if (lastIndex < limited.length) parts.push(limited.slice(lastIndex));
    if (text.length > 200) parts.push('...');
    return <>{parts}</>;
  };

  return (
    <div className="history-page">
      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{totalEntries}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-info">
            <div className="stat-value">{entriesWithAI}</div>
            <div className="stat-label">AI Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <div className="stat-value">{filteredEntries.length}</div>
            <div className="stat-label">Showing</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="toolbar-search"
          />
          <div className="filters-row">
            <input
              type="text"
              placeholder="Filter tags (e.g., work, gratitude)"
              value={tagsQuery}
              onChange={(e) => setTagsQuery(e.target.value)}
              className="toolbar-search"
            />
            <input
              type="text"
              placeholder="Filter emotions (e.g., joy, stress)"
              value={emotionsQuery}
              onChange={(e) => setEmotionsQuery(e.target.value)}
              className="toolbar-search"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="toolbar-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>

          <button onClick={exportToJSON} className="toolbar-btn">
            Export
          </button>
        </div>
      </div>

      {/* Entries */}
      {loading && <div className="loading">Analyzing with AI...</div>}

      {filteredEntries.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📔</div>
          <h3>No entries found</h3>
          <p>Try adjusting your search or create a new entry!</p>
        </div>
      )}

      <div className={`entries-${viewMode}`}>
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="history-entry-card" style={{ cursor: 'pointer' }}>
            <div className="entry-meta">
              <time className="entry-time">
                {format(new Date(entry.created_at), 'MMM d, yyyy')}
              </time>
              <div className="entry-badges">
                {entry.ai_response && (
                  <span className="badge badge-ai">AI</span>
                )}
              </div>
            </div>

            <h3 className="entry-title">
              <Link to={`/entries/${entry.id}`} className="nav-link" style={{ padding: 0, border: 'none' }}>{entry.title}</Link>
            </h3>

            <Link to={`/entries/${entry.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <p className="entry-preview">{highlightPreview(entry)}</p>
            </Link>

            {(Array.isArray(entry.tags) && entry.tags.length > 0) && (
              <div className="chips-row">
                {entry.tags.map((t, idx) => (
                  <span key={idx} className="chip chip-tag">#{t}</span>
                ))}
              </div>
            )}

            {(Array.isArray(entry.emotions) && entry.emotions.length > 0) && (
              <div className="chips-row">
                {entry.emotions.map((e, idx) => (
                  <span key={idx} className={`chip chip-emotion`}>{e}</span>
                ))}
              </div>
            )}

            {entry.ai_response && (
              <div className="entry-ai-preview">
                <strong>AI Insight:</strong> {entry.ai_response.substring(0, 100)}
                {entry.ai_response.length > 100 && '...'}
              </div>
            )}

            <div className="entry-footer">
              <div className="entry-word-count">
                {entry.content.split(' ').length} words
              </div>
              <div className="entry-actions-compact">
                {!entry.ai_response && aiStatus?.status === 'connected' && (
                  <button
                    onClick={() => handleAIAnalysis(entry)}
                    className="action-btn action-btn-ai"
                    disabled={loading}
                    title="Get AI Insights"
                  >
                    AI
                  </button>
                )}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="action-btn action-btn-delete"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
