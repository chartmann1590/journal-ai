import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import { format, startOfMonth } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

function CalendarView({ entries }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const filterEntriesByDate = useCallback((date) => {
    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.created_at).toDateString();
      const compareDate = date.toDateString();
      return entryDate === compareDate;
    });
    setFilteredEntries(filtered);
  }, [entries]);

  useEffect(() => {
    filterEntriesByDate(selectedDate);
  }, [selectedDate, filterEntriesByDate]);

  // Check if a date has entries (for calendar tile styling)
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasEntries = entries.some(entry => {
        const entryDate = new Date(entry.created_at).toDateString();
        return entryDate === date.toDateString();
      });
      return hasEntries ? 'has-entries' : null;
    }
    return null;
  };

  // Get stats
  const totalDaysWithEntries = new Set(
    entries.map(e => new Date(e.created_at).toDateString())
  ).size;

  const entriesThisMonth = entries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() &&
           entryDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="calendar-view-page">
      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{totalDaysWithEntries}</div>
            <div className="stat-label">Days Journaled</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗓️</div>
          <div className="stat-info">
            <div className="stat-value">{entriesThisMonth}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar-container">
            {/* Month/Year Controls */}
            <div className="toolbar" style={{ marginBottom: '0.5rem' }}>
              <div className="toolbar-left" style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="toolbar-select"
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setCurrentMonth(startOfMonth(new Date(currentMonth.getFullYear(), m, 1)));
                  }}
                >
                  {Array.from({ length: 12 }).map((_, m) => (
                    <option key={m} value={m}>{format(new Date(2000, m, 1), 'MMMM')}</option>
                  ))}
                </select>
                <select
                  className="toolbar-select"
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setCurrentMonth(startOfMonth(new Date(y, currentMonth.getMonth(), 1)));
                  }}
                >
                  {Array.from({ length: 11 }).map((_, i) => {
                    const y = new Date().getFullYear() - 5 + i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            </div>
            <Calendar
              calendarType="US"
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              className="journal-calendar"
              showWeekNumbers={true}
              prev2Label="«"
              next2Label="»"
              formatShortWeekday={(locale, date) => format(date, 'EEEEE')}
              formatDay={(locale, date) => format(date, 'd')}
              formatMonthYear={(locale, date) => format(date, 'MMMM yyyy')}
              activeStartDate={currentMonth}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) setCurrentMonth(startOfMonth(activeStartDate));
              }}
            />
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot has-entry"></span>
                <span>Has Entries</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot today"></span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="timeline-section">
          <div className="timeline-header">
            <div>
              <h2 className="timeline-date">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h2>
              <p className="timeline-year">{format(selectedDate, 'yyyy')}</p>
            </div>
            {filteredEntries.length > 0 && (
              <div className="timeline-count">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </div>
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="timeline-empty">
              <div className="empty-icon">✏️</div>
              <h3>No entries for this day</h3>
              <p>Select a different date or start journaling!</p>
            </div>
          ) : (
            <div className="timeline-entries">
              {filteredEntries.map((entry, index) => (
                <div key={entry.id} className="timeline-entry">
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {index !== filteredEntries.length - 1 && (
                      <div className="timeline-line"></div>
                    )}
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-time">
                      {format(new Date(entry.created_at), 'h:mm a')}
                    </div>
                    <div className="timeline-card">
                      <h3 className="timeline-title">{entry.title}</h3>
                      <p className="timeline-text">{entry.content}</p>

                      {entry.ai_response && (
                        <div className="timeline-ai">
                          <div className="timeline-ai-header">
                            <span>💡</span>
                            <strong>AI Insight</strong>
                          </div>
                          <p>{entry.ai_response}</p>
                        </div>
                      )}

                      <div className="timeline-meta">
                        {entry.content.split(' ').length} words
                        {entry.ai_response && <span className="timeline-badge">AI Analyzed</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
