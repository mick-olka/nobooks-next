import { getAuthorizedUser } from "@/app/auth";
import { logout } from "@/app/login/actions";
import Image from "next/image";
import Link from "next/link";
import { constants } from "../utils";
import { getPlayerIndividualStats } from "../utils/services";

export default async function PrivatePage() {
	const user = await getAuthorizedUser({ protectedPage: true });
	// const discordId = user?.user_metadata.provider_id;
	// let playerIndividualStats: Record<string, string> = {};
	// if (discordId) {
	// 	playerIndividualStats = await getPlayerIndividualStats(discordId);
	// }
	const handleLogout = async () => {
		"use server";
		await logout();
	};

	if (!user) return null;

	return (
		<div className="min-h-screen flex items-center justify-center p-8 bg-base-200">
			<div className="max-w-3xl w-full bg-base-100 rounded-lg shadow-lg p-8">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Особистий кабінет</h1>
					<form action={handleLogout}>
						<button className="btn btn-error" type="submit">
							Вийти
						</button>
					</form>
				</div>

				<div className="flex flex-col md:flex-row gap-6 mb-6">
					<div className="flex-shrink-0">
						<Image
							src={
								user.user_metadata?.picture || "https://via.placeholder.com/100"
							}
							alt="Profile"
							width={96}
							height={96}
							className="w-24 h-24 rounded-full border-4 border-primary"
						/>
					</div>

					<div className="flex-grow">
						<h2 className="text-xl font-semibold mb-2">
							{user.user_metadata?.full_name || user.email}
							<span className="text-sm text-gray-500 ml-2">({user.name})</span>
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="card bg-base-200 p-3 rounded-md">
								<p className="text-sm text-gray-500">Email</p>
								<p>{user.email}</p>
							</div>

							<div className="card bg-base-200 p-3 rounded-md">
								<p className="text-sm text-gray-500">Роль</p>
								<p className="capitalize">{user.user_role || "користувач"}</p>
							</div>

							<div className="card bg-base-200 p-3 rounded-md">
								<p className="text-sm text-gray-500">Провайдер</p>
								<p className="capitalize">
									{user.app_metadata?.provider || "невідомо"}
								</p>
							</div>

							<div className="card bg-base-200 p-3 rounded-md">
								<p className="text-sm text-gray-500">Дата реєстрації</p>
								<p>{new Date(user.created_at).toLocaleDateString("uk-UA")}</p>
							</div>
						</div>
					</div>
				</div>

				<div className="divider" />

				<p className="text-lg leading-relaxed">
					Привіт,{" "}
					<span className="font-medium">
						{user.user_metadata.custom_claims.global_name || user.email}
					</span>
					!
					<br />
					Скоро тут буде більше функцій для твого особистого кабінету, слідкуй
					за оновленнями в нашому{" "}
					<Link
						href={constants.DISCORD_URL}
						className="text-blue-500 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Діскорд сервері
					</Link>{" "}
					чи{" "}
					<Link
						href={constants.TELEGRAM_URL}
						className="text-blue-500 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Телеграмі
					</Link>
				</p>

				{/* <div className="divider" />

				{Object.keys(playerIndividualStats).length > 0 && (
					<>
						<h2 className="text-xl font-semibold mb-4">Статистика гравця</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
							{Object.entries(playerIndividualStats).map(([key, value]) => (
								<div key={key} className="card bg-base-200 p-3 rounded-md">
									<p className="text-sm text-gray-500">{key}</p>
									<p className="font-medium">{value}</p>
								</div>
							))}
						</div>
					</>
				)} */}
			</div>
		</div>
	);
}
