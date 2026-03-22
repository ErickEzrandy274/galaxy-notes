"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import {
	AuthCard,
	AuthHeader,
	AuthSubmitButton,
	PasswordInput,
	PasswordStrengthBar,
} from "@/features/auth";
import { generatePassword } from "@/features/auth/utils/generate-password";
import { useState, Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<ResetPasswordInput>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	const [passwordValue, setPasswordValue] = useState("");
	const passwordField = register("password");

	const handleGeneratePassword = () => {
		const pw = generatePassword();
		setValue("password", pw, { shouldDirty: true, shouldValidate: true });
		setValue("confirmPassword", pw, {
			shouldDirty: true,
			shouldValidate: true,
		});
		setPasswordValue(pw);
		navigator.clipboard.writeText(pw).then(
			() => toast.success("Password generated and copied to clipboard!"),
			() => toast.success("Password generated!"),
		);
	};

	if (!token) {
		return (
			<AuthCard>
				<AuthHeader
					title="Invalid Reset Link"
					subtitle="This password reset link is invalid or has expired."
				/>
				<button
					type="button"
					onClick={() => router.push("/forgot-password")}
					className="mt-6 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
				>
					Request New Link
				</button>
			</AuthCard>
		);
	}

	const onSubmit = async (data: ResetPasswordInput) => {
		setIsLoading(true);
		try {
			const response = await fetch(`${API_URL}/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password: data.password }),
			});

			if (!response.ok) {
				const err = await response.json();
				toast.error(err.message || "Something went wrong.");
				return;
			}

			toast.success("Password reset successfully!");
			router.push("/login");
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthCard>
			<AuthHeader
				title="Set New Password"
				subtitle="Must be at least 12 characters with mixed case, numbers & symbols."
			/>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-5 mt-6"
			>
				<fieldset className="flex flex-col gap-1">
					<label>
						<span className="block text-sm font-medium text-zinc-300">
							New Password
						</span>
						<PasswordInput
							id="password"
							placeholder="Enter new password"
							{...passwordField}
							onChange={(e) => {
								passwordField.onChange(e);
								setPasswordValue(e.target.value);
							}}
							error={errors.password?.message}
						/>
						<PasswordStrengthBar password={passwordValue} />
					</label>

					<button
						type="button"
						onClick={handleGeneratePassword}
						className="cursor-pointer text-sm text-right font-medium text-purple-400 hover:text-purple-300 underline"
					>
						Generate password!
					</button>
				</fieldset>

				<label>
					<span className="block text-sm font-medium text-zinc-300">
						Confirm New Password
					</span>
					<PasswordInput
						id="confirmPassword"
						placeholder="Confirm new password"
						{...register("confirmPassword")}
						error={errors.confirmPassword?.message}
					/>
				</label>

				<AuthSubmitButton loading={isLoading}>Reset Password</AuthSubmitButton>
			</form>

			<p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-zinc-500">
				<Clock size={14} />
				This link expires in 15 minutes
			</p>
		</AuthCard>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordContent />
		</Suspense>
	);
}
