import { Request, Response } from 'express';
import User from '../models/User';

// Extend Express Request to include user property
interface AuthRequest extends Request {
  user?: { id: string };
}

// Get current user's profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Assume req.user.id is set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-__v -password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Update current user's profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updateFields = (({ username, bio, skillsOffered, skillsWanted, avatarUrl, coverPhotoUrl, socialLinks, badges }) => ({
      username,
      bio,
      skillsOffered,
      skillsWanted,
      avatarUrl,
      coverPhotoUrl,
      socialLinks,
      badges,
    }))(req.body);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-__v -password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}; 