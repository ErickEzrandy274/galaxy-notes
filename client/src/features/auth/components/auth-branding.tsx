import { Check, FileText } from "lucide-react";
import type { AuthBrandingConfig } from "../types";

interface AuthBrandingProps {
	config: AuthBrandingConfig;
}

export function AuthBranding({ config }: AuthBrandingProps) {
	return (
		<aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[linear-gradient(to_bottom_right,_theme(colors.purple.700),_theme(colors.purple.600),_theme(colors.violet.600),_theme(colors.indigo.600),_theme(colors.indigo.700))] p-12 text-white lg:flex">
			{/* Decorative circles (positions from Figma, 720×900 brand-bg) */}
			<span className="pointer-events-none absolute inset-0" aria-hidden="true">
				{/* deco-1 — top-left, partially clipped */}
				<span className="absolute left-[-14%] top-[-11%] w-[69%] aspect-square rounded-full bg-white/[0.06]" />
				{/* deco-2 — bottom-right, partially clipped */}
				<span className="absolute left-[56%] top-[61%] w-[56%] aspect-square rounded-full bg-white/[0.06]" />
				{/* deco-3 — top-right, mostly visible */}
				<span className="absolute left-[65%] top-[5%] w-[25%] aspect-square rounded-full bg-white/[0.08]" />
			</span>

			{/* Logo */}
			<h1 className="relative text-4xl font-bold">
				<span className="text-yellow-300">&#10022;</span> Galaxy Notes
			</h1>

			{/* Content section — left-aligned */}
			<section className="relative flex flex-col p-20">
				{/* Note illustration with circle backdrop */}
				<figure className="my-8 flex h-52 w-52 mx-auto items-center justify-center rounded-full bg-white/[0.06]">
					<span className="flex h-40 w-40 items-center justify-center rounded-full bg-white/[0.08]">
						<FileText size={100} className="text-white/80" aria-hidden="true" />
					</span>
				</figure>

				{/* Headline */}
				<h2 className="mb-4 max-w-xs text-left text-3xl font-bold leading-tight">
					{config.headline}
				</h2>

				{/* Subtitle */}
				<p className="mb-8 max-w-sm text-left text-purple-100/80">
					{config.subtitle}
				</p>

				{/* Feature bullets */}
				<ul className="space-y-3">
					{config.features.map((feature) => (
						<li key={feature} className="flex items-center gap-3">
							<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
								<Check size={12} />
							</span>
							<span className="text-sm text-purple-100">{feature}</span>
						</li>
					))}
				</ul>
			</section>

			{/* Spacer for bottom padding */}
			<span />
		</aside>
	);
}
