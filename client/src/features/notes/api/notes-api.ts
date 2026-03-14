import api from '@/lib/axios';
import type {
  NotesResponse,
  NotesFilters,
  NoteDetail,
  NoteStats,
  TagOption,
  SignedUploadUrlResponse,
  VersionHistoryResponse,
  NoteVersionDetail,
  SharedNotesResponse,
  SharedNotesFilters,
} from '../types';

export async function fetchNotes(
  filters: NotesFilters,
): Promise<NotesResponse> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.tags) params.set('tags', filters.tags);

  const response = await api.get<NotesResponse>(`/notes?${params.toString()}`);
  return response.data;
}

export async function fetchSharedNotes(
  filters: SharedNotesFilters,
): Promise<SharedNotesResponse> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('status', 'shared');
  if (filters.search) params.set('search', filters.search);
  if (filters.ownerSearch) params.set('ownerSearch', filters.ownerSearch);
  if (filters.tags) params.set('tags', filters.tags);
  if (filters.permission) params.set('permission', filters.permission);

  const response = await api.get<SharedNotesResponse>(
    `/notes?${params.toString()}`,
  );
  return response.data;
}

export async function deleteNote(noteId: string): Promise<void> {
  await api.delete(`/notes/${noteId}`);
}

export async function fetchNote(noteId: string): Promise<NoteDetail> {
  const response = await api.get<NoteDetail>(`/notes/${noteId}`);
  return response.data;
}

export async function createNote(data: {
  title: string;
  content?: string;
  status?: string;
  tags?: string[];
  videoUrl?: string;
  document?: string;
}): Promise<NoteDetail> {
  const response = await api.post<NoteDetail>('/notes', data);
  return response.data;
}

export async function updateNote(
  noteId: string,
  data: {
    title?: string;
    content?: string;
    status?: string;
    tags?: string[];
    videoUrl?: string;
    document?: string | null;
    documentSize?: number | null;
    version: number;
    snapshot?: boolean;
  },
): Promise<NoteDetail> {
  const response = await api.patch<NoteDetail>(`/notes/${noteId}`, data);
  return response.data;
}

export async function fetchNoteStats(): Promise<NoteStats> {
  const response = await api.get<NoteStats>('/notes/stats');
  return response.data;
}

export async function fetchUserTags(): Promise<{ tags: TagOption[] }> {
  const response = await api.get<{ tags: TagOption[] }>('/notes/tags');
  return response.data;
}

export async function createSignedUploadUrl(
  noteId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  source: 'rich-text-editor' | 'attachment',
): Promise<SignedUploadUrlResponse> {
  const response = await api.post<SignedUploadUrlResponse>(
    '/notes/upload-url',
    { noteId, fileName, mimeType, fileSize, source },
  );
  return response.data;
}

export async function fetchVersionHistory(
  noteId: string,
  cursor?: string,
): Promise<VersionHistoryResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '10');
  const response = await api.get<VersionHistoryResponse>(
    `/notes/${noteId}/versions?${params.toString()}`,
  );
  return response.data;
}

export async function fetchVersionDetail(
  noteId: string,
  versionId: string,
): Promise<NoteVersionDetail> {
  const response = await api.get<NoteVersionDetail>(
    `/notes/${noteId}/versions/${versionId}`,
  );
  return response.data;
}

export async function restoreVersion(
  noteId: string,
  versionId: string,
): Promise<void> {
  await api.post(`/notes/${noteId}/versions/${versionId}/restore`);
}
