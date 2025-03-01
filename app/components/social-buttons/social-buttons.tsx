import { DiscordIcon } from "../icons/discord";
import { TelegramIcon } from "../icons/telegram";

export function SocialButtons() {
  return (
    <div className="flex justify-center gap-4 mx-auto mt-4 flex-wrap">
      <button type="button" className="btn btn-secondary btn w-48">
        Почати грати
      </button>
      <div className="flex justify-center gap-4 flex-wrap">
        <a
          className="link-hover link"
          href="https://discord.gg/WrzV6BvEQD"
          target="_blank"
          rel="noreferrer"
        >
          <button
            type="button"
            className="btn btn-outline btn-primary btn w-48"
          >
            Ми в Discord
            <DiscordIcon />
          </button>
        </a>
        <a
          className="link-hover link"
          href="https://t.me/noboobs_ua"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button" className="btn btn-outline btn-accent btn w-48">
            Ми в Telegram
            <TelegramIcon />
          </button>
        </a>
      </div>
    </div>
  );
}
