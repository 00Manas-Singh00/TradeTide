import { Request, Response } from 'express';
import BarterRequest from '../models/BarterRequest';
import { createNotification } from './notificationController';
import { createAuditLog } from './auditLogController';

export const createBarterRequest = async (req: Request, res: Response) => {
  try {
    const barterRequest = new BarterRequest(req.body);
    await barterRequest.save();
    // Notify recipient
    await createNotification(barterRequest.receiver.toString(), 'barter', `You received a new barter request from user ${barterRequest.sender}`);
    // Audit log
    await createAuditLog(barterRequest.sender.toString(), 'barter_created', String(barterRequest._id), barterRequest);
    res.status(201).json(barterRequest);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create barter request', details: err });
  }
};

export const getBarterRequests = async (req: Request, res: Response) => {
  const { user } = req.query;
  let filter: any = {};
  if (user) {
    filter = { $or: [ { sender: user }, { receiver: user } ] };
  }
  try {
    const requests = await BarterRequest.find(filter).populate('sender receiver');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch barter requests' });
  }
};

export const acceptBarterRequest = async (req: Request, res: Response) => {
  try {
    const request = await BarterRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ error: 'Barter request not found' });
      return;
    }
    // Notify requester
    await createNotification(request.sender.toString(), 'barter', `Your barter request to user ${request.receiver} was accepted.`);
    // Audit log
    const userId = req.body.user || request.sender.toString();
    await createAuditLog(userId, 'barter_accepted', String(request._id), request);
    res.json({ message: 'Barter request accepted', request });
  } catch (err) {
    res.status(400).json({ error: 'Failed to accept barter request', details: err });
  }
};

export const declineBarterRequest = async (req: Request, res: Response) => {
  try {
    const request = await BarterRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'declined' },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ error: 'Barter request not found' });
      return;
    }
    // Notify requester
    await createNotification(request.sender.toString(), 'barter', `Your barter request to user ${request.receiver} was declined.`);
    // Audit log
    const userId = req.body.user || request.sender.toString();
    await createAuditLog(userId, 'barter_declined', String(request._id), request);
    res.json({ message: 'Barter request declined', request });
  } catch (err) {
    res.status(400).json({ error: 'Failed to decline barter request', details: err });
  }
};

export const deleteBarterRequest = async (req: Request, res: Response) => {
  try {
    const request = await BarterRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Barter request not found' });
      return;
    }
    // Audit log
    const userId = req.body.user || request.sender.toString();
    await createAuditLog(userId, 'barter_deleted', String(request._id), request);
    res.json({ message: 'Barter request deleted', request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete barter request' });
  }
};

export const completeBarterRequest = async (req: Request, res: Response) => {
  try {
    const request = await BarterRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ error: 'Barter request not found' });
      return;
    }
    // Notify requester
    await createNotification(request.sender.toString(), 'barter', `Your barter request to user ${request.receiver} was marked as completed.`);
    // Audit log
    const userId = req.body.user || request.sender.toString();
    await createAuditLog(userId, 'barter_completed', String(request._id), request);
    res.json({ message: 'Barter request marked as completed', request });
  } catch (err) {
    res.status(400).json({ error: 'Failed to complete barter request', details: err });
  }
}; 