import api from '@/lib/axios';
import type { NoteDetail } from '@/features/notes/types';
import type { TrashedNotesResponse, TrashFilters } from '../types';

export async function fetchTrashedNotes(
  filters: TrashFilters,
): Promise<TrashedNotesResponse> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.tags) params.set('tags', filters.tags);

  const response = await api.get<TrashedNotesResponse>(
    `/notes/trash?${params.toString()}`,
  );
  return response.data;
}

export async function fetchTrashedNote(noteId: string): Promise<NoteDetail> {
  const response = await api.get<NoteDetail>(`/notes/trash/${noteId}`);
  return response.data;
}

export async function restoreNote(noteId: string): Promise<void> {
  await api.post(`/notes/${noteId}/restore`);
}

export async function permanentDeleteNote(noteId: string): Promise<void> {
  await api.delete(`/notes/trash/${noteId}`);
}

export async function emptyTrash(): Promise<{ deleted: number }> {
  const response = await api.delete<{ deleted: number }>('/notes/trash');
  return response.data;
}
