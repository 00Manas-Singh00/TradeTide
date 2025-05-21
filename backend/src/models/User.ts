import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  bio?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  avatarUrl?: string;
  coverPhotoUrl?: string;
  socialLinks?: { type: string; url: string }[];
  badges?: string[];
}

const UserSchema: Schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String },
    skillsOffered: { type: [String], default: [] },
    skillsWanted: { type: [String], default: [] },
    avatarUrl: { type: String },
    coverPhotoUrl: { type: String },
    socialLinks: [
      {
        type: { type: String }, // e.g., 'twitter', 'linkedin', 'website'
        url: { type: String },
      },
    ],
    badges: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema); 