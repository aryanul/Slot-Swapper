import { useState, useEffect } from 'react';
import { eventService } from '../services/api';
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
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
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

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'BUSY':
        return '#95a5a6';
      case 'SWAPPABLE':
        return '#27ae60';
      case 'SWAP_PENDING':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>My Calendar</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <div className="event-form">
          <h3>Create New Event</h3>
          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary">
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
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(event.status) }}
                >
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

