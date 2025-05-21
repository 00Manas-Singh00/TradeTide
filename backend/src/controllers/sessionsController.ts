import { Request, Response } from 'express';
import Session from '../models/Session';

// GET /api/sessions?userId=...
export const getSessions = async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const sessions = await Session.find({ userIds: userId });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: err });
  }
};

// POST /api/sessions
export const createSession = async (req: Request, res: Response) => {
  const { userId1, userId2, date, skill } = req.body;
  if (!userId1 || !userId2 || !date || !skill) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const session = new Session({
      userIds: [userId1, userId2],
      scheduledBy: userId1,
      date,
      status: 'pending',
      skill,
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create session', error: err });
  }
}; 