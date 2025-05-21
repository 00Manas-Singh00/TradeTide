import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user: Types.ObjectId;
  action: string;
  target: string;
  details: any;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema); 