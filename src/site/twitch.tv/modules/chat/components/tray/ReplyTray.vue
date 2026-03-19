<template>
	<div class="seventv-tray-header">
		<div class="seventv-tray-icon seventv-reply">
			<TwReply v-if="!thread" />
			<TwChatReply v-else />
		</div>
		<div class="seventv-tray-header-text">
			<span v-if="!thread && authorID">
				{{ `Replying to @${displayName ?? username}:` }}
			</span>
			<span v-else>Replying in thread</span>
		</div>
		<div class="seventv-tray-icon seventv-close" @click="close()">
			<TwClose />
		</div>
	</div>

	<div class="seventv-reply-preview">
		<span v-if="displayName || username" class="seventv-reply-preview-author">
			{{ `@${displayName ?? username}` }}
		</span>
		<span class="seventv-reply-preview-body">
			{{ body || "Original message unavailable" }}
		</span>
	</div>
</template>

<script setup lang="ts">
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import TwReply from "@/assets/svg/twitch/TwReply.vue";

defineProps<{
	close: () => void;
	id: string;
	authorID?: string;
	username?: string;
	displayName?: string;
	body: string;
	deleted: boolean;
	thread?: {
		deleted: boolean;
		id: string;
		login: string;
	};
}>();
</script>

<style scoped lang="scss">
.seventv-tray-header {
	display: flex;
	justify-content: space-between;

	.seventv-tray-icon {
		font-size: 1.25em;
		fill: currentcolor;
		padding: 0.5rem;
		flex-shrink: 0;

		svg {
			display: flex;
			align-self: center;
		}
	}

	.seventv-tray-header-text {
		color: var(--color-text-alt);
		display: flex;
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0 0.5rem;
		flex-grow: 1;
		vertical-align: middle;
		align-items: center;
	}

	.seventv-close {
		float: right;
		cursor: pointer;

		&:hover {
			background-color: hsla(0deg, 0%, 60%, 24%);
			border-radius: 0.4rem;
		}
	}
}

.seventv-reply-preview {
	display: grid;
	gap: 0.25rem;
	padding: 0.5rem 1rem 1rem;
}

.seventv-reply-preview-author {
	color: var(--color-text-alt);
	font-size: 1.2rem;
	font-weight: 600;
}

.seventv-reply-preview-body {
	color: var(--color-text-base);
	font-size: 1.3rem;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
