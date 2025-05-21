import { apiGet, apiPost } from '../../apiClient';

export async function fetchSessions(userId: string) {
  return apiGet('/api/sessions?userId=' + encodeURIComponent(userId));
}

export async function createSession(session: any) {
  return apiPost('/api/sessions', session);
}

// Fetch details for multiple sessions by IDs
export async function fetchSessionDetails(sessionIds: string[]) {
  if (!sessionIds.length) return [];
  const idsParam = sessionIds.map(encodeURIComponent).join(',');
  return apiGet(`/api/sessions/details?ids=${idsParam}`);
} 