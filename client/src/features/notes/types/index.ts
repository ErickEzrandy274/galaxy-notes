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
  status: NoteStatus;
  tags: string[];
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
  document: string | null;
  documentUrl: string | null;
  documentSize: number | null;
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
  document: string | null;
  documentSize: number | null;
  videoUrl: string;
  status: NoteStatus;
}

export interface NoteStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  shared: number;
}

export interface SignedUploadUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  downloadUrl: string | null;
}

export interface NoteVersionSummary {
  id: string;
  version: number;
  title: string;
  changedBy: string;
  changedByName: string;
  createdAt: string;
}

export interface NoteVersionDetail {
  id: string;
  noteId: string;
  version: number;
  title: string;
  content: string;
  changedBy: string;
  changedByName: string;
  createdAt: string;
  document: string | null;
  documentSize: number | null;
  documentUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  currentContent: string | null;
  currentTitle: string;
  currentDocument: string | null;
  currentDocumentSize: number | null;
  currentDocumentUrl: string | null;
  currentVideoUrl: string | null;
  currentTags: string[];
  noteStatus: NoteStatus;
}

export interface VersionHistoryResponse {
  versions: NoteVersionSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  totalVersions: number;
}
