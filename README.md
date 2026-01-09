# No Books Next JS project

## Notes

- tailwind uses DaisyUI as a plugin
- framer-motion is used for animations
- react-snowfall is used for the snow effect
- react-markdown is used for the markdown rendering (features, rules, faq, etc)

## Usage:

Install the dependencies:

```bash
pnpm install
```

To start the development server and run the project, use the following command:

```bash
pnpm run dev
```

This will start the development server and open your project in the browser. Any changes you make to the source code will be automatically reflected in the browser.

## Building for Production

To build the project for production, use the following command:

```bash
pnpm run build
```

To build the project using docker, use the following command:

```bash
sudo docker compose up --build -d
```


{
	"name": "no-books-next",
	"version": "0.1.0",
	"private": true,
	"scripts": {
		"dev": "next dev --turbopack",
		"build": "next build",
		"start": "next start",
		"lint": "biome lint --write"
	},
	"dependencies": {
		"@supabase/ssr": "^0.5.2",
		"@supabase/supabase-js": "^2.49.1",
		"clsx": "^2.1.1",
		"framer-motion": "^11.15.0",
		"jwt-decode": "^4.0.0",
		"next": "15.1.3",
		"react": "^19.0.0",
		"react-dom": "^19.0.0",
		"react-hot-toast": "^2.5.1",
		"react-markdown": "^9.0.1",
		"rehype-raw": "^7.0.0",
		"tailwind-merge": "^2.6.0"
	},
	"devDependencies": {
		"@biomejs/biome": "1.9.4",
		"@eslint/eslintrc": "^3",
		"@types/node": "^20",
		"@types/react": "^19",
		"@types/react-dom": "^19",
		"daisyui": "^4.12.23",
		"eslint": "^9",
		"eslint-config-next": "15.1.3",
		"postcss": "^8",
		"sass": "^1.83.1",
		"tailwindcss": "^3.4.1",
		"typescript": "^5"
	}
}
