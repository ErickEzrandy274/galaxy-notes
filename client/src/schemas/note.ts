import { z } from 'zod';

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived', 'shared']).default('draft'),
  tags: z.array(z.string()).default([]),
  videoUrl: z
    .string()
    .url('Invalid URL')
    .regex(/youtube\.com|youtu\.be/, 'Must be a YouTube link')
    .optional()
    .or(z.literal('')),
});

export const shareNoteSchema = z.object({
  email: z.string().email('Invalid email address'),
  permission: z.enum(['READ', 'WRITE']).default('READ'),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type ShareNoteInput = z.infer<typeof shareNoteSchema>;
