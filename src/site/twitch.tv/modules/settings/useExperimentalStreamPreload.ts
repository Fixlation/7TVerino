import { onUnmounted, watch } from "vue";
import { log } from "@/common/Logger";
import { useChatPerformance } from "@/composable/chat/useChatPerformance";
import { useApollo } from "@/composable/useApollo";
import { twitchPlaybackAccessTokenQuery } from "@/assets/gql/tw.playback-access-token.gql";

const SHOULD_LOG_DEBUG = import.meta.env.MODE !== "production";

const HOVER_DWELL_MS = 220;
const CHANNEL_TTL_MS = 180000;
const MAX_CONCURRENT = 2;
const MAX_PRELOADS_PER_MIN = 12;
const SEGMENT_ABORT_MS = 1200;

const RATE_WINDOW_MS = 60000;
const TWITCH_PLAYER_TYPE = "site";
const TWITCH_WEB_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const CHANNEL_LOGIN_REGEXP = /^[a-z0-9_]{1,25}$/;
const RESERVED_ROUTES = new Set([
	"directory",
	"p",
	"settings",
	"search",
	"subscriptions",
	"downloads",
	"login",
	"signup",
	"wallet",
	"drops",
	"turbo",
	"prime",
	"friends",
	"messages",
	"inventory",
	"jobs",
	"store",
	"u",
	"embed",
	"popout",
	"clips",
]);

interface PlaybackToken {
	signature: string;
	value: string;
}

function extractChannelLoginFromAnchor(anchor: HTMLAnchorElement): string | null {
	let url: URL;
	try {
		url = new URL(anchor.href, location.href);
	} catch {
		return null;
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") return null;

	const host = url.hostname.toLowerCase();
	if (host !== "twitch.tv" && !host.endsWith(".twitch.tv")) return null;

	const segments = url.pathname
		.split("/")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (segments.length !== 1) return null;

	const [login] = segments;
	if (!login || RESERVED_ROUTES.has(login)) return null;
	if (!CHANNEL_LOGIN_REGEXP.test(login)) return null;

	return login;
}

function buildMasterPlaylistURL(channelLogin: string, token: PlaybackToken): string {
	const url = new URL(`https://usher.ttvnw.net/api/channel/hls/${channelLogin}.m3u8`);

	url.searchParams.set("allow_audio_only", "true");
	url.searchParams.set("allow_source", "true");
	url.searchParams.set("fast_bread", "true");
	url.searchParams.set("playlist_include_framerate", "true");
	url.searchParams.set("player_backend", "mediaplayer");
	url.searchParams.set("player_version", "1.0.0");
	url.searchParams.set("reassignments_supported", "true");
	url.searchParams.set("supported_codecs", "av1,h265,h264");
	url.searchParams.set("cdm", "wv");
	url.searchParams.set("p", `${Math.floor(Math.random() * 1_000_000)}`);
	url.searchParams.set("client_id", TWITCH_WEB_CLIENT_ID);
	url.searchParams.set("sig", token.signature);
	url.searchParams.set("token", token.value);

	return url.toString();
}

function getFirstPlaylistURI(playlistText: string, baseURL: string): string | null {
	const lines = playlistText
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		if (line.startsWith("#")) continue;

		try {
			return new URL(line, baseURL).toString();
		} catch {
			return null;
		}
	}

	return null;
}

async function fetchPlaylistText(url: string): Promise<string | null> {
	const resp = await fetch(url, {
		method: "GET",
		credentials: "omit",
	});

	if (!resp.ok) return null;
	return resp.text().catch(() => null);
}

async function warmSegment(url: string): Promise<void> {
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), SEGMENT_ABORT_MS);

	try {
		await fetch(url, {
			method: "GET",
			credentials: "omit",
			signal: controller.signal,
		});
	} catch {
		/* noop */
	} finally {
		clearTimeout(timer);
	}
}

export function useExperimentalStreamPreload(): void {
	const apollo = useApollo();
	const performance = useChatPerformance();
	const enabled = performance.prewarmEnabled;

	const pendingTimers = new Map<string, number>();
	const lastPreloadAt = new Map<string, number>();
	const rateWindow = [] as number[];
	const queue = [] as string[];
	const queued = new Set<string>();
	const inFlight = new Set<string>();

	let activeCount = 0;
	let listenersAttached = false;

	function pruneRateWindow(now = Date.now()): void {
		while (rateWindow.length > 0 && now - rateWindow[0] > RATE_WINDOW_MS) {
			rateWindow.shift();
		}
	}

	function consumeRateBudget(): boolean {
		pruneRateWindow();
		if (rateWindow.length >= MAX_PRELOADS_PER_MIN) return false;

		rateWindow.push(Date.now());
		return true;
	}

	function isWithinTTL(channelLogin: string): boolean {
		const last = lastPreloadAt.get(channelLogin);
		if (!last) return false;

		return Date.now() - last < CHANNEL_TTL_MS;
	}

	function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
		if (!(target instanceof Element)) return null;

		const anchor = target.closest("a[href]");
		return anchor instanceof HTMLAnchorElement ? anchor : null;
	}

	function clearPendingTimers(): void {
		for (const timer of pendingTimers.values()) {
			clearTimeout(timer);
		}
		pendingTimers.clear();
	}

	function clearQueue(): void {
		queue.length = 0;
		queued.clear();
	}

	function disableRuntime(): void {
		if (listenersAttached) {
			document.removeEventListener("mouseover", onMouseOver, true);
			document.removeEventListener("focusin", onFocusIn, true);
			listenersAttached = false;
		}

		clearPendingTimers();
		clearQueue();
	}

	function enableRuntime(): void {
		if (listenersAttached) return;

		document.addEventListener("mouseover", onMouseOver, true);
		document.addEventListener("focusin", onFocusIn, true);
		listenersAttached = true;
	}

	function schedulePreload(channelLogin: string): void {
		if (pendingTimers.has(channelLogin)) return;
		if (isWithinTTL(channelLogin)) return;

		const timer = window.setTimeout(() => {
			pendingTimers.delete(channelLogin);

			if (!enabled.value) return;
			if (isWithinTTL(channelLogin)) return;

			enqueue(channelLogin);
		}, HOVER_DWELL_MS);

		pendingTimers.set(channelLogin, timer);
	}

	function onMouseOver(ev: MouseEvent): void {
		if (!enabled.value) return;

		const anchor = findAnchor(ev.target);
		if (!anchor) return;

		if (ev.relatedTarget instanceof Node && anchor.contains(ev.relatedTarget)) return;

		const channelLogin = extractChannelLoginFromAnchor(anchor);
		if (!channelLogin) return;

		schedulePreload(channelLogin);
	}

	function onFocusIn(ev: FocusEvent): void {
		if (!enabled.value) return;

		const anchor = findAnchor(ev.target);
		if (!anchor) return;

		const channelLogin = extractChannelLoginFromAnchor(anchor);
		if (!channelLogin) return;

		schedulePreload(channelLogin);
	}

	function enqueue(channelLogin: string): void {
		if (queued.has(channelLogin) || inFlight.has(channelLogin)) return;

		queued.add(channelLogin);
		queue.push(channelLogin);
		drainQueue();
	}

	function drainQueue(): void {
		if (!enabled.value) return;

		while (activeCount < MAX_CONCURRENT && queue.length > 0) {
			const channelLogin = queue.shift();
			if (!channelLogin) return;

			queued.delete(channelLogin);

			if (inFlight.has(channelLogin) || isWithinTTL(channelLogin)) continue;
			if (!consumeRateBudget()) {
				if (SHOULD_LOG_DEBUG) {
					log.debug("<PerformanceMode>", `Skipping preload for ${channelLogin}: rate limit reached`);
				}
				continue;
			}

			inFlight.add(channelLogin);
			activeCount += 1;
			lastPreloadAt.set(channelLogin, Date.now());

			void warmChannel(channelLogin)
				.catch((err) => {
					if (SHOULD_LOG_DEBUG) {
						log.debug("<PerformanceMode>", `Preload failed for ${channelLogin}: ${String(err)}`);
					}
				})
				.finally(() => {
					inFlight.delete(channelLogin);
					activeCount -= 1;
					drainQueue();
				});
		}
	}

	async function fetchPlaybackToken(channelLogin: string): Promise<PlaybackToken | null> {
		const client = apollo.value;
		if (!client) return null;

		const resp = await client.query<
			twitchPlaybackAccessTokenQuery.Response,
			twitchPlaybackAccessTokenQuery.Variables
		>({
			query: twitchPlaybackAccessTokenQuery,
			variables: {
				login: channelLogin,
				playerType: TWITCH_PLAYER_TYPE,
			},
			fetchPolicy: "network-only",
		});

		const token = resp.data?.streamPlaybackAccessToken;
		if (!token?.signature || !token.value) return null;

		return token;
	}

	async function warmChannel(channelLogin: string): Promise<void> {
		const token = await fetchPlaybackToken(channelLogin);
		if (!token) return;

		const masterPlaylistURL = buildMasterPlaylistURL(channelLogin, token);
		const masterPlaylist = await fetchPlaylistText(masterPlaylistURL);
		if (!masterPlaylist) return;

		const variantPlaylistURL = getFirstPlaylistURI(masterPlaylist, masterPlaylistURL);
		if (!variantPlaylistURL) return;

		const variantPlaylist = await fetchPlaylistText(variantPlaylistURL);
		if (!variantPlaylist) return;

		const segmentURL = getFirstPlaylistURI(variantPlaylist, variantPlaylistURL);
		if (!segmentURL) return;

		await warmSegment(segmentURL);
	}

	watch(
		enabled,
		(v) => {
			if (v) {
				enableRuntime();
				return;
			}

			disableRuntime();
		},
		{ immediate: true },
	);

	onUnmounted(() => {
		disableRuntime();
	});
}
