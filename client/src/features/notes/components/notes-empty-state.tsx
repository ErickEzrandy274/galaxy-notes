import { FileText } from 'lucide-react';

export function NotesEmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-24">
      <figure className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted" aria-hidden="true">
        <FileText size={32} className="text-muted-foreground" />
      </figure>
      <h2 className="mb-2 text-xl font-semibold text-foreground">No notes yet</h2>

      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        Create your first note to get started. All your notes will appear here.
      </p>
    </section>
  );
}
