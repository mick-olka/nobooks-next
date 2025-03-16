import { signInWithDiscord } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="p-8 bg-base-100 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          no boobs: особистий кабінет
        </h1>

        <div className="space-y-4 flex items-center justify-center">
          {/* <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              formAction={login}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log in
            </button>
            <button
              type="submit"
              formAction={signup}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Sign up
            </button> */}
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
