import { onUnmounted } from "vue";
import { db } from "@/db/idb";
import { useWorker, type WorkletEvent } from "@/composable/useWorker";

const resolvedUserPersonalEmoteSets = new Set<string>();
const pendingUserPersonalEmoteSets = new Map<string, number>();
const personalEntitlementResolvedCallbacks = new Set<(userID: string) => void>();
const INITIAL_PERSONAL_EMOTE_REQUEST_BATCH_MS = 120;
const PERSONAL_EMOTE_REQUEST_RETRY_MS = 900;
const PERSONAL_EMOTE_REQUEST_BATCH_SIZE = 8;
const MAX_PERSONAL_EMOTE_REQUEST_ATTEMPTS = 40;
let personalEmoteRequestTimeout: number | null = null;
let boundWorkerTarget: ReturnType<typeof useWorker>["target"] | null = null;
let sendWorkerMessageRef: ReturnType<typeof useWorker>["sendMessage"] | null = null;

function notifyResolved(userID: string): void {
	for (const callback of personalEntitlementResolvedCallbacks) {
		callback(userID);
	}
}

function scheduleAuthorCosmeticsFlush(delay = INITIAL_PERSONAL_EMOTE_REQUEST_BATCH_MS): void {
	if (!sendWorkerMessageRef || personalEmoteRequestTimeout || !pendingUserPersonalEmoteSets.size) return;

	personalEmoteRequestTimeout = window.setTimeout(() => {
		personalEmoteRequestTimeout = null;
		flushAuthorCosmeticsRequests();
	}, delay);
}

function flushAuthorCosmeticsRequests(): void {
	if (!sendWorkerMessageRef) return;

	const identifiers = [] as Array<["id", string]>;

	for (const [userID, attempts] of pendingUserPersonalEmoteSets.entries()) {
		if (resolvedUserPersonalEmoteSets.has(userID)) {
			pendingUserPersonalEmoteSets.delete(userID);
			continue;
		}
		if (attempts >= MAX_PERSONAL_EMOTE_REQUEST_ATTEMPTS) {
			pendingUserPersonalEmoteSets.delete(userID);
			continue;
		}
		if (identifiers.length >= PERSONAL_EMOTE_REQUEST_BATCH_SIZE) {
			break;
		}

		identifiers.push(["id", userID]);
		pendingUserPersonalEmoteSets.set(userID, attempts + 1);
	}

	if (identifiers.length) {
		sendWorkerMessageRef("REQUEST_USER_COSMETICS", {
			identifiers,
			kinds: ["EMOTE_SET"],
		});
	}

	if (pendingUserPersonalEmoteSets.size) {
		scheduleAuthorCosmeticsFlush(PERSONAL_EMOTE_REQUEST_RETRY_MS);
	}
}

function markResolved(userID: string): void {
	if (resolvedUserPersonalEmoteSets.has(userID)) return;

	resolvedUserPersonalEmoteSets.add(userID);
	pendingUserPersonalEmoteSets.delete(userID);
	notifyResolved(userID);
}

function onEntitlementCreated(ev: WorkletEvent<"entitlement_created">): void {
	if (ev.detail.kind !== "EMOTE_SET") return;

	const userID = ev.detail.platform_id?.trim();
	if (!userID || resolvedUserPersonalEmoteSets.has(userID)) return;

	void db.emoteSets
		.where("id")
		.equals(ev.detail.ref_id)
		.first()
		.then((set) => {
			if (!set) return;
			if (set.scope !== "PERSONAL" && !set.emotes.some((emote) => emote.data?.state?.includes("PERSONAL"))) {
				return;
			}

			markResolved(userID);
		});
}

function onEntitlementDeleted(ev: WorkletEvent<"entitlement_deleted">): void {
	if (ev.detail.kind !== "EMOTE_SET") return;

	const userID = ev.detail.platform_id?.trim();
	if (!userID) return;

	resolvedUserPersonalEmoteSets.delete(userID);
	pendingUserPersonalEmoteSets.delete(userID);
}

function bindWorkerListeners(target: ReturnType<typeof useWorker>["target"]): void {
	if (boundWorkerTarget) return;

	boundWorkerTarget = target;
	boundWorkerTarget.addEventListener("entitlement_created", onEntitlementCreated);
	boundWorkerTarget.addEventListener("entitlement_deleted", onEntitlementDeleted);
	boundWorkerTarget.addEventListener("ready", flushAuthorCosmeticsRequests);
}

interface AuthorEmoteSetRequestOptions {
	isEnabled?: () => boolean;
	onResolved?: (userID: string) => void;
}

export function useAuthorEmoteSetRequests(options: AuthorEmoteSetRequestOptions = {}) {
	const { sendMessage: sendWorkerMessage, target: workerTarget } = useWorker();
	const isEnabled = options.isEnabled ?? (() => true);
	const onResolved = options.onResolved;
	sendWorkerMessageRef = sendWorkerMessage;
	bindWorkerListeners(workerTarget);
	if (onResolved) {
		personalEntitlementResolvedCallbacks.add(onResolved);
	}

	function requestAuthorCosmetics(authorData: Twitch.ChatUser | null | undefined): void {
		if (!isEnabled()) return;

		const userID = authorData?.userID?.trim();
		if (!userID || resolvedUserPersonalEmoteSets.has(userID) || pendingUserPersonalEmoteSets.has(userID)) return;

		pendingUserPersonalEmoteSets.set(userID, 0);
		scheduleAuthorCosmeticsFlush();
	}

	onUnmounted(() => {
		if (onResolved) {
			personalEntitlementResolvedCallbacks.delete(onResolved);
		}
	});

	return {
		requestAuthorCosmetics,
	};
}
