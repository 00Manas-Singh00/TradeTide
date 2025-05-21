import { apiGet, apiPost } from '../../apiClient';

export async function fetchReviews(userId: string) {
  return apiGet('/api/reviews?userId=' + encodeURIComponent(userId));
}

export async function submitReview(review: any) {
  return apiPost('/api/reviews', review);
}

export async function fetchPendingReviews(userId: string) {
  return apiGet('/api/reviews/pending?userId=' + encodeURIComponent(userId));
} 