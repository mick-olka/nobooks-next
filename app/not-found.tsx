import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-gray-500">Сторінку не знайдено.</p>
			<Link href="/" className="btn btn-primary">
				На головну
			</Link>
		</div>
	);
}
