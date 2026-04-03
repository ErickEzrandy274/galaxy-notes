import { Trash2 } from "lucide-react";

interface TrashEmptyStateProps {
	retentionDays: number;
}

export function TrashEmptyState({ retentionDays }: TrashEmptyStateProps) {
	return (
		<section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<figure className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
				<Trash2 size={32} className="text-muted-foreground" />
			</figure>
			<h2 className="text-xl font-semibold text-foreground">Trash is empty</h2>
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">
				Deleted notes will appear here. Items are permanently removed after{" "}
				{retentionDays} days.
			</p>
		</section>
	);
}
