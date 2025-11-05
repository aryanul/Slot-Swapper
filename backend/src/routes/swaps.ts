import express from 'express';
import mongoose from 'mongoose';
import Event, { EventStatus } from '../models/Event';
import SwapRequest, { SwapRequestStatus } from '../models/SwapRequest';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const swapRequestSchema = z.object({
  mySlotId: z.string(),
  theirSlotId: z.string(),
});

const swapResponseSchema = z.object({
  accepted: z.boolean(),
});

// GET /api/swappable-slots - Get all swappable slots from other users
router.get('/swappable-slots', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const swappableSlots = await Event.find({
      status: EventStatus.SWAPPABLE,
      userId: { $ne: new mongoose.Types.ObjectId(userId) },
    })
      .populate('userId', 'name email')
      .sort({ startTime: 1 });

    // Transform to match expected format
    const formattedSlots = swappableSlots.map((slot) => ({
      ...slot.toObject(),
      id: slot._id.toString(),
      user: {
        id: (slot.userId as any)._id.toString(),
        name: (slot.userId as any).name,
        email: (slot.userId as any).email,
      },
      userId: (slot.userId as any)._id.toString(),
    }));

    res.json(formattedSlots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/swap-request - Create a swap request
router.post('/swap-request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { mySlotId, theirSlotId } = swapRequestSchema.parse(req.body);

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(mySlotId) || !mongoose.Types.ObjectId.isValid(theirSlotId)) {
      return res.status(400).json({ error: 'Invalid slot ID' });
    }

    // Validate that both slots exist
    const mySlot = await Event.findOne({
      _id: mySlotId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    const theirSlot = await Event.findById(theirSlotId);
    
    if (!theirSlot) {
      return res.status(404).json({ error: 'Requested slot not found' });
    }

    if (!mySlot) {
      return res.status(404).json({ error: 'Your slot not found' });
    }

    // Check that both slots are SWAPPABLE
    if (mySlot.status !== EventStatus.SWAPPABLE) {
      return res.status(400).json({
        error: 'Your slot must be marked as swappable',
      });
    }

    if (theirSlot.status !== EventStatus.SWAPPABLE) {
      return res.status(400).json({
        error: 'Requested slot is not swappable',
      });
    }

    // Check that the slots don't belong to the same user
    if (mySlot.userId.toString() === theirSlot.userId.toString()) {
      return res.status(400).json({
        error: 'Cannot swap with your own slot',
      });
    }

    // Check if either slot is already involved in a pending swap
    const existingSwap = await SwapRequest.findOne({
      $or: [
        { requesterSlotId: mySlotId, status: SwapRequestStatus.PENDING },
        { requestedSlotId: mySlotId, status: SwapRequestStatus.PENDING },
        { requesterSlotId: theirSlotId, status: SwapRequestStatus.PENDING },
        { requestedSlotId: theirSlotId, status: SwapRequestStatus.PENDING },
      ],
    });

    if (existingSwap) {
      return res.status(400).json({
        error: 'One or both slots are already involved in a pending swap',
      });
    }

    // Get the requested user ID (userId is always an ObjectId in the document)
    const requestedUserId = theirSlot.userId.toString();

    // Create swap request
    const swapRequest = await SwapRequest.create({
      requesterId: new mongoose.Types.ObjectId(userId),
      requestedId: new mongoose.Types.ObjectId(requestedUserId),
      requesterSlotId: new mongoose.Types.ObjectId(mySlotId),
      requestedSlotId: new mongoose.Types.ObjectId(theirSlotId),
      status: SwapRequestStatus.PENDING,
    });

    // Populate the swap request
    try {
      await swapRequest.populate([
        { path: 'requesterSlot' },
        { path: 'requestedSlot' },
        { path: 'requester', select: 'name email' },
        { path: 'requested', select: 'name email' },
      ]);
    } catch (populateError) {
      console.error('Error populating swap request:', populateError);
      // Continue anyway - we can still return the basic swap request
    }

    // Update both slots to SWAP_PENDING
    await Event.findByIdAndUpdate(mySlotId, { status: EventStatus.SWAP_PENDING });
    await Event.findByIdAndUpdate(theirSlotId, { status: EventStatus.SWAP_PENDING });

    // Format response
    const swapObj = swapRequest.toObject();
    const formattedRequest: any = {
      ...swapObj,
      id: swapObj._id.toString(),
    };

    // Safely format populated fields
    if (swapRequest.requesterSlot) {
      const requesterSlotObj = (swapRequest.requesterSlot as any).toObject?.() || swapRequest.requesterSlot;
      formattedRequest.requesterSlot = {
        ...requesterSlotObj,
        id: requesterSlotObj._id?.toString() || requesterSlotObj.id,
      };
    }

    if (swapRequest.requestedSlot) {
      const requestedSlotObj = (swapRequest.requestedSlot as any).toObject?.() || swapRequest.requestedSlot;
      formattedRequest.requestedSlot = {
        ...requestedSlotObj,
        id: requestedSlotObj._id?.toString() || requestedSlotObj.id,
      };
    }

    if (swapRequest.requester) {
      const requesterObj = (swapRequest.requester as any).toObject?.() || swapRequest.requester;
      formattedRequest.requester = {
        id: requesterObj._id?.toString() || requesterObj.id,
        name: requesterObj.name,
        email: requesterObj.email,
      };
    }

    if (swapRequest.requested) {
      const requestedObj = (swapRequest.requested as any).toObject?.() || swapRequest.requested;
      formattedRequest.requested = {
        id: requestedObj._id?.toString() || requestedObj.id,
        name: requestedObj.name,
        email: requestedObj.email,
      };
    }

    res.status(201).json(formattedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    console.error('Create swap request error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/swap-response/:requestId - Respond to a swap request
router.post('/swap-response/:requestId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { requestId } = req.params;
    const { accepted } = swapResponseSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Find the swap request
    const swapRequest = await SwapRequest.findById(requestId)
      .populate('requesterSlot')
      .populate('requestedSlot');

    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    // Check that the user is the recipient of the request
    if (swapRequest.requestedId.toString() !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to respond to this swap request',
      });
    }

    // Check that the request is still pending
    if (swapRequest.status !== SwapRequestStatus.PENDING) {
      return res.status(400).json({
        error: 'This swap request has already been processed',
      });
    }

    if (accepted) {
      // ACCEPT: Swap the owners of the slots
      const requesterSlot = swapRequest.requesterSlot as any;
      const requestedSlot = swapRequest.requestedSlot as any;

      const requesterSlotUserId = requesterSlot.userId.toString();
      const requestedSlotUserId = requestedSlot.userId.toString();

      // Use session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update swap request status
        await SwapRequest.findByIdAndUpdate(
          requestId,
          { status: SwapRequestStatus.ACCEPTED },
          { session }
        );

        // Swap the owners
        await Event.findByIdAndUpdate(
          swapRequest.requesterSlotId,
          {
            userId: new mongoose.Types.ObjectId(requestedSlotUserId),
            status: EventStatus.BUSY,
          },
          { session }
        );

        await Event.findByIdAndUpdate(
          swapRequest.requestedSlotId,
          {
            userId: new mongoose.Types.ObjectId(requesterSlotUserId),
            status: EventStatus.BUSY,
          },
          { session }
        );

        await session.commitTransaction();
        res.json({ message: 'Swap accepted successfully' });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // REJECT: Set both slots back to SWAPPABLE
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update swap request status
        await SwapRequest.findByIdAndUpdate(
          requestId,
          { status: SwapRequestStatus.REJECTED },
          { session }
        );

        // Set both slots back to SWAPPABLE
        await Event.findByIdAndUpdate(
          swapRequest.requesterSlotId,
          { status: EventStatus.SWAPPABLE },
          { session }
        );

        await Event.findByIdAndUpdate(
          swapRequest.requestedSlotId,
          { status: EventStatus.SWAPPABLE },
          { session }
        );

        await session.commitTransaction();
        res.json({ message: 'Swap rejected' });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    console.error('Swap response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/swap-requests - Get all swap requests (incoming and outgoing)
router.get('/swap-requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [incoming, outgoing] = await Promise.all([
      // Incoming requests (requests made to the user)
      SwapRequest.find({
        requestedId: new mongoose.Types.ObjectId(userId),
      })
        .populate('requesterSlot')
        .populate('requestedSlot')
        .populate('requester', 'name email')
        .sort({ createdAt: -1 }),

      // Outgoing requests (requests made by the user)
      SwapRequest.find({
        requesterId: new mongoose.Types.ObjectId(userId),
      })
        .populate('requesterSlot')
        .populate('requestedSlot')
        .populate('requested', 'name email')
        .sort({ createdAt: -1 }),
    ]);

    // Format responses
    const formatSwapRequest = (req: any) => ({
      ...req.toObject(),
      id: req._id.toString(),
      requesterSlot: {
        ...(req.requesterSlot as any).toObject(),
        id: (req.requesterSlot as any)._id.toString(),
      },
      requestedSlot: {
        ...(req.requestedSlot as any).toObject(),
        id: (req.requestedSlot as any)._id.toString(),
      },
      requester: req.requester ? {
        id: (req.requester as any)._id.toString(),
        name: (req.requester as any).name,
        email: (req.requester as any).email,
      } : undefined,
      requested: req.requested ? {
        id: (req.requested as any)._id.toString(),
        name: (req.requested as any).name,
        email: (req.requested as any).email,
      } : undefined,
    });

    res.json({
      incoming: incoming.map(formatSwapRequest),
      outgoing: outgoing.map(formatSwapRequest),
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
