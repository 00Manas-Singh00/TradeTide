import { Request, Response } from 'express';
import Review from '../models/Review';
import { createAuditLog } from './auditLogController';

export const getAllReviews = async (req: Request, res: Response) => {
  const {
    reviewer,
    reviewee,
    skill,
    minRating,
    maxRating,
    createdBefore,
    createdAfter,
    page = 1,
    limit = 10,
  } = req.query;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;

  let filter: any = {};
  if (reviewer) filter.reviewer = reviewer;
  if (reviewee) filter.reviewee = reviewee;
  if (skill) {
    filter.$or = [
      { 'skill.name': skill },
      { 'skill.id': skill },
    ];
  }
  if (minRating || maxRating) {
    filter.rating = {};
    if (minRating) filter.rating.$gte = Number(minRating);
    if (maxRating) filter.rating.$lte = Number(maxRating);
    if (Object.keys(filter.rating).length === 0) delete filter.rating;
  }
  if (createdBefore || createdAfter) {
    filter.createdAt = {};
    if (createdBefore) filter.createdAt.$lt = new Date(createdBefore as string);
    if (createdAfter) filter.createdAt.$gt = new Date(createdAfter as string);
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  try {
    const reviews = await Review.find(filter)
      .populate('reviewer reviewee')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    const total = await Review.countDocuments(filter);
    res.json({
      reviews,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getReviewsByUser = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId }).populate('reviewer reviewee');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const review = new Review(req.body);
    await review.save();
    // Audit log
    await createAuditLog(review.reviewer.toString(), 'review_created', String(review._id), review);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create review', details: err });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    // Audit log
    const userId = req.body.user || review.reviewer?.toString() || '';
    await createAuditLog(userId, 'review_deleted', String(review._id), review);
    res.json({ message: 'Review deleted', review });
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
    return;
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      req.body,
      { new: true }
    );
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    // Audit log
    const userId = req.body.user || review.reviewer?.toString() || '';
    await createAuditLog(userId, 'review_updated', String(review._id), review);
    res.json({ message: 'Review updated', review });
    return;
  } catch (err) {
    res.status(400).json({ error: 'Failed to update review', details: err });
    return;
  }
}; 