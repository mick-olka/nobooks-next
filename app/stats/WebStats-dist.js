/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/*!
	WebStats version 1.7
	https://github.com/Dantevg/WebStats
	
	by RedPolygon
	
	Licence: MIT
*/
class t {
	constructor({ all: t, scores: e, online: s, tables: a }) {
		(this.getStats = async () => {
			if (this.all) return await (await fetch(this.all)).json();
			{
				const [t, e] = await Promise.all([
					this.getOnline(),
					this.getScoreboard(),
				]);
				return { online: t, scoreboard: e };
			}
		}),
			(this.getScoreboard = () =>
				fetch(this.scores)
					.then((t) => t.json())
					.catch(() => {})),
			(this.getOnline = () =>
				fetch(this.online)
					.then((t) => t.json())
					.catch(() => {})),
			(this.getTables = () =>
				fetch(this.tables)
					.then((t) => t.json())
					.catch(() => {})),
			(this.all = t),
			(this.scores = e),
			(this.online = s),
			(this.tables = a);
	}
	static json(e) {
		return new t({
			all: `http://${e}/stats.json`,
			scores: `http://${e}/scoreboard.json`,
			online: `http://${e}/online.json`,
			tables: `http://${e}/tables.json`,
		});
	}
}
class e {
	constructor(t) {
		(this.isOnline = (t) => !0 === this.players[t]),
			(this.isAFK = (t) => "afk" === this.players[t]),
			(this.isOffline = (t) => !!this.players[t]),
			(this.getStatus = (t) =>
				this.isOnline(t) ? "online" : this.isAFK(t) ? "AFK" : "offline"),
			(this.isCurrentPlayer = (t) => this.playernames?.includes(t) ?? !1),
			(this.isNonemptyEntry = (t) =>
				Object.entries(this.scoreboard.scores).filter(
					([e, s]) => s[t] && "0" != s[t],
				).length > 0),
			this.setStats(t);
	}
	get entries() {
		return this.scoreboard.entries;
	}
	get online() {
		return this.players;
	}
	get nOnline() {
		return Object.keys(this.players).length;
	}
	setScoreboard(t) {
		(this.scoreboard = t),
			(this.columns = Object.keys(t.scores).sort()),
			this.filter(),
			(this.scores = []);
		for (const t of this.entries) {
			const e = [];
			e.push(this.scores.push(e) - 1), e.push(t);
			for (const s of this.columns) e.push(this.scoreboard.scores[s]?.[t] ?? 0);
		}
		(this.columns_ = { Player: 1 }),
			this.columns.forEach((t, e) => (this.columns_[t] = e + 2));
	}
	setOnlineStatus(t) {
		this.players = t;
	}
	setPlayernames(t) {
		this.playernames = t;
	}
	setStats(t) {
		this.setScoreboard(t.scoreboard),
			this.setOnlineStatus(t.online),
			this.setPlayernames(t.playernames);
	}
	filter() {
		(this.scoreboard.entries = this.scoreboard.entries
			.filter(e.isPlayerOrServer)
			.filter(this.isNonemptyEntry.bind(this))
			.sort(Intl.Collator().compare)),
			(this.scoreboard.scores = e.filter(
				this.scoreboard.scores,
				e.isNonemptyObjective,
			));
	}
	sort(t, e) {
		const s = new Intl.Collator(void 0, { sensitivity: "base" });
		this.scores = this.scores.sort((a, n) => {
			const i = a[this.columns_[t]],
				o = n[this.columns_[t]];
			return isNaN(Number(i)) || isNaN(Number(o))
				? (e ? -1 : 1) * s.compare(i, o)
				: (e ? -1 : 1) * (i - o);
		});
	}
}
(e.isPlayerOrServer = (t) =>
	"#server" == t || (t.match(/^\w{3,16}$/) && !t.match(/^\d*$/))),
	(e.isNonemptyObjective = (t) =>
		Object.keys(t).filter(e.isPlayerOrServer).length > 0),
	(e.filter = (t, e) =>
		Object.fromEntries(Object.entries(t).filter(([t, s]) => e(s)))),
	(e.map = (t, e) =>
		Object.fromEntries(Object.entries(t).map(([t, s]) => [t, e(t, s)])));
