import type { NoteStatus } from '@/features/notes/types';

export type TrashColumnKey =
  | 'originalStatus'
  | 'tags'
  | 'createdAt'
  | 'deletedOn'
  | 'daysLeft';

export interface TrashedNote {
  id: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  createdAt: string;
  deletedAt: string;
}

export interface TrashedNotesResponse {
  notes: TrashedNote[];
  total: number;
  page: number;
  limit: number;
}

export interface TrashFilters {
  page: number;
  limit: number;
  search?: string;
  tags?: string;
}

export type AutoDeleteBehavior = 'delete_note_and_versions' | 'delete_versions_only';

export interface UserPreferences {
  id: string;
  trashRetentionDays: number;
  autoDeleteBehavior: AutoDeleteBehavior;
}
