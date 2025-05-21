import { apiGet, apiPost } from '../../apiClient';

export interface MarketplaceUser {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  avatarUrl?: string;
}

export async function fetchMarketplaceUsers(params?: {
  skillsOffered?: string[];
  skillsWanted?: string[];
}): Promise<MarketplaceUser[]> {
  let query = '';
  if (params) {
    const q = [];
    if (params.skillsOffered && params.skillsOffered.length > 0) {
      q.push('skillsOffered=' + encodeURIComponent(params.skillsOffered.join(',')));
    }
    if (params.skillsWanted && params.skillsWanted.length > 0) {
      q.push('skillsWanted=' + encodeURIComponent(params.skillsWanted.join(',')));
    }
    if (q.length > 0) query = '?' + q.join('&');
  }
  // Only fetch from API, throw error if it fails
  return await apiGet<MarketplaceUser[]>(`/api/marketplace/users${query}`);
}

// Fetch all barter requests for a user
export async function fetchBarterRequests(userId: string) {
  return apiGet(`/api/barter/list?userId=${encodeURIComponent(userId)}`);
}

// Real API for barter requests
export async function sendBarterRequest({ sender, receiver, skill }: { sender: string; receiver: string; skill: string }) {
  return apiPost('/api/barter/send', { sender, receiver, skill });
}

export async function acceptBarterRequest(userId: string) {
  return apiPost('/api/barter/accept', { userId });
}

export async function declineBarterRequest(userId: string) {
  return apiPost('/api/barter/decline', { userId });
} 