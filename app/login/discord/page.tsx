import { signInWithDiscord } from "../actions";

export default function LoginDiscordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="p-8 bg-base-100 rounded-lg shadow-md w-full max-w-md">
        <div className="space-y-4">
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              formAction={signInWithDiscord}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log in with Discord
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
