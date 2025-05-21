import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userIds: string[];
  scheduledBy: string;
  date: Date;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  skill: string;
}

const SessionSchema = new Schema<ISession>({
  userIds: [{ type: String, required: true }],
  scheduledBy: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  skill: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISession>('Session', SessionSchema); 