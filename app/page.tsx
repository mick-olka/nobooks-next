import {
	IpContainer,
	NewsPane,
	PageTransitionWrapper,
	PlayerCounter,
	SocialButtons,
} from "@/app/components";
import Image from "next/image";
import Link from "next/link";
import { constants } from "./utils";
import HistoryListPage from "./history/page";

// Time periods configuration for hero background
const TIME_PERIODS = {
	MORNING: { start: 6, end: 12, className: "sb-morning" },
	DAY: { start: 12, end: 18, className: "sb-day" },
	EVENING: { start: 18, end: 21, className: "sb-evening" },
	NIGHT: { start: 21, end: 6, className: "sb-night" },
} as const;

/**
 * Determines the current time period based on the hour
 */
function getCurrentTimePeriod(hour: number): string {
	if (hour >= TIME_PERIODS.MORNING.start && hour < TIME_PERIODS.MORNING.end) {
		return TIME_PERIODS.MORNING.className;
	}
	if (hour >= TIME_PERIODS.DAY.start && hour < TIME_PERIODS.DAY.end) {
		return TIME_PERIODS.DAY.className;
	}
	if (hour >= TIME_PERIODS.EVENING.start && hour < TIME_PERIODS.EVENING.end) {
		return TIME_PERIODS.EVENING.className;
	}
	// Night period (21-23 and 0-5)
	return TIME_PERIODS.NIGHT.className;
}

export default async function Home() {
	const currentHour = new Date().getHours();
	const timeBasedClass = getCurrentTimePeriod(currentHour);

	return (
		<PageTransitionWrapper>
			<div
				className={`hero min-h-[calc(100vh-264px)] bg-base-200 font-minecraft ${timeBasedClass}`}
			>
				<div className="hero-content flex-col lg:flex-row">
					<Image
						src="/images/bg1.png"
						alt="noboobs"
						className="max-w-md rounded-lg shadow-2xl w-full"
						width={1024}
						height={1024}
					/>
					<div className="flex flex-col items-center sm:items-start">
						<h1 className="text-3xl font-bold sm:text-5xl">
							Вітаємо на&nbsp;сервері no&nbsp;boobs
						</h1>
						<p className="py-1 mx-auto">
							Український ванільний+ Майнкрафт сервер для Java та Bedrock
							гравців
						</p>
						<div className="p-2 my-2 rounded-lg bg-gray-800 mx-auto text-center">
							<div className="text-center">
								<PlayerCounter
									ip={constants.JAVA_IP}
									format="Поточний онлайн: {online}"
									refreshRate={600}
								/>
								{/* <b>Ведуться технічні роботи - сервер скоро повернеться</b> */}
							</div>
							<div className="flex flex-col items-center gap-2 mt-2">
								<div className="flex items-center justify-center gap-2 mb-4 relative">
									<span className="text-center">Java:</span>
									<IpContainer ip={constants.JAVA_IP} />
									<Link
										className="text-sm text-gray-400 underline absolute top-7 right-0"
										href="/start/java"
									>
										<p>Проблеми з підключенням?</p>
									</Link>
								</div>
								<div className="flex items-center justify-center gap-0 flex-wrap sm:gap-2">
									<span className="text-center">Bedrock:</span>
									<IpContainer ip={constants.BEDROCK_IP} />
								</div>
							</div>
						</div>
						<SocialButtons />
					</div>
				</div>
			</div>
			<NewsPane />
		</PageTransitionWrapper>
	);
}
