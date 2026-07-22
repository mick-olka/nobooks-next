import { signInWithDiscord } from "./actions";

export default function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<form className="p-8 bg-base-100 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold text-center mb-6">
					no boobs: особистий кабінет
				</h1>

				<div className="space-y-4 flex items-center justify-center">
					<button
						type="submit"
						formAction={signInWithDiscord}
						className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Зайти з допомогою Discord
					</button>
				</div>
			</form>
		</div>
	);
}
