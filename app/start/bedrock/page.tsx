import { IpContainer, PageTransitionWrapper } from "../../components/ui";
// import { IpContainer } from "../components/ui/ip-container";
import { constants } from "../../utils";

export default function BedrockPage() {
	return (
		<PageTransitionWrapper className="mb-8">
			<div className="cursor-pointer group mx-auto p-6 w-fit">
				<div className="text-2xl font-semibold mb-4 list-none">
					<span className="flex items-center">Грати з Bedrock</span>
				</div>
				<div className="mt-2 pl-4 overflow-hidden transition-all duration-300 text-lg leading-relaxed">
					<p className="w-fit">
						Айпі для бедроку: <br />
						<IpContainer ip={constants.BEDROCK_IP} />
					</p>
					<br />
					<p className="font-bold">Версія: 1.21.50–26.51</p>
					<br />
					<p>
						Голосовий чат 🎙
						<p>
							Щоб спілкуватися голосом під час гри, виберіть зручний варіант:
						</p>
						<br />
						<p>
							Windows:{" "}
							<a
								className="underline"
								href="http://cloud.noboobs.world/public.php/dav/files/nPjp6zmREBLMQBP/?accept=zip"
							>
								версія зі встановленням
							</a>{" "}
						</p>
						<p>
							або{" "}
							<a
								className="underline"
								href="http://cloud.noboobs.world/public.php/dav/files/FgtgYNYnQgkjcrA/?accept=zip"
							>
								портативна версія
							</a>
						</p>
						<br />
						<p>
							Linux:{" "}
							<a
								className="underline"
								href="http://cloud.noboobs.world/public.php/dav/files/GjYnbdrg3HFWPgy/?accept=zip"
							>
								завантажити
							</a>
						</p>
						<br />
						<p>
							Android:{" "}
							<a
								className="underline"
								href="http://cloud.noboobs.world/public.php/dav/files/4GbFwf5knmrsTGo/?accept=zip"
							>
								завантажити
							</a>
						</p>
						<br />
						<p>
							Без встановлення:{" "}
							<a className="underline" href={constants.VOICE_URL}>
								відкрити вебверсію
							</a>
						</p>
						<br />
						<p>
							Як підключитися:{" "}
							<a className="underline" href="https://noboobs.world/voicechat">
								інструкція з голосового чату
							</a>
							. Голосовий чат необов’язковий — грати можна й без нього.
						</p>
					</p>
					<br />
					<p>Проходка безплатна!</p>
					<br />
					<p>
						Для того щоб розпочати Вашу гру на сервері потрібно зробити декілька
						простих кроків:
					</p>
					<br />
					<p>1. Зайти на майнкрафт сервер та отримати 4-х значний код</p>
					<br />
					<p>
						2. Відправте повідомлення
						<IpContainer ip={"/linkaccount code:<код>"} /> (або через підказку
						бота) в канал #🤖・реєстрація який знаходиться в нашому{" "}
						<u>
							<a href="https://discord.com/invite/JKFY4tMhuA">Discord</a>
						</u>
					</p>
					<br />
					<p>3. Ви успішно зв&apos;язали аккаунт і можете грати!</p>
					<br />
					<p>
						При виникненні проблем/зміни ніку, звертайтесь до адміністрації.
					</p>
				</div>
			</div>
		</PageTransitionWrapper>
	);
}
