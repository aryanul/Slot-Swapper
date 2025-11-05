import mongoose, { Schema, Document } from 'mongoose';

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ISwapRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  requestedId: mongoose.Types.ObjectId;
  requesterSlotId: mongoose.Types.ObjectId;
  requestedSlotId: mongoose.Types.ObjectId;
  status: SwapRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SwapRequestSchema = new Schema<ISwapRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    requestedSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SwapRequestStatus),
      default: SwapRequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);

