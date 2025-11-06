import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { swapService, eventService } from '../services/api';
import './Notifications.css';

interface SwapRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requesterSlot: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  };
  requestedSlot: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  requested: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function Notifications() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await swapService.getSwapRequests();
      console.log('Swap requests response:', response.data);
      setIncoming(response.data.incoming || []);
      setOutgoing(response.data.outgoing || []);
    } catch (error: any) {
      console.error('Failed to load swap requests:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty arrays on error to prevent undefined
      setIncoming([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, accepted: boolean) => {
    setProcessing(requestId);
    try {
      await swapService.respondToSwap(requestId, accepted);
      await loadRequests();
      alert(accepted ? 'Swap accepted! The calendar has been updated.' : 'Swap rejected.');
      
      // If swap was accepted, suggest navigating to calendar to see the update
      if (accepted) {
        const goToCalendar = confirm('Would you like to view your updated calendar?');
        if (goToCalendar) {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process swap request');
    } finally {
      setProcessing(null);
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

  const getStatusBadge = (status: SwapRequest['status']) => {
    const styles = {
      PENDING: { bg: '#f39c12', text: 'Pending' },
      ACCEPTED: { bg: '#27ae60', text: 'Accepted' },
      REJECTED: { bg: '#e74c3c', text: 'Rejected' },
    };
    const style = styles[status];
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: style.bg }}
      >
        {style.text}
      </span>
    );
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
        <div>Loading swap requests...</div>
      </div>
    );
  }

  return (
    <div className="notifications">
      <h2>Swap Requests</h2>

      <div className="requests-section">
        <div className="requests-column">
          <h3>Incoming Requests</h3>
          {incoming.length === 0 ? (
            <div className="empty-state">
              <p>No incoming swap requests.</p>
            </div>
          ) : (
            <div className="requests-list">
              {incoming.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h4>Swap Request from {request.requester.name}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="request-details">
                    <div className="slot-comparison">
                      <div className="slot-offer">
                        <strong>They're offering:</strong>
                        <p>{request.requesterSlot.title}</p>
                        <small>
                          {formatDate(request.requesterSlot.startTime)} -{' '}
                          {formatDate(request.requesterSlot.endTime)}
                        </small>
                      </div>
                      <div className="arrow">⇄</div>
                      <div className="slot-request">
                        <strong>For your slot:</strong>
                        <p>{request.requestedSlot.title}</p>
                        <small>
                          {formatDate(request.requestedSlot.startTime)} -{' '}
                          {formatDate(request.requestedSlot.endTime)}
                        </small>
                      </div>
                    </div>
                    <p className="request-time">
                      Requested on {formatDate(request.createdAt)}
                    </p>
                  </div>
                  {request.status === 'PENDING' && (
                    <div className="request-actions">
                      <button
                        onClick={() => handleRespond(request.id, true)}
                        className="btn-accept"
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleRespond(request.id, false)}
                        className="btn-reject"
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="requests-column">
          <h3>Outgoing Requests</h3>
          {outgoing.length === 0 ? (
            <div className="empty-state">
              <p>No outgoing swap requests.</p>
            </div>
          ) : (
            <div className="requests-list">
              {outgoing.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h4>Swap Request to {request.requested.name}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="request-details">
                    <div className="slot-comparison">
                      <div className="slot-offer">
                        <strong>You're offering:</strong>
                        <p>{request.requesterSlot.title}</p>
                        <small>
                          {formatDate(request.requesterSlot.startTime)} -{' '}
                          {formatDate(request.requesterSlot.endTime)}
                        </small>
                      </div>
                      <div className="arrow">⇄</div>
                      <div className="slot-request">
                        <strong>For their slot:</strong>
                        <p>{request.requestedSlot.title}</p>
                        <small>
                          {formatDate(request.requestedSlot.startTime)} -{' '}
                          {formatDate(request.requestedSlot.endTime)}
                        </small>
                      </div>
                    </div>
                    <p className="request-time">
                      Requested on {formatDate(request.createdAt)}
                    </p>
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

