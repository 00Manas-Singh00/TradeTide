import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema<IChat>(
  {
    participants: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    }],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for messages
ChatSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chatId'
});

export default mongoose.model<IChat>('Chat', ChatSchema); 