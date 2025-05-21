import { Request, Response } from 'express';
import User from '../models/User';

// GET /api/marketplace/users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const { skillsOffered, skillsWanted } = req.query;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Build filter
    const filter: any = { _id: { $ne: userId } };
    if (skillsOffered) {
      const offered = Array.isArray(skillsOffered)
        ? skillsOffered
        : String(skillsOffered).split(',').map(s => s.trim()).filter(Boolean);
      if (offered.length > 0) filter.skillsOffered = { $in: offered };
    }
    if (skillsWanted) {
      const wanted = Array.isArray(skillsWanted)
        ? skillsWanted
        : String(skillsWanted).split(',').map(s => s.trim()).filter(Boolean);
      if (wanted.length > 0) filter.skillsWanted = { $in: wanted };
    }

    // Debug log
    console.log('Marketplace filter:', JSON.stringify(filter));

    const users = await User.find(filter).select('-__v -password');
    res.json(users);
  } catch (err: any) {
    console.error('Error in listUsers:', err?.stack || err);
    res.status(500).json({ message: 'Server error', error: err?.message || String(err) });
  }
}; 