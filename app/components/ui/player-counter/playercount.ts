interface PlayerCounterProps {
  ip: string;
  element: HTMLElement | string;
  format?: string;
  refreshRate?: number;
}

interface ServerResponse {
  online: boolean;
  players: {
    now: number;
    max: number;
  };
}

export class PlayerCounter {
  private ip: string;
  private port: string;
  private format: string;
  private element: HTMLElement;
  private timerId: number;

  constructor({
    ip,
    element,
    format = "{online}",
    refreshRate = 60000,
  }: PlayerCounterProps) {
    if (!ip) throw TypeError("ip cannot be null or undefined");
    if (!element) throw TypeError("element cannot be null or undefined");

    const [address, port] = ip.split(":");
    this.ip = address;
    this.port = port || "25565";
    this.format = format;
    this.element =
      typeof element === "string"
        ? (document.querySelector(element) as HTMLElement)
        : element;
    if (!this.element) {
      throw new Error("PlayerCounter: Element not found");
    }
    this.runQuery();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.timerId = setInterval(this.runQuery.bind(this), refreshRate);
  }

  private runQuery(): void {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const response: ServerResponse = JSON.parse(xhr.responseText);

        const statusAttr = this.element.getAttribute(
          "data-playercounter-status"
        );
        if (statusAttr !== null) {
          this.element.innerText = response.online ? "online" : "offline";
          return;
        }

        if (response.online) {
          this.element.innerHTML = this.format.replace(
            /{\b(online|max)\b}/gi,
            (_, type: string) =>
              response.players[type === "online" ? "now" : "max"].toString()
          );
        }
      }
    };

    xhr.open(
      "GET",
      `https://mcapi.us/server/status?ip=${this.ip}&port=${this.port}`
    );
    xhr.send();
  }

  public destroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}

// Initialize player counters when DOM is ready
const initPlayerCounters = (): void => {
  if (typeof window === "undefined") return;

  const elements = document.querySelectorAll("[data-playercounter-ip]");
  for (const element of elements) {
    new PlayerCounter({
      element: element as HTMLElement,
      ip: element.getAttribute("data-playercounter-ip") || "",
      format: element.getAttribute("data-playercounter-format") || undefined,
      refreshRate: element.getAttribute("data-playercounter-refreshRate")
        ? Number(element.getAttribute("data-playercounter-refreshRate"))
        : undefined,
    });
  }
};

if (typeof window !== "undefined") {
  if (document.readyState === "complete") {
    initPlayerCounters();
  } else {
    window.addEventListener("load", initPlayerCounters);
  }
}

declare global {
  interface Window {
    PlayerCounter: typeof PlayerCounter;
  }
}

if (typeof window !== "undefined") {
  window.PlayerCounter = PlayerCounter;
}
