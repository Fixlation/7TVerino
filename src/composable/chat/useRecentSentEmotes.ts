import { computed, ref, watch } from "vue";
import { useConfig } from "@/composable/useSettings";

export const RECENT_EMOTE_BAR_LIMIT = 6;

export type RecentEmoteBarScope = "7tv" | "all";
export type RecentSentEmoteProvider = "7TV" | "PLATFORM" | "BTTV" | "FFZ";

export interface RecentSentEmoteEntry {
	id: string;
	name: string;
	provider: RecentSentEmoteProvider;
}

interface RecentSentEmoteHistorySnapshotChannel {
	channelID: string;
	updatedAt?: number;
	entries: RecentSentEmoteEntry[];
}

interface RecentSentEmoteHistorySnapshot {
	version: 1;
	channels: RecentSentEmoteHistorySnapshotChannel[];
}

interface RecentSentEmoteHistoryState {
	history: Map<string, RecentSentEmoteEntry[]>;
	timestamps: Map<string, number>;
}

const enabled = useConfig<boolean>("chat.recent_emote_bar", false);
const scope = useConfig<RecentEmoteBarScope>("chat.recent_emote_bar.scope", "7tv");
const legacyHistory = useConfig<Map<string, RecentSentEmoteEntry[]>>("chat.recent_emote_bar.history", new Map());
const history = ref<Map<string, RecentSentEmoteEntry[]>>(new Map());
const historyTimestamps = ref<Map<string, number>>(new Map());
const RECENT_EMOTE_HISTORY_SESSION_KEY = "seventv:recent-emote-bar:history";
const RECENT_EMOTE_HISTORY_STORAGE_KEY = "seventv:recent-emote-bar:history:persistent";

const SUPPORTED_PROVIDERS = new Set<RecentSentEmoteProvider>(["7TV", "PLATFORM", "BTTV", "FFZ"]);
const TOKEN_EDGE_PUNCTUATION = /^[`~!@#$%^&*()\-+=\[\]{}\\|;:'",.<>/?]+|[`~!@#$%^&*()\-+=\[\]{}\\|;:'",.<>/?]+$/g;

let initialized = false;
let storageListenerBound = false;
let legacyMigrationWatcherBound = false;

function emptyHistoryState(): RecentSentEmoteHistoryState {
	return {
		history: new Map<string, RecentSentEmoteEntry[]>(),
		timestamps: new Map<string, number>(),
	};
}

function isRecentSentEmoteProvider(provider: string): provider is RecentSentEmoteProvider {
	return SUPPORTED_PROVIDERS.has(provider as RecentSentEmoteProvider);
}

function normalizeEntry(entry: Partial<RecentSentEmoteEntry> | null | undefined): RecentSentEmoteEntry | null {
	if (!entry) return null;

	const id = entry.id?.trim();
	const name = entry.name?.trim();
	const provider = entry.provider?.trim();
	if (!id || !name || !provider || !isRecentSentEmoteProvider(provider)) return null;

	return {
		id,
		name,
		provider,
	};
}

function normalizeEntries(entries: RecentSentEmoteEntry[] | null | undefined): RecentSentEmoteEntry[] {
	const out = [] as RecentSentEmoteEntry[];
	const seen = new Set<string>();

	for (const entry of entries ?? []) {
		const normalized = normalizeEntry(entry);
		if (!normalized) continue;

		const key = `${normalized.provider}:${normalized.id}`;
		if (seen.has(key)) continue;

		seen.add(key);
		out.push(normalized);
		if (out.length >= RECENT_EMOTE_BAR_LIMIT) break;
	}

	return out;
}

function normalizeHistoryState(
	value: Iterable<[string, RecentSentEmoteEntry[]]> | null | undefined,
	timestamps?: Iterable<[string, number]> | null | undefined,
): RecentSentEmoteHistoryState {
	const out = emptyHistoryState();
	const timestampMap = new Map<string, number>(timestamps ?? []);

	for (const [channelID, entries] of value ?? []) {
		if (typeof channelID !== "string" || !channelID) continue;

		const normalized = normalizeEntries(entries);
		if (!normalized.length) continue;

		out.history.set(channelID, normalized);
		out.timestamps.set(channelID, timestampMap.get(channelID) ?? 0);
	}

	return out;
}

function normalizeSnapshot(value: unknown): RecentSentEmoteHistoryState {
	if (value instanceof Array) {
		return normalizeHistoryState(value as Iterable<[string, RecentSentEmoteEntry[]]>);
	}

	if (!value || typeof value !== "object") {
		return emptyHistoryState();
	}

	const channels = (value as Partial<RecentSentEmoteHistorySnapshot>).channels;
	if (!(channels instanceof Array)) {
		return emptyHistoryState();
	}

	const out = emptyHistoryState();

	for (const channel of channels) {
		if (!channel || typeof channel !== "object") continue;

		const channelID = (channel as Partial<RecentSentEmoteHistorySnapshotChannel>).channelID;
		if (typeof channelID !== "string" || !channelID) continue;

		const normalizedEntries = normalizeEntries((channel as RecentSentEmoteHistorySnapshotChannel).entries);
		if (!normalizedEntries.length) continue;

		const updatedAt = (channel as Partial<RecentSentEmoteHistorySnapshotChannel>).updatedAt;
		out.history.set(channelID, normalizedEntries);
		out.timestamps.set(channelID, typeof updatedAt === "number" && Number.isFinite(updatedAt) ? updatedAt : 0);
	}

	return out;
}

function buildSnapshot(state: RecentSentEmoteHistoryState): RecentSentEmoteHistorySnapshot {
	return {
		version: 1,
		channels: Array.from(state.history.entries()).map(([channelID, entries]) => ({
			channelID,
			updatedAt: state.timestamps.get(channelID) ?? 0,
			entries,
		})),
	};
}

function areEntriesEqual(a: RecentSentEmoteEntry[] | undefined, b: RecentSentEmoteEntry[] | undefined): boolean {
	if (!a || !b || a.length !== b.length) return false;

	for (let i = 0; i < a.length; i++) {
		if (a[i]?.id !== b[i]?.id || a[i]?.name !== b[i]?.name || a[i]?.provider !== b[i]?.provider) {
			return false;
		}
	}

	return true;
}

function isSameHistoryState(currentState: RecentSentEmoteHistoryState, nextState: RecentSentEmoteHistoryState): boolean {
	if (currentState.history.size !== nextState.history.size || currentState.timestamps.size !== nextState.timestamps.size) {
		return false;
	}

	for (const [channelID, entries] of currentState.history) {
		if (!areEntriesEqual(entries, nextState.history.get(channelID))) return false;
		if ((currentState.timestamps.get(channelID) ?? 0) !== (nextState.timestamps.get(channelID) ?? 0)) return false;
	}

	return true;
}

function currentHistoryState(): RecentSentEmoteHistoryState {
	return normalizeHistoryState(history.value.entries(), historyTimestamps.value.entries());
}

function applyHistoryState(nextState: RecentSentEmoteHistoryState): boolean {
	const normalized = normalizeHistoryState(nextState.history.entries(), nextState.timestamps.entries());
	if (isSameHistoryState(currentHistoryState(), normalized)) return false;

	history.value = normalized.history;
	historyTimestamps.value = normalized.timestamps;
	return true;
}

function mergeHistoryStates(...states: RecentSentEmoteHistoryState[]): RecentSentEmoteHistoryState {
	const merged = emptyHistoryState();

	for (const state of states) {
		for (const [channelID, entries] of state.history) {
			const normalizedEntries = normalizeEntries(entries);
			if (!normalizedEntries.length) continue;

			const nextTimestamp = state.timestamps.get(channelID) ?? 0;
			const currentTimestamp = merged.timestamps.get(channelID);
			const currentEntries = merged.history.get(channelID);
			const shouldReplace =
				currentTimestamp === undefined ||
				nextTimestamp > currentTimestamp ||
				(nextTimestamp === currentTimestamp && !areEntriesEqual(currentEntries, normalizedEntries));
			if (!shouldReplace) continue;

			merged.history.set(channelID, normalizedEntries);
			merged.timestamps.set(channelID, nextTimestamp);
		}
	}

	return normalizeHistoryState(merged.history.entries(), merged.timestamps.entries());
}

function readHistoryState(storage: Storage, key: string): RecentSentEmoteHistoryState {
	try {
		const rawHistory = storage.getItem(key);
		if (!rawHistory) return emptyHistoryState();

		return normalizeSnapshot(JSON.parse(rawHistory));
	} catch {
		storage.removeItem(key);
		return emptyHistoryState();
	}
}

function writeHistoryState(storage: Storage, key: string, state: RecentSentEmoteHistoryState): void {
	try {
		if (state.history.size === 0) {
			storage.removeItem(key);
			return;
		}

		storage.setItem(key, JSON.stringify(buildSnapshot(state)));
	} catch {
		// Ignore storage failures and keep the in-memory history active.
	}
}

function persistHistoryState(nextState = currentHistoryState()): void {
	if (typeof window === "undefined") return;

	writeHistoryState(window.sessionStorage, RECENT_EMOTE_HISTORY_SESSION_KEY, nextState);

	const mergedPersistentState = mergeHistoryStates(
		readHistoryState(window.localStorage, RECENT_EMOTE_HISTORY_STORAGE_KEY),
		nextState,
	);
	applyHistoryState(mergedPersistentState);
	writeHistoryState(window.localStorage, RECENT_EMOTE_HISTORY_STORAGE_KEY, mergedPersistentState);
}

function bindStorageListener(): void {
	if (storageListenerBound || typeof window === "undefined") return;

	window.addEventListener("storage", (ev: StorageEvent) => {
		if (ev.storageArea !== window.localStorage || ev.key !== RECENT_EMOTE_HISTORY_STORAGE_KEY) return;

		const mergedState = mergeHistoryStates(
			currentHistoryState(),
			readHistoryState(window.localStorage, RECENT_EMOTE_HISTORY_STORAGE_KEY),
		);
		applyHistoryState(mergedState);
		writeHistoryState(window.sessionStorage, RECENT_EMOTE_HISTORY_SESSION_KEY, mergedState);
	});

	storageListenerBound = true;
}

function bindLegacyMigrationWatcher(): void {
	if (legacyMigrationWatcherBound) return;

	watch(
		legacyHistory,
		(nextHistory) => {
			const legacyState = normalizeHistoryState(nextHistory.entries());
			if (!legacyState.history.size) return;

			const mergedState = mergeHistoryStates(legacyState, currentHistoryState());
			if (!applyHistoryState(mergedState)) return;
			persistHistoryState(mergedState);
		},
		{ immediate: true },
	);

	legacyMigrationWatcherBound = true;
}

function ensureInitialized(): void {
	if (initialized || typeof window === "undefined") return;

	const mergedState = mergeHistoryStates(
		readHistoryState(window.localStorage, RECENT_EMOTE_HISTORY_STORAGE_KEY),
		readHistoryState(window.sessionStorage, RECENT_EMOTE_HISTORY_SESSION_KEY),
	);

	applyHistoryState(mergedState);
	persistHistoryState(mergedState);
	bindStorageListener();
	bindLegacyMigrationWatcher();
	initialized = true;
}

function getEntries(channelID: string): RecentSentEmoteEntry[] {
	if (!channelID) return [];

	ensureInitialized();
	return normalizeEntries(history.value.get(channelID));
}

function scopeAllows(provider: RecentSentEmoteProvider, value = scope.value): boolean {
	switch (value) {
		case "7tv":
			return provider === "7TV";
		case "all":
			return SUPPORTED_PROVIDERS.has(provider);
		default:
			return false;
	}
}

function resolveEmoteToken(token: string, activeEmotes: Record<string, SevenTV.ActiveEmote>): SevenTV.ActiveEmote | null {
	if (!token) return null;

	const directMatch = activeEmotes[token];
	if (directMatch) return directMatch;

	const trimmedToken = token.replace(TOKEN_EDGE_PUNCTUATION, "");
	if (!trimmedToken || trimmedToken === token) return null;

	return activeEmotes[trimmedToken] ?? null;
}

function recordMessage(channelID: string, message: string, activeEmotes: Record<string, SevenTV.ActiveEmote>): void {
	ensureInitialized();
	if (!enabled.value || !channelID) return;

	const tokens = message.trim().split(/\s+/).filter(Boolean);
	if (!tokens.length) return;

	const nextEntries = getEntries(channelID);

	for (const token of tokens) {
		const emote = resolveEmoteToken(token, activeEmotes);
		const provider = emote?.provider;
		if (!emote || !provider || !isRecentSentEmoteProvider(provider)) continue;

		const entry = {
			id: emote.id,
			name: emote.name,
			provider,
		} satisfies RecentSentEmoteEntry;
		const existingIndex = nextEntries.findIndex((item) => item.id === entry.id && item.provider === entry.provider);
		if (existingIndex >= 0) {
			nextEntries.splice(existingIndex, 1);
		}

		nextEntries.unshift(entry);
	}

	const normalizedEntries = normalizeEntries(nextEntries);
	const previousEntries = getEntries(channelID);
	if (areEntriesEqual(normalizedEntries, previousEntries)) {
		return;
	}

	const nextHistory = new Map(history.value);
	const nextTimestamps = new Map(historyTimestamps.value);
	if (normalizedEntries.length) {
		nextHistory.set(channelID, normalizedEntries);
		nextTimestamps.set(channelID, Date.now());
	} else {
		nextHistory.delete(channelID);
		nextTimestamps.delete(channelID);
	}

	const nextState = normalizeHistoryState(nextHistory.entries(), nextTimestamps.entries());
	applyHistoryState(nextState);
	persistHistoryState(nextState);
}

export function useRecentSentEmotes() {
	ensureInitialized();

	return {
		enabled,
		scope,
		history,
		entries: computed(() => history.value),
		getEntries,
		scopeAllows,
		recordMessage,
	};
}
