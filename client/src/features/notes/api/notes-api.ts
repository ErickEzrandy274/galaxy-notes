import api from '@/lib/axios';
import type {
  NotesResponse,
  NotesFilters,
  NoteDetail,
  TagOption,
  SignedUploadUrlResponse,
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
  photo?: string;
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
    photo?: string;
    version: number;
  },
): Promise<NoteDetail> {
  const response = await api.patch<NoteDetail>(`/notes/${noteId}`, data);
  return response.data;
}

export async function fetchUserTags(): Promise<{ tags: TagOption[] }> {
  const response = await api.get<{ tags: TagOption[] }>('/notes/tags');
  return response.data;
}

export async function createSignedUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number,
): Promise<SignedUploadUrlResponse> {
  const response = await api.post<SignedUploadUrlResponse>(
    '/notes/upload-url',
    { fileName, mimeType, fileSize },
  );
  return response.data;
}
