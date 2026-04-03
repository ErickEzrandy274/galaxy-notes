import api from '@/lib/axios';
import type {
  SharesResponse,
  AddSharesRequest,
  AddSharesResponse,
  UserSearchResult,
} from '../types';

export async function fetchSharesForNote(noteId: string, signal?: AbortSignal): Promise<SharesResponse> {
  const response = await api.get<SharesResponse>(`/shares/note/${noteId}`, { signal });
  return response.data;
}

export async function addShares(data: AddSharesRequest): Promise<AddSharesResponse> {
  const response = await api.post<AddSharesResponse>('/shares', data);
  return response.data;
}

export async function updateSharePermission(
  shareId: string,
  permission: 'READ' | 'WRITE',
): Promise<void> {
  await api.patch(`/shares/${shareId}`, { permission });
}

export async function removeShare(shareId: string): Promise<void> {
  await api.delete(`/shares/${shareId}`);
}

export async function removeInvite(inviteId: string): Promise<void> {
  await api.delete(`/shares/invite/${inviteId}`);
}

export async function requestNoteAccess(noteId: string): Promise<void> {
  await api.post(`/shares/request-access/${noteId}`);
}

export async function grantNoteAccess(
  noteId: string,
  userId: string,
  permission: 'READ' | 'WRITE' = 'READ',
): Promise<void> {
  await api.post(`/shares/grant-access/${noteId}/${userId}?permission=${permission}`);
}

export async function declineNoteAccess(noteId: string, userId: string): Promise<void> {
  await api.post(`/shares/decline-access/${noteId}/${userId}`);
}

export async function searchUsers(email: string, signal?: AbortSignal): Promise<UserSearchResult[]> {
  const response = await api.get<UserSearchResult[]>(
    `/users/search?email=${encodeURIComponent(email)}`,
    { signal },
  );
  return response.data;
}
