import type { AnyToken, ChatUser } from "@/common/chat/ChatMessage";
import { Tokenizer } from "@/common/chat/Tokenizer";

export interface NormalizedAuthor {
	id: string;
	username: string;
	displayName: string;
	color: string;
	intl?: boolean;
	isActor?: boolean;
}

export interface WorkerSafeHighlightDef {
	id: string;
	color: string;
	label: string;
	pattern?: string;
	regexp?: boolean;
	caseSensitive?: boolean;
	phrase?: boolean;
	username?: boolean;
	badge?: boolean;
	version?: string;
	builtin?: "mention" | "reply" | "self";
}

export interface NormalizedHighlightResult {
	id: string;
	color: string;
	label: string;
}

export interface NormalizedToken extends AnyToken {}

export interface NormalizedChatMessageInput {
	id: string;
	body: string;
	author: NormalizedAuthor | null;
	badges: Record<string, string>;
	sourceRoomID: string | null;
	currentChannelID: string;
	hideSharedChat: boolean;
	parentAuthorUsername?: string | null;
	actorID?: string | null;
	actorUsername?: string | null;
	showModifiers: boolean;
	chatterMap: Record<string, ChatUser>;
	emoteMap: Record<string, SevenTV.ActiveEmote>;
	localEmoteMap: Record<string, SevenTV.ActiveEmote>;
	highlights: WorkerSafeHighlightDef[];
}

export interface NormalizedChatMessage {
	id: string;
	tokens: NormalizedToken[];
	mentions: string[];
	highlight: NormalizedHighlightResult | null;
	matchedHighlightIDs: string[];
	emoteLinkEmbed: string | null;
	sourceRoomID: string | null;
	hiddenBySharedChat: boolean;
}

export function processNormalizedChatMessage(input: NormalizedChatMessageInput): NormalizedChatMessage {
	const msg = {
		body: input.body,
		emoteLinkEmbed: null as string | null,
		mentions: new Set<string>(),
		tokens: [] as AnyToken[],
	};

	const tokenizer = new Tokenizer(msg as never);
	const tokens = tokenizer.tokenize({
		chatterMap: input.chatterMap,
		emoteMap: input.emoteMap,
		localEmoteMap: input.localEmoteMap,
		showModifiers: input.showModifiers,
	});

	let highlight: NormalizedHighlightResult | null = null;
	const matchedHighlightIDs: string[] = [];
	for (const def of input.highlights) {
		if (!matchesHighlight(def, input)) continue;
		matchedHighlightIDs.push(def.id);

		highlight = {
			id: def.id,
			color: def.color,
			label: def.label,
		};
	}

	return {
		id: input.id,
		tokens,
		mentions: Array.from(msg.mentions),
		highlight,
		matchedHighlightIDs,
		emoteLinkEmbed: msg.emoteLinkEmbed,
		sourceRoomID: input.sourceRoomID,
		hiddenBySharedChat:
			!!input.sourceRoomID && input.hideSharedChat && input.currentChannelID !== input.sourceRoomID,
	};
}

function matchesHighlight(def: WorkerSafeHighlightDef, input: NormalizedChatMessageInput): boolean {
	switch (def.builtin) {
		case "mention":
			return !!(
				input.actorUsername &&
				input.author &&
				input.author.username !== input.actorUsername &&
				new RegExp(`\\b${escapeRegExp(input.actorUsername)}\\b`, "i").test(input.body)
			);
		case "reply":
			return !!(
				input.actorUsername &&
				input.parentAuthorUsername &&
				input.author &&
				input.author.username !== input.parentAuthorUsername &&
				input.parentAuthorUsername.toLowerCase() === input.actorUsername.toLowerCase()
			);
		case "self":
			return !!(input.actorID && input.author && input.author.id === input.actorID);
	}

	if (def.phrase || (!def.phrase && !def.username && !def.badge)) {
		if (def.regexp && def.pattern) {
			try {
				return new RegExp(def.pattern, "i").test(input.body);
			} catch {
				return false;
			}
		}

		if (def.pattern) {
			return def.caseSensitive
				? input.body.includes(def.pattern)
				: input.body.toLowerCase().includes(def.pattern.toLowerCase());
		}

		return false;
	}

	if (def.username) {
		return input.author?.displayName.toLowerCase() === def.pattern?.toLowerCase();
	}

	if (def.badge) {
		const badgeKeys = Object.keys(input.badges).map((value) => value.toLowerCase());
		const badgeValues = Object.values(input.badges).map((value) => value.toLowerCase());
		return (
			badgeKeys.includes(def.pattern?.toLowerCase() ?? "") &&
			badgeValues.includes(def.version?.toLowerCase() ?? "")
		);
	}

	return false;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
