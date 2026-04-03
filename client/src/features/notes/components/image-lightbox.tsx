"use client";

import { X } from "lucide-react";

interface ImageLightboxProps {
	open: boolean;
	src: string;
	alt: string;
	onClose: () => void;
}

export function ImageLightbox({ open, src, alt, onClose }: ImageLightboxProps) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
		>
			<div className="fixed inset-0 bg-black/70" aria-hidden="true" />

			<figure className="relative z-10">
				<button
					type="button"
					onClick={onClose}
					className="absolute -top-3 -right-3 z-10 h-8 w-8 cursor-pointer rounded-full p-1.5 bg-card border border-border text-muted-foreground hover:text-foreground"
					aria-label="Close lightbox"
				>
					<X className="h-5 w-5" />
				</button>

				<img
					src={src}
					alt={alt}
					className="max-h-[60vh] max-w-[60vw] object-contain"
				/>
			</figure>
		</div>
	);
}
