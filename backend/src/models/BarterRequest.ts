import mongoose, { Schema, Document } from 'mongoose';

export interface IBarterRequest extends Document {
  sender: string;
  receiver: string;
  skill: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const BarterRequestSchema = new Schema<IBarterRequest>({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  skill: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBarterRequest>('BarterRequest', BarterRequestSchema); 