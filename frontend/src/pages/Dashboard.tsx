import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { eventService, importService } from '../services/api';
import './Dashboard.css';

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events when navigating to this page
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      loadEvents();
    }
  }, [location.pathname]);

  // Also refresh when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === '/dashboard') {
        loadEvents();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [location.pathname]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll();
      setEvents(response.data);
    } catch (error) {
      // Silently handle error - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert datetime-local format to ISO string
      const startTimeISO = formData.startTime ? new Date(formData.startTime).toISOString() : '';
      const endTimeISO = formData.endTime ? new Date(formData.endTime).toISOString() : '';
      
      await eventService.create({
        title: formData.title,
        startTime: startTimeISO,
        endTime: endTimeISO,
      });
      setFormData({ title: '', startTime: '', endTime: '' });
      setShowForm(false);
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create event';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Event['status']) => {
    try {
      await eventService.update(id, { status: newStatus });
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update event';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.delete(id);
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete event';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.ics', '.ical', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please select a valid calendar file (.ics, .ical, or .csv)');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await importService.importCalendar(file);
      const { skipped, message } = response.data;
      
      let resultMessage = message;
      if (skipped > 0) {
        resultMessage += ` (${skipped} event(s) skipped - duplicates or invalid)`;
      }
      
      setImportResult(resultMessage);
      setShowImport(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(async () => {
        await loadEvents();
      }, 500);
      
      setTimeout(() => setImportResult(null), 5000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import calendar';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '1.2rem',
        color: '#667eea',
        fontWeight: 600
      }}>
        <div>Loading your calendar...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>My Calendar</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary" disabled={importing}>
            {importing ? 'Importing...' : '📅 Import Calendar'}
          </button>
          <button onClick={loadEvents} className="btn-secondary" disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        </div>
      </div>

      {importResult && (
        <div className="import-result" style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          color: '#155724',
          borderRadius: '12px',
          border: '2px solid #c3e6cb',
          fontWeight: 600,
        }}>
          ✓ {importResult}
        </div>
      )}

      {showImport && (
        <div className="event-form import-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Import Calendar</h3>
            <button
              onClick={() => {
                setShowImport(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="btn-cancel"
              disabled={importing}
              style={{ 
                padding: '0.25rem', 
                fontSize: '0.75rem', 
                width: '1.75rem', 
                height: '1.75rem', 
                minWidth: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1'
              }}
            >
              ✕
            </button>
          </div>
          
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,.ical,.csv,text/calendar,text/csv"
              onChange={handleFileSelect}
              disabled={importing}
              id="calendar-file-input"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="calendar-file-input"
              className="file-upload-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 1.25rem',
                border: '2px dashed #667eea',
                borderRadius: '10px',
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                cursor: importing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!importing) {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.borderColor = '#764ba2';
                }
              }}
              onMouseLeave={(e) => {
                if (!importing) {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
                  e.currentTarget.style.borderColor = '#667eea';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span style={{ fontSize: '0.95rem', color: '#2c3e50', fontWeight: 500 }}>
                {importing ? 'Importing...' : 'Choose file (.ics, .ical, .csv)'}
              </span>
            </label>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Export from:</strong> Google Calendar (Settings), Outlook (File → Export), Apple Calendar (File → Export)
            </div>
            <div style={{ color: '#999', fontStyle: 'italic' }}>
              Only future events imported. Duplicates skipped.
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="event-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>New Event</h3>
            <button
              onClick={() => setShowForm(false)}
              className="btn-cancel"
              style={{ 
                padding: '0.25rem', 
                fontSize: '0.75rem', 
                width: '1.75rem', 
                height: '1.75rem', 
                minWidth: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1'
              }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group-compact">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                required
              />
            </div>
            <div className="datetime-grid">
              <div className="form-group-compact">
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group-compact">
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              Create Event
            </button>
          </form>
        </div>
      )}

      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. Create your first event to get started!</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className={`status-badge ${event.status}`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>
              <div className="event-details">
                <p>
                  <strong>Start:</strong> {formatDate(event.startTime)}
                </p>
                <p>
                  <strong>End:</strong> {formatDate(event.endTime)}
                </p>
              </div>
              <div className="event-actions">
                {event.status === 'BUSY' && (
                  <button
                    onClick={() => handleUpdateStatus(event.id, 'SWAPPABLE')}
                    className="btn-secondary"
                  >
                    Make Swappable
                  </button>
                )}
                {event.status === 'SWAPPABLE' && (
                  <button
                    onClick={() => handleUpdateStatus(event.id, 'BUSY')}
                    className="btn-secondary"
                  >
                    Mark as Busy
                  </button>
                )}
                {event.status === 'SWAP_PENDING' && (
                  <span className="pending-note">Pending swap request</span>
                )}
                <button
                  onClick={() => handleDelete(event.id)}
                  className="btn-danger"
                  disabled={event.status === 'SWAP_PENDING'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

