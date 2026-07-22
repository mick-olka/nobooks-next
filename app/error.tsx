"use client";

import { useEffect } from "react";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error boundary convention
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-3xl font-bold">Щось пішло не так</h1>
			<p className="text-gray-500">Спробуйте ще раз.</p>
			<button type="button" className="btn btn-primary" onClick={reset}>
				Повторити
			</button>
		</div>
	);
}
