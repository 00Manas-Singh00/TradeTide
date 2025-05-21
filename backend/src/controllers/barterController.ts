import { Request, Response } from 'express';
import BarterRequest from '../models/BarterRequest';

// Create a barter request
export const sendBarterRequest = async (req: Request, res: Response) => {
  const { sender, receiver, skill } = req.body;
  if (!sender || !receiver || !skill) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const request = new BarterRequest({ sender, receiver, skill });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create barter request', error: err });
  }
};

// List all barter requests for a user (incoming and outgoing)
export const listBarterRequests = async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const requests = await BarterRequest.find({
      $or: [{ sender: userId }, { receiver: userId }]
    });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch barter requests', error: err });
  }
};

// Accept a barter request
export const acceptBarterRequest = async (req: Request, res: Response) => {
  const { requestId } = req.body;
  try {
    const request = await BarterRequest.findByIdAndUpdate(
      requestId,
      { status: 'accepted' },
      { new: true }
    );
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept barter request', error: err });
  }
};

// Decline a barter request
export const declineBarterRequest = async (req: Request, res: Response) => {
  const { requestId } = req.body;
  try {
    const request = await BarterRequest.findByIdAndUpdate(
      requestId,
      { status: 'declined' },
      { new: true }
    );
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to decline barter request', error: err });
  }
}; 