class s {
	static convertFormattingCode(t) {
		if (!t.format && !t.colour) return t.text;
		const e = document.createElement("span");
		return (
			(e.innerText = t.text),
			e.classList.add("mc-format"),
			t.format && e.classList.add("mc-" + t.format),
			t.colour &&
				("simple" == t.colourType && e.classList.add("mc-" + t.colour),
				"hex" == t.colourType && (e.style.color = t.colour)),
			e
		);
	}
	static parseFormattingCodes(t) {
		const e = [],
			a = t.matchAll(s.FORMATTING_CODE_REGEX).next().value?.index;
		(null == a || a > 0) && e.push({ text: t.substring(0, a) });
		for (const a of t.matchAll(s.FORMATTING_CODE_REGEX))
			e.push(s.parseFormattingCode(a[1], a[2], e[e.length - 1]));
		return e;
	}
	static parseFormattingCode(t, e, a) {
		if (s.COLOUR_CODES[t])
			return { text: e, colour: s.COLOUR_CODES[t], colourType: "simple" };
		if (s.FORMATTING_CODES[t])
			return {
				text: e,
				format: s.FORMATTING_CODES[t],
				colour: a?.colour,
				colourType: a?.colourType,
			};
		const n = t.match(/§x§(.)§(.)§(.)§(.)§(.)§(.)/m);
		return n
			? { text: e, colour: "#" + n.slice(1).join(""), colourType: "hex" }
			: { text: e };
	}
}
(s.COLOUR_CODES = {
	"§0": "black",
	"§1": "dark_blue",
	"§2": "dark_green",
	"§3": "dark_aqua",
	"§4": "dark_red",
	"§5": "dark_purple",
	"§6": "gold",
	"§7": "gray",
	"§8": "dark_gray",
	"§9": "blue",
	"§a": "green",
	"§b": "aqua",
	"§c": "red",
	"§d": "light_purple",
	"§e": "yellow",
	"§f": "white",
}),
	(s.FORMATTING_CODES = {
		"§k": "obfuscated",
		"§l": "bold",
		"§m": "strikethrough",
		"§n": "underline",
		"§o": "italic",
		"§r": "reset",
	}),
	(s.FORMATTING_CODE_REGEX = /(§x§.§.§.§.§.§.|§.)([^§]*)/gm),
	(s.convertFormattingCodes = (t) =>
		s.parseFormattingCodes(t).map(s.convertFormattingCode));
