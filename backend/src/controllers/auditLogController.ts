import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const createAuditLog = async (user: string, action: string, target: string, details: any) => {
  const log = new AuditLog({ user, action, target, details });
  await log.save();
  return log;
};

export const getAuditLogs = async (req: Request, res: Response) => {
  const { user, action, target, from, to } = req.query;
  let filter: any = {};
  if (user) filter.user = user;
  if (action) filter.action = action;
  if (target) filter.target = target;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from as string);
    if (to) filter.createdAt.$lte = new Date(to as string);
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }
  try {
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}; 