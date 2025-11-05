import { useState, useEffect } from 'react';
import { swapService, eventService } from '../services/api';
import './Marketplace.css';

interface SwappableSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface MySlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function Marketplace() {
  const [slots, setSlots] = useState<SwappableSlot[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<MySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SwappableSlot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [swappableResponse, myEventsResponse] = await Promise.all([
        swapService.getSwappableSlots(),
        eventService.getAll(),
      ]);
      setSlots(swappableResponse.data);
      setMySwappableSlots(
        myEventsResponse.data.filter((e: MySlot) => e.status === 'SWAPPABLE')
      );
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot: SwappableSlot) => {
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleConfirmSwap = async (mySlotId: string) => {
    if (!selectedSlot) return;

    setRequesting(true);
    try {
      await swapService.createSwapRequest(mySlotId, selectedSlot.id);
      alert('Swap request sent successfully!');
      setShowModal(false);
      setSelectedSlot(null);
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create swap request';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      console.error('Swap request error:', error);
    } finally {
      setRequesting(false);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="marketplace">
      <h2>Available Swappable Slots</h2>
      <p className="marketplace-description">
        Browse slots from other users that are available for swapping. Click
        "Request Swap" to offer one of your swappable slots in exchange.
      </p>

      {slots.length === 0 ? (
        <div className="empty-state">
          <p>No swappable slots available at the moment.</p>
        </div>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => (
            <div key={slot.id} className="slot-card">
              <div className="slot-header">
                <h3>{slot.title}</h3>
              </div>
              <div className="slot-details">
                <p>
                  <strong>From:</strong> {slot.user.name}
                </p>
                <p>
                  <strong>Start:</strong> {formatDate(slot.startTime)}
                </p>
                <p>
                  <strong>End:</strong> {formatDate(slot.endTime)}
                </p>
              </div>
              <button
                onClick={() => handleRequestSwap(slot)}
                className="btn-request"
                disabled={mySwappableSlots.length === 0}
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Your Slot to Offer</h3>
            <p className="modal-description">
              You're requesting to swap with:
              <br />
              <strong>{selectedSlot.title}</strong> ({formatDate(selectedSlot.startTime)})
            </p>
            {mySwappableSlots.length === 0 ? (
              <div className="no-slots">
                <p>You don't have any swappable slots.</p>
                <p>Go to Calendar and mark some events as swappable first.</p>
              </div>
            ) : (
              <div className="my-slots-list">
                {mySwappableSlots.map((slot) => (
                  <div key={slot.id} className="my-slot-item">
                    <div>
                      <strong>{slot.title}</strong>
                      <br />
                      <small>
                        {formatDate(slot.startTime)} - {formatDate(slot.endTime)}
                      </small>
                    </div>
                    <button
                      onClick={() => handleConfirmSwap(slot.id)}
                      className="btn-confirm"
                      disabled={requesting}
                    >
                      {requesting ? 'Requesting...' : 'Offer This Slot'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

