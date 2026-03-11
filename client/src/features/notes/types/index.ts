export type NoteStatus = 'draft' | 'published' | 'archived' | 'shared';

export type ColumnKey =
  | 'status'
  | 'tags'
  | 'createdAt'
  | 'lastModified'
  | 'shared';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  status: NoteStatus;
  tags: string[];
  videoUrl: string | null;
  version: number;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: { shares: number };
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
}

export interface NotesFilters {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  tags?: string;
}

export interface NoteDetail {
  id: string;
  title: string;
  content: string | null;
  status: NoteStatus;
  tags: string[];
  photo: string | null;
  videoUrl: string | null;
  version: number;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string | null; lastName: string | null };
  shares: Array<{
    id: string;
    userId: string;
    permission: 'READ' | 'WRITE';
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  }>;
}

export interface TagOption {
  name: string;
  count: number;
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface NoteEditorData {
  title: string;
  content: string;
  tags: string[];
  photo: string | null;
  videoUrl: string;
  status: NoteStatus;
}

export interface SignedUploadUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
}
