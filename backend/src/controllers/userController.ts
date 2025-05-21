import { Request, Response } from 'express';
import User from '../models/User';
import { RequestHandler } from 'express';

export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById: RequestHandler = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create user', details: err });
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user', details: err });
  }
};

export const getUsersBySkill: RequestHandler = async (req, res) => {
  const { skill } = req.query;
  if (!skill) {
    res.status(400).json({ error: 'Missing skill query parameter' });
    return;
  }
  try {
    const users = await User.find({
      $or: [
        { 'skillsOffered.name': skill },
        { 'skillsOffered.id': skill },
        { 'skillsWanted.name': skill },
        { 'skillsWanted.id': skill },
      ],
    });
    res.json(users);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by skill' });
    return;
  }
};

export const getUsersAdvanced: RequestHandler = async (req, res) => {
  const { skill, type, page = 1, limit = 10, badges, name, email, createdBefore, createdAfter } = req.query;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;

  let filter: any = {};

  // Skill filter
  if (skill) {
    if (type === 'offered') {
      filter.$or = [
        { 'skillsOffered.name': skill },
        { 'skillsOffered.id': skill },
      ];
    } else if (type === 'wanted') {
      filter.$or = [
        { 'skillsWanted.name': skill },
        { 'skillsWanted.id': skill },
      ];
    } else {
      filter.$or = [
        { 'skillsOffered.name': skill },
        { 'skillsOffered.id': skill },
        { 'skillsWanted.name': skill },
        { 'skillsWanted.id': skill },
      ];
    }
  }

  // Badge filter
  if (badges) {
    const badgeArr = (badges as string).split(',').map(b => b.trim()).filter(Boolean);
    if (badgeArr.length > 0) {
      filter.badges = { $in: badgeArr };
    }
  }

  // Name filter (case-insensitive substring match)
  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }

  // Email filter (exact match)
  if (email) {
    filter.email = email;
  }

  // Creation date filters
  if (createdBefore || createdAfter) {
    filter.createdAt = {};
    if (createdBefore) {
      filter.createdAt.$lt = new Date(createdBefore as string);
    }
    if (createdAfter) {
      filter.createdAt.$gt = new Date(createdAfter as string);
    }
    // Remove createdAt if empty
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt;
    }
  }

  try {
    const users = await User.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    const total = await User.countDocuments(filter);
    res.json({
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
    return;
  }
}; 