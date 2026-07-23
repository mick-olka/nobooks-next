// import Image from "next/image";
import Link from "next/link";
import { PageTransitionWrapper } from "@/app/components";

const data = [
	{
		title: "🚩 Поселення",
		text: "Познайомтеся з різними поселеннями, їх правилами та особливостями",
		href: "/regions",
	},
	{
		title: "📖 Історія сервера",
		text: "Познайомтеся з історією сервера та його розвитком",
		href: "/history",
	},
	{ title: "❓ ЧаПи", text: "Відповіді на часті запитання", href: "/faq" },
	{
		title: "📃 Правила",
		text: "Ознайомтеся з правилами сервера",
		href: "/rules",
	},
	{
		title: "⭐ Додатки",
		text: "Особливості сервера та інструкції, голосовий чат, пивоваріння та інше",
		href: "/features",
	},
	{
		title: "🎖️ Стіна слави",
		text: "Різні рекорди та статистика гравців сервера",
		href: "/stats",
	},
];

export default function WikiPage() {
	return (
		<PageTransitionWrapper className="p-8">
			<h1 className="text-3xl font-bold text-center m-4">no boobs Wiki</h1>
			<div className="flex flex-wrap gap-12 justify-center">
				{data.map((item) => (
					<Link
						key={item.title}
						href={item.href}
						className="p-8 rounded-lg shadow-md bg-base-100 hover:shadow-lg hover:translate-y-[-10px] transition-all duration-300 w-96"
					>
						<h2 className="text-2xl font-semibold mb-2">{item.title}</h2>
						{/* <Image
            src="/images/region.png"
            alt="Regions"
            width={400}
            height={400}
            className="rounded-lg m-auto lg:h-80 w-80"
          /> */}
						<p className="text-gray-600">{item.text}</p>
					</Link>
				))}
			</div>
		</PageTransitionWrapper>
	);
}
