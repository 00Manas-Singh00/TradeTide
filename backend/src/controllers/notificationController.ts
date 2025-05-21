import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const createNotification = async (user: string, type: string, message: string) => {
  const notif = new Notification({ user, type, message });
  await notif.save();
  return notif;
};

export const getNotifications = async (req: Request, res: Response) => {
  const { user } = req.query;
  let filter: any = {};
  if (user) filter.user = user;
  try {
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ message: 'Notification marked as read', notification: notif });
  } catch (err) {
    res.status(400).json({ error: 'Failed to mark notification as read', details: err });
  }
}; 