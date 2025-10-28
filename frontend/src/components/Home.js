import React, { useState, useRef } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'https://localhost')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'https://localhost');

function Home({ entries, onEntryAdded, aiStatus }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interimText, setInterimText] = useState('');
  const finalTranscriptRef = useRef('');
  const baseContentRef = useRef('');
  const lastRenderedRef = useRef('');
  const finalSegmentsRef = useRef([]);
  const isRecordingRef = useRef(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;

  // Initialize speech recognition
  React.useEffect(() => {
    if (isIOS) {
      // iOS Safari/WebKit does not support SpeechRecognition
      setRecognition(null);
      return;
    }
    if (("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      // Enable interim so users see realtime text
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const rawTokens = (s) => normalize(s).split(' ').filter(Boolean);
        const clean = (t) => t.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
        const normTokens = (s) => rawTokens(s).map(clean).filter(Boolean);
        const mapPuncWords = (s) => {
          return (s || '')
            .replace(/\b(full stop|period)\b/gi, '.')
            .replace(/\b(question mark)\b/gi, '?')
            .replace(/\b(exclamation (?:point|mark)|bang)\b/gi, '!')
            .replace(/\b(comma)\b/gi, ',')
            .replace(/\b(semicolon)\b/gi, ';')
            .replace(/\b(colon)\b/gi, ':')
            .replace(/\b(dot dot dot|ellipsis)\b/gi, '…');
        };
        const fixPuncSpacing = (s) => normalize(
          (s || '')
            .replace(/\s+([,.;:!?…])/g, '$1')
            .replace(/([.?!…])([^\s,.;!?…])/g, '$1 $2')
        );
        const collapseDupPunc = (s) => (s || '')
          .replace(/([.?!])\1+/g, '$1')
          .replace(/,{2,}/g, ',');
        const formatCommitted = (s) => {
          const spaced = fixPuncSpacing(s);
          const collapsed = collapseDupPunc(spaced);
          return collapsed.replace(/(^\s*[a-z])|([\.\!\?]\s+[a-z])/g, (m) => m.toUpperCase());
        };

        const appendDedupe = (finalStr, pieceStr) => {
          const a = normTokens(finalStr);
          const b = normTokens(pieceStr);
          let overlap = Math.min(a.length, b.length);
          while (overlap > 0) {
            let ok = true;
            for (let i = 0; i < overlap; i++) {
              if (a[a.length - overlap + i] !== b[i]) { ok = false; break; }
            }
            if (ok) break;
            overlap--;
          }
          const pieceRaw = rawTokens(pieceStr);
          const suffix = pieceRaw.slice(overlap).join(' ');
          if (!suffix) return normalize(finalStr);
          return normalize((finalStr ? finalStr + ' ' : '') + suffix);
        };

        // Process only new results from resultIndex
        let interimRaw = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const piece = res[0]?.transcript || '';
            const mapped = fixPuncSpacing(mapPuncWords(piece));
            finalTranscriptRef.current = appendDedupe(finalTranscriptRef.current, mapped);
            // Update textarea with committed finals
            const base = baseContentRef.current || '';
            const committed = normalize((base ? base + ' ' : '') + finalTranscriptRef.current);
            const formatted = formatCommitted(committed);
            if (formatted !== lastRenderedRef.current) {
              lastRenderedRef.current = formatted;
              setContent(formatted);
            }
          } else {
            interimRaw = res[0]?.transcript || '';
          }
        }

        // Update interim preview (suffix after current finals)
        if (interimRaw) {
          const interimMapped = fixPuncSpacing(mapPuncWords(interimRaw));
          const a = normTokens(finalTranscriptRef.current);
          const bRaw = rawTokens(interimMapped);
          const b = bRaw.map(clean);
          let p = 0;
          while (p < a.length && p < b.length && a[p] === b[p]) p++;
          const suffix = bRaw.slice(p).join(' ');
          setInterimText(normalize(collapseDupPunc(suffix)));
        } else {
          setInterimText('');
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let message = 'Voice recording error: ' + event.error;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          message = 'Microphone permission blocked. Allow mic access in your browser settings.';
        } else if (event.error === 'no-speech') {
          message = 'No speech detected. Try speaking louder or closer.';
        } else if (event.error === 'aborted') {
          message = 'Recording aborted.';
        }
        setError(message);
        // Attempt to keep session alive unless user pressed stop
        if (isRecordingRef.current) {
          try { recognitionInstance.start(); } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionInstance.onend = () => {
        setInterimText('');
        if (isRecordingRef.current) {
          // Auto-restart to keep listening until user stops
          try { recognitionInstance.start(); } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };

      setRecognition(recognitionInstance);
    }
  }, []);

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
      
      if (onEntryAdded) {
        onEntryAdded();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ensureMicPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return true; // Can't preflight; let SR handle
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop tracks; we only wanted the permission prompt
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.error('getUserMedia failed:', e);
      setError('Microphone access denied. Enable mic permissions for this site.');
      return false;
    }
  };

  const toggleRecording = async () => {
    if (!recognition) {
      if (isIOS) {
        setError('Voice dictation is not supported on iOS browsers. Use the keyboard mic instead.');
      } else {
        setError('Speech recognition is not supported in your browser');
      }
      return;
    }
    if (!isSecure) {
      setError('Microphone requires a secure, trusted HTTPS origin. Use a valid certificate or trusted LAN domain.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      setInterimText('');
      // Ensure trailing punctuation on stop
      setContent((prev) => {
        if (!prev) return prev;
        const trimmed = prev.trim();
        if (!/[\.!?…]$/.test(trimmed)) {
          const punctuated = trimmed + '.';
          lastRenderedRef.current = punctuated;
          return punctuated;
        }
        return prev;
      });
    } else {
      const ok = await ensureMicPermission();
      if (!ok) return;
      // Initialize buffers with any existing content
      baseContentRef.current = content ? (content.endsWith(' ') ? content : content + ' ') : '';
      finalTranscriptRef.current = '';
      finalSegmentsRef.current = [];
      lastRenderedRef.current = content || '';
      try {
        recognition.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        setError('');
        setInterimText('');
      } catch (e) {
        // Some browsers throw if start is called too soon or without permission
        console.error('recognition.start() failed:', e);
        setError('Could not start recording. Ensure mic permission is granted and try again.');
      }
    }
  };

  // Get entries for a specific date
  const getEntriesForDate = (date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at).toDateString();
      const compareDate = date.toDateString();
      return entryDate === compareDate;
    });
  };

  // Check if a date has entries (for calendar tile styling)
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasEntries = getEntriesForDate(date).length > 0;
      return hasEntries ? 'has-entries' : null;
    }
    return null;
  };

  return (
    <div className="home-container">
      <div className="home-layout">
        {/* Left Sidebar - Journal Entry Form */}
        <aside className="sidebar">
          <div className="card">
            <h2 className="card-title">📝 New Entry</h2>
            
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            {success && <div className="alert alert-success">✅ {success}</div>}
            
            <form onSubmit={handleSubmit} className="journal-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Your Thoughts *</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or speak your thoughts here..."
                  required
                  className="textarea"
                  rows="10"
                />
                {isRecording && (
                  <div className="recording-indicator">
                    <span className="pulse"></span> Recording...
                  </div>
                )}
                {isRecording && interimText && (
                  <div className="interim-preview">
                    <span className="interim-label">Listening:</span> {interimText}
                  </div>
                )}
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '💾 Saving...' : '💾 Save Entry'}
                </button>
                
                {recognition && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`btn btn-voice ${isRecording ? 'recording' : ''}`}
                    title="Voice to text"
                  >
                    {isRecording ? '⏹️ Stop' : '🎤 Voice'}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => { setTitle(''); setContent(''); }}
                  className="btn btn-secondary"
                >
                  🗑️ Clear
                </button>
              </div>
            </form>
          </div>

          {/* Calendar Widget */}
          <div className="card calendar-card">
            <h3 className="card-title">📅 Journal Calendar</h3>
            <Calendar
              calendarType="US"
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              className="journal-calendar"
              showWeekNumbers={true}
              prev2Label="«"
              next2Label="»"
              formatShortWeekday={(locale, date) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date)}
              formatDay={(locale, date) => new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date)}
              formatMonthYear={(locale, date) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)}
            />
            <div className="calendar-legend">
              <span className="legend-item">
                <span className="legend-dot has-entry"></span>
                Has entries
              </span>
            </div>
          </div>
        </aside>

        {/* Right Side - Recent Entries */}
        <main className="home-main">
          <h2 className="section-title">📓 Recent Entries</h2>
          
          {loading && <div className="loading">⏳ Loading...</div>}
          
          <div className="entries-grid">
            {entries.slice(0, 5).length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📔</div>
                <h3>No entries yet</h3>
                <p>Start journaling to see your entries here!</p>
              </div>
            )}

            {entries.slice(0, 5).map((entry) => (
              <article key={entry.id} className="entry-card">
                <div className="entry-header">
                  <h3 className="entry-title">{entry.title}</h3>
                  <time className="entry-date">
                    {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </time>
                </div>
                
                <div className="entry-content">
                  {entry.content.substring(0, 200)}
                  {entry.content.length > 200 && '...'}
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;

