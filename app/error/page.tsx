"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Щось пішло не так</h1>
      <p className="text-lg">
        Будь ласка, зверніться до адміністрації і дайте нам знати
      </p>
      <Link href="/" className="btn btn-primary">
        На головну
      </Link>
    </div>
  );
}
