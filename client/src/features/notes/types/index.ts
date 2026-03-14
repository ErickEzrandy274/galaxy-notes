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

// ─── Sharing Types ────────────────────────────────────────────────────────────

export interface NoteShareItem {
  id: string;
  noteId: string;
  userId: string;
  permission: 'READ' | 'WRITE';
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    photo: string | null;
  };
}

export interface PendingInvite {
  id: string;
  token: string;
  email: string;
  noteId: string;
  permission: 'READ' | 'WRITE';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface SharesResponse {
  shares: NoteShareItem[];
  pendingInvites: PendingInvite[];
}

export interface AddSharesRequest {
  noteId: string;
  recipients: Array<{ email: string; permission?: 'READ' | 'WRITE' }>;
}

export interface AddSharesResponse {
  shared: NoteShareItem[];
  invited: PendingInvite[];
}

export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  photo: string | null;
}

export interface PendingShareRecipient {
  email: string;
  permission: 'READ' | 'WRITE';
  user?: UserSearchResult;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface NotificationActor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  photo: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  noteId: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  /** Whether the linked note is still at the expected location (trash vs active). Only set for version_cleanup/restore types. */
  isNoteAvailable?: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export type NotificationFilter = 'all' | 'unread' | 'shared' | 'muted';

export type MuteDuration = '1h' | '1d' | '1w' | 'forever';

export interface MutedUser {
  id: string;
  mutedUser: NotificationActor;
  expiresAt: string | null;
  createdAt: string;
}

// ─── Shared Notes Types ──────────────────────────────────────────────────────

export interface SharedNoteOwner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  photo: string | null;
}

export interface SharedNote {
  id: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  owner: SharedNoteOwner;
  shareId: string;
  permission: 'READ' | 'WRITE';
  sharedOn: string;
}

export interface SharedNotesResponse {
  notes: SharedNote[];
  total: number;
  page: number;
  limit: number;
}

export interface SharedNotesFilters {
  page: number;
  limit: number;
  search?: string;
  ownerSearch?: string;
  tags?: string;
  permission?: 'READ' | 'WRITE';
}

export type SharedNoteColumnKey =
  | 'owner'
  | 'permission'
  | 'tags'
  | 'createdAt'
  | 'sharedOn';

// ─── Archived Notes Types ───────────────────────────────────────────────────

export interface ArchivedNotesFilters {
  page: number;
  limit: number;
  search?: string;
  tags?: string;
}

export type ArchivedNoteColumnKey = 'tags' | 'createdAt' | 'updatedAt';
