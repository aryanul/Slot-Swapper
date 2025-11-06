import express from 'express';
import mongoose from 'mongoose';
import Event, { EventStatus } from '../models/Event';
import SwapRequest, { SwapRequestStatus } from '../models/SwapRequest';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createEventSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(['BUSY', 'SWAPPABLE', 'SWAP_PENDING']).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['BUSY', 'SWAPPABLE', 'SWAP_PENDING']).optional(),
});

// Get all events for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const events = await Event.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ startTime: 1 });

    // Format events to include id field
    const formattedEvents = events.map(event => {
      const eventObj = event.toObject();
      return {
        ...eventObj,
        id: eventObj._id.toString(),
      };
    });

    res.json(formattedEvents);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single event
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Format response to include id field
    const eventObj = event.toObject();
    res.json({
      ...eventObj,
      id: eventObj._id.toString(),
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new event
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const data = createEventSchema.parse(req.body);

    // Validate that endTime is after startTime
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = await Event.create({
      title: data.title,
      startTime,
      endTime,
      status: data.status || EventStatus.BUSY,
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Format response to include id field
    const eventObj = event.toObject();
    res.status(201).json({
      ...eventObj,
      id: eventObj._id.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an event
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const data = updateEventSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if event exists and belongs to user
    const existingEvent = await Event.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // If event is involved in a pending swap, don't allow status changes
    if (data.status && data.status !== existingEvent.status) {
      const pendingSwap = await SwapRequest.findOne({
        $or: [
          { requesterSlotId: id, status: SwapRequestStatus.PENDING },
          { requestedSlotId: id, status: SwapRequestStatus.PENDING },
        ],
      });

      if (pendingSwap) {
        return res.status(400).json({
          error: 'Cannot change status of event involved in a pending swap',
        });
      }
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.status !== undefined) updateData.status = data.status;

    // Validate that endTime is after startTime if both are being updated
    if (updateData.endTime && updateData.startTime) {
      if (updateData.endTime <= updateData.startTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Format response to include id field
    const eventObj = event.toObject();
    res.json({
      ...eventObj,
      id: eventObj._id.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an event
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if event exists and belongs to user
    const existingEvent = await Event.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is involved in a pending swap
    const pendingSwap = await SwapRequest.findOne({
      $or: [
        { requesterSlotId: id, status: SwapRequestStatus.PENDING },
        { requestedSlotId: id, status: SwapRequestStatus.PENDING },
      ],
    });

    if (pendingSwap) {
      return res.status(400).json({
        error: 'Cannot delete event involved in a pending swap',
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
