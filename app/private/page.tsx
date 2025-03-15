import Link from "next/link";
import { constants } from "../utils";
import { logout } from "@/app/login/actions";
import { getAuthorizedUser } from "@/app/auth";

export default async function PrivatePage() {
  const user = await getAuthorizedUser({ protectedPage: true });

  const handleLogout = async () => {
    "use server";
    await logout();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl bg-base-100 rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Особистий кабінет</h1>
          <form action={handleLogout}>
            <button className="btn btn-error" type="submit">
              Вийти
            </button>
          </form>
        </div>
        <p className="text-lg leading-relaxed">
          Привіт, <span className="font-medium">{user.email}</span>!
          <br />
          Скоро тут буде твій особистий кабінет, слідкуй за оновленнями в нашому{" "}
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
      </div>
    </div>
  );
}