class a {
	constructor(
		{ table: t, pagination: e, showSkins: s = !0 },
		{ columns: a, sortColumn: n = "Player", sortDirection: i = "descending" },
	) {
		(this.table = t),
			(this.pagination = e),
			(this.columns = a),
			(this.sortColumn = n),
			(this.descending = "descending" == i),
			(this.showSkins = s),
			(this.hideOffline = !1),
			this.pagination &&
				(this.pagination.onPageChange = (t) => {
					this.updatePagination(), this.show();
				});
	}
	init(t) {
		(this.data = t),
			this.pagination && this.updatePagination(),
			(this.headerElem = document.createElement("tr")),
			this.table.append(this.headerElem),
			a.appendTh(
				this.headerElem,
				"Player",
				this.thClick.bind(this),
				this.showSkins ? 2 : void 0,
			);
		for (const t of this.columns ?? this.data.columns)
			a.appendTh(this.headerElem, t, this.thClick.bind(this));
		this.rows = new Map();
		for (const t of this.getEntries()) this.appendEntry(t);
		this.updateStatsAndShow();
	}
	getEntries() {
		const t = this.data.entries.filter((t) =>
			(this.columns ?? this.data.columns).some(
				(e) =>
					this.data.scoreboard.scores[e]?.[t] &&
					"0" != this.data.scoreboard.scores[e][t],
			),
		);
		return this.hideOffline ? t.filter((t) => this.data.isOnline(t)) : t;
	}
	getScores() {
		const t = this.data.scores.filter((t) => this.rows.has(t[1]));
		return this.hideOffline ? t.filter((t) => this.data.isOnline(t[1])) : t;
	}
	updatePagination() {
		this.pagination.update(this.getEntries().length);
	}
	appendEntry(t) {
		let e = document.createElement("tr");
		if ((e.setAttribute("entry", a.quoteEscape(t)), this.showSkins)) {
			let s = a.appendElement(e, "td");
			a.appendImg(s, ""),
				s.classList.add("sticky", "skin"),
				s.setAttribute("title", t);
		}
		let s = a.appendTextElement(e, "td", "#server" == t ? "Server" : t);
		s.setAttribute("objective", "Player"),
			s.setAttribute("value", t),
			a.prependElement(s, "div").classList.add("status"),
			this.data.isCurrentPlayer(t) && e.classList.add("current-player");
		for (const t of this.columns ?? this.data.columns) {
			let s = a.appendElement(e, "td");
			s.classList.add("empty"), s.setAttribute("objective", a.quoteEscape(t));
		}
		this.rows.set(t, e);
	}
	setSkin(t, e) {
		const s = e.getElementsByTagName("img")[0];
		s &&
			(s.src =
				"#server" == t
					? a.CONSOLE_IMAGE
					: `https://www.mc-heads.net/avatar/${t}.png`);
	}
	updateScoreboard() {
		for (const t of this.data.scores)
			for (const e of this.columns ?? this.data.columns) {
				let a = t[this.data.columns_[e]];
				if (!a) continue;
				const n = this.rows.get(t[1]).querySelector(`td[objective='${e}']`);
				n.classList.remove("empty"),
					n.setAttribute("value", a),
					(a = isNaN(a) ? a : Number(a).toLocaleString()),
					(n.innerHTML = ""),
					n.append(...s.convertFormattingCodes(a));
			}
	}
	updateScoreboardAndShow() {
		this.updateScoreboard(), this.show();
	}
	updateOnlineStatus() {
		for (const [t, e] of this.rows) {
			const t = e.querySelector("td .status");
			if (!t) continue;
			const s = e.getAttribute("entry");
			e.classList.remove("online", "afk", "offline"),
				t.classList.remove("online", "afk", "offline");
			const a = this.data.getStatus(s);
			e.classList.add(a.toLowerCase()),
				t.classList.add(a.toLowerCase()),
				t.setAttribute("title", this.data.getStatus(s));
		}
	}
	updateOnlineStatusAndShow() {
		this.updateOnlineStatus(),
			this.pagination && this.hideOffline && this.show();
	}
	updateStats() {
		this.updateScoreboard(), this.updateOnlineStatus();
	}
	updateStatsAndShow() {
		this.updateScoreboard(), this.updateOnlineStatus(), this.show();
	}
	changeHideOffline(t) {
		(this.hideOffline = t),
			this.pagination && (this.pagination.changePage(1), this.show());
	}
	show() {
		(this.table.innerHTML = ""), this.table.append(this.headerElem);
		const t = this.getScores(),
			[e, s] = this.pagination
				? this.pagination.getRange(t.length)
				: [0, t.length];
		for (let a = e; a < s; a++)
			this.showSkins && this.setSkin(t[a][1], this.rows.get(t[a][1])),
				this.table.append(this.rows.get(t[a][1]));
	}
	sort(t = this.sortColumn, e = this.descending) {
		this.data.sort(t, e), this.show();
	}
	thClick(t) {
		let e = t.target.innerText;
		(this.descending = e !== this.sortColumn || !this.descending),
			(this.sortColumn = e),
			this.pagination && this.pagination.changePage(1),
			this.sort();
	}
	static appendElement(t, e) {
		let s = document.createElement(e);
		return t.append(s), s;
	}
	static prependElement(t, e) {
		let s = document.createElement(e);
		return document.createElement, t.prepend(s), s;
	}
	static appendTextElement(t, e, s) {
		let n = a.appendElement(t, e);
		return (n.innerText = s), n;
	}
	static appendTh(t, e, s, n) {
		let i = a.appendTextElement(t, "th", e);
		return (
			(i.onclick = s), null != n && i.setAttribute("colspan", String(n)), i
		);
	}
	static appendImg(t, e) {
		let s = a.appendElement(t, "img");
		return (s.src = e), s;
	}
}
(a.CONSOLE_IMAGE =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPElEQVQ4T2NUUlL6z0ABYBw1gGE0DBioHAZ3795lUFZWJildosQCRQaQoxnkVLgL0A2A8dFpdP8NfEICAMkiK2HeQ9JUAAAAAElFTkSuQmCC"),
	(a.quoteEscape = (t) => t.replace(/'/g, "&quot;"));
class n {
	constructor(t, e) {
		(this.displayCount = t),
			(this.currentPage = 1),
			(this.parentElem = e),
			(this.selectElem = e.querySelector(
				"select.webstats-pagination[name=page]",
			)),
			(this.prevButton = e.querySelector(
				"button.webstats-pagination[name=prev]",
			)),
			(this.nextButton = e.querySelector(
				"button.webstats-pagination[name=next]",
			)),
			this.selectElem.addEventListener("change", (t) =>
				this.changePageAndCallback(Number(t.target.value)),
			),
			this.prevButton.addEventListener("click", () =>
				this.changePageAndCallback(this.currentPage - 1),
			),
			this.nextButton.addEventListener("click", () =>
				this.changePageAndCallback(this.currentPage + 1),
			);
	}
	static create(t, e) {
		const s = e.appendChild(document.createElement("button"));
		s.classList.add("webstats-pagination"),
			(s.name = "prev"),
			(s.innerText = "Prev");
		const a = e.appendChild(document.createElement("select"));
		a.classList.add("webstats-pagination"), (a.name = "page");
		const i = e.appendChild(document.createElement("button"));
		return (
			i.classList.add("webstats-pagination"),
			(i.name = "next"),
			(i.innerText = "Next"),
			new n(t, e)
		);
	}
	update(t) {
		if (
			((this.maxPage = Math.ceil(t / this.displayCount)),
			1 == this.maxPage
				? this.parentElem.classList.add("pagination-hidden")
				: this.parentElem.classList.remove("pagination-hidden"),
			this.selectElem)
		) {
			this.selectElem.innerHTML = "";
			for (let t = 1; t <= this.maxPage; t++) {
				const e = document.createElement("option");
				(e.innerText = String(t)), this.selectElem.append(e);
			}
			this.selectElem.value = String(this.currentPage);
		}
		this.prevButton &&
			this.prevButton.toggleAttribute("disabled", this.currentPage <= 1),
			this.nextButton &&
				this.nextButton.toggleAttribute(
					"disabled",
					this.currentPage >= this.maxPage,
				);
	}
	changePage(t) {
		(t = Math.max(1, Math.min(t, this.maxPage))), (this.currentPage = t);
	}
	changePageAndCallback(t) {
		this.changePage(t),
			console.log("callback"),
			this.onPageChange && this.onPageChange(this.currentPage);
	}
	getRange(t) {
		return [
			(this.currentPage - 1) * this.displayCount,
			this.displayCount > 0
				? Math.min(this.currentPage * this.displayCount, t)
				: t,
		];
	}
}
class i {
	constructor(e) {
		(this.displays = []),
			(this.connection = e.connection ?? t.json(e.host)),
			(this.updateInterval = e.updateInterval ?? 1e4);
		const s = document.querySelector(".webstats-status");
		(this.loadingElem = s?.querySelector(".webstats-loading-indicator")),
			(this.errorElem = s?.querySelector(".webstats-error-message")),
			this.setLoadingStatus(!0);
		const a = this.connection
				.getStats()
				.catch(this.catchError(i.CONNECTION_ERROR_MSG, e)),
			n = this.connection
				.getTables()
				.catch(this.catchError(i.CONNECTION_ERROR_MSG, e));
		Promise.all([a, n])
			.then(([t, s]) => this.init(t, s, e))
			.catch(this.catchError(void 0, e));
		(document.cookie.split("; ") ?? [])
			.filter((t) => t.length > 0)
			.forEach((t) => {
				const [e, s] = t.match(/[^=]+/g);
				document.documentElement.classList.toggle(e, "true" == s);
				a && (a.checked = "true" == s);
			}),
			document.querySelectorAll("input.webstats-option").forEach((t) =>
				t.addEventListener("change", () => {
					document.documentElement.classList.toggle(t.id, t.checked),
						(document.cookie = `${t.id}=${t.checked}; max-age=315360000; SameSite=Lax`);
				}),
			);
		const o = document.querySelector("input.webstats-option#hide-offline");
		o &&
			(o.addEventListener("change", (t) => {
				this.displays.forEach((t) => t.changeHideOffline(o.checked));
			}),
			this.displays.forEach((t) => t.changeHideOffline(o.checked))),
			(window.webstats = this);
	}
	init(t, s, a) {
		if (a.tables)
			for (const e in a.tables) {
				const n = s
					? s.find((t) => (t.name ?? "") == e)
					: { colums: t.scoreboard.columns };
				n && this.addTableManual(a, n);
			}
		else if (s) for (const t of s) this.addTableAutomatic(a, t);
		else this.addTableAutomatic(a, { colums: t.scoreboard.columns });
		(this.data = new e(t)),
			this.displays.forEach((t) => {
				t.init(this.data), t.sort();
			}),
			this.updateInterval > 0 && this.startUpdateInterval(!0),
			document.addEventListener("visibilitychange", () =>
				document.hidden
					? this.stopUpdateInterval()
					: this.startUpdateInterval(),
			),
			this.setLoadingStatus(!1);
	}
	update() {
		this.data.nOnline > 0
			? this.connection
					.getStats()
					.then((t) => {
						this.data.setStats(t),
							this.displays.forEach((t) => t.updateStatsAndShow());
					})
					.catch(this.catchError(i.CONNECTION_ERROR_MSG))
			: this.connection
					.getOnline()
					.then((t) => {
						this.data.setOnlineStatus(t),
							this.displays.forEach((t) => t.updateOnlineStatusAndShow());
					})
					.catch(this.catchError(i.CONNECTION_ERROR_MSG));
	}
	startUpdateInterval(t) {
		(this.interval = setInterval(this.update.bind(this), this.updateInterval)),
			t || this.update();
	}
	stopUpdateInterval() {
		clearInterval(this.interval);
	}
	addTableManual(t, e) {
		let s;
		if (t.displayCount > 0 && t.tables[e.name ?? ""].pagination) {
			const a = t.tables[e.name ?? ""].pagination;
			s = new n(t.displayCount, a);
		}
		this.displays.push(
			new a({ ...t, table: t.tables[e.name ?? ""].table, pagination: s }, e),
		);
	}
	addTableAutomatic(t, e) {
		const s = t.tableParent.appendChild(document.createElement("div"));
		let i;
		if (
			(s.classList.add("webstats-tableheading"),
			e.name &&
				((s.innerText = e.name), s.setAttribute("webstats-table", e.name)),
			t.displayCount > 0)
		) {
			const e = s.appendChild(document.createElement("span"));
			e.classList.add("webstats-pagination"), (i = n.create(t.displayCount, e));
		}
		const o = t.tableParent.appendChild(document.createElement("table"));
		e.name && o.setAttribute("webstats-table", e.name),
			this.displays.push(new a({ ...t, table: o, pagination: i }, e));
	}
	setLoadingStatus(t) {
		this.loadingElem &&
			(this.loadingElem.style.display = t ? "inline" : "none");
	}
	setErrorMessage(t, e) {
		if (this.errorElem) this.errorElem.innerText = t;
		else {
			const s = document.createElement("span");
			if (
				((s.innerText = t),
				s.classList.add("webstats-error-message"),
				e?.tableParent)
			)
				e.tableParent.appendChild(s);
			else if (e?.tables)
				for (const t in e.tables)
					e.tables[t].table && e.tables[t].table.appendChild(s);
		}
	}
	catchError(t, e) {
		const s = this;
		return (a) => {
			console.error(a),
				t && console.warn(t),
				s.setErrorMessage(t ?? a, e),
				s.setLoadingStatus(!1),
				s.stopUpdateInterval();
		};
	}
}
i.CONNECTION_ERROR_MSG =
	"No connection to server. Either the server is offline, or the 'host' setting in index.html is incorrect.";
export { i as default };
//# sourceMappingURL=WebStats-dist.js.map
