<template>
	<main class="endpage">
		<div class="endpage__header">
			<h1 v-t="'onboarding.end_title'" class="endpage__title" />
			<p v-t="'onboarding.end_subtitle'" class="endpage__subtitle" />
		</div>

		<div class="endpage__cards">
			<div class="endpage__card endpage__card--discord">
				<div class="endpage__card-watermark">
					<LogoBrandDiscord />
				</div>
				<h2 class="endpage__card-heading">
					{{ discord.name }}
					<sub>{{ discord.online_members ?? "..." }} members online</sub>
				</h2>

				<div class="endpage__card-spacer" />
				<UiButton
					class="endpage__card-btn endpage__card-btn--discord"
					:disabled="!discord.invite"
					@click="onOpenDiscordInvite"
					@mouseenter="cursorActive = true"
					@mouseleave="cursorActive = false"
				>
					<template #icon>
						<LogoBrandDiscord />
					</template>
					<span v-t="'onboarding.button_join'" />
				</UiButton>
			</div>

			<div class="endpage__card endpage__card--rate">
				<h2 class="endpage__card-heading">
					{{ t("onboarding.end_review1") }}
					<sub v-t="'onboarding.end_review2'" />
				</h2>

				<div class="endpage__stars" @click="openReviewLink" @mouseenter="cursorActive = true" @mouseleave="cursorActive = false">
					<StarIcon v-for="k in Array(5)" :key="k" />
				</div>
				<UiButton 
					class="endpage__card-btn endpage__card-btn--rate" 
					@click="openReviewLink"
					@mouseenter="cursorActive = true"
					@mouseleave="cursorActive = false"
				>
					<span v-t="'onboarding.button_review'" />
				</UiButton>
			</div>

			<div class="endpage__card endpage__card--social">
				<h2 class="endpage__card-heading">
					{{ t("onboarding.end_social_media1") }}
					<sub v-t="'onboarding.end_social_media2'" />
				</h2>

				<button 
					class="endpage__x-btn" 
					@click="openX"
					@mouseenter="cursorActive = true"
					@mouseleave="cursorActive = false"
				>
					<LogoBrandX />
				</button>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { onActivated, reactive, inject, ref } from "vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";
import UiButton from "@/ui/UiButton.vue";
import LogoBrandDiscord from "@/assets/svg/logos/LogoBrandDiscord.vue";
import StarIcon from "@/assets/svg/icons/StarIcon.vue";
import { useUserAgent } from "@/composable/useUserAgent";
import LogoBrandX from "@/assets/svg/logos/LogoBrandX.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

useOnboarding("end");
const ua = useUserAgent();
const cursorActive = inject('CURSOR_ACTIVE', ref(false));

const discord = reactive({
	name: "7TV Discord",
	invite: "https://discord.gg/7tv",
	online_members: null as number | null,
});

fetch("https://discord.com/api/guilds/817075418054000661/widget.json")
	.then(async (res) => {
		const d = await res.json();
		if (!d) return;

		discord.name = d.name || discord.name;
		discord.invite = d.instant_invite || discord.invite;
		discord.online_members = typeof d.presence_count === "number" ? d.presence_count : discord.online_members;
	})
	.catch(() => {
		// Keep fallback content if the widget API is unavailable.
	});

function onOpenDiscordInvite(): void {
	chrome.tabs.create({ url: discord.invite });
}

function openReviewLink(): void {
	switch (ua.browser.name) {
		case "Firefox":
			chrome.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/7tv-extension/" });
			break;

		default:
			chrome.tabs.create({
				url: "https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh",
			});
			break;
	}
}

function openX(): void {
	chrome.tabs.create({ url: "https://x.com/Official_7TV" });
}

onActivated(() => {
	if (!chrome || !chrome.storage) return;
	chrome.storage.local.remove("upgraded");
});
</script>

<script lang="ts">
export const step: OnboardingStepRoute = {
	name: "end",
	order: 100,
	color: "var(--seventv-primary)",
};
</script>

<style scoped lang="scss">
.endpage {
	width: 100%;
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: clamp(1.2rem, 2.8vh, 2.5rem);
	padding: clamp(1rem, 2.5vh, 2.5rem) 2rem;
	overflow: auto;
}

.endpage__header {
	text-align: center;
	max-width: 44rem;
	opacity: 0;
	transform: translateY(2rem) scale(0.95);
	animation: end-card-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
	overflow: hidden;
}

.endpage__header > * {
	clip-path: polygon(-200% 0, 300% 0, 300% 100%, -200% 100%);
	opacity: 0;
	transform: translateY(100%);
	animation: end-mask-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.endpage__title {
	font-size: clamp(3.5rem, 6.5vw, 5rem);
	font-weight: 900;
	letter-spacing: -0.05em;
	line-height: 1.05;
	margin: 0;
	color: #fff;
	text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4);
	animation-delay: 0.2s;
}

.endpage__subtitle {
	margin-top: 1.5rem;
	font-size: clamp(1.2rem, 1.4vw, 1.4rem);
	color: rgba(255, 255, 255, 0.7);
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
	line-height: 1.6;
	font-weight: 500;
	animation-delay: 0.3s;
}

.endpage__cards {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1.5rem;
	width: 100%;
	max-width: 54rem;
}

.endpage__card {
	position: relative;
	display: flex;
	flex-direction: column;
	border-radius: 1rem;
	padding: 1.75rem 1.5rem;
	gap: 1.25rem;
	overflow: hidden;
	transition:
		box-shadow 0.3s ease,
		transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
		background 0.3s ease,
		border-color 0.3s ease;

	background: linear-gradient(145deg, rgba(20, 20, 20, 0.8), rgba(8, 8, 8, 0.9));
	border: 1px solid rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
	opacity: 0;
	transform: translateY(2rem) scale(0.97);
	animation: end-card-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;

	&:hover {
		transform: translateY(-8px) scale(1.02);
		background: linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(12, 12, 12, 1));
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}
}

.endpage__card:nth-child(1) { animation-delay: 0.4s; }
.endpage__card:nth-child(2) { animation-delay: 0.5s; }
.endpage__card:nth-child(3) { animation-delay: 0.6s; }

.endpage__card-btn,
.endpage__x-btn {
	box-shadow: none !important;
}

.endpage__card-watermark {
	position: absolute;
	top: -1rem;
	right: -1rem;
	opacity: 0.04;
	font-size: 8rem;
	pointer-events: none;

	svg {
		width: 1em;
		height: 1em;
	}
}

.endpage__card-heading {
	font-size: clamp(1rem, 1.3vw, 1.2rem);
	font-weight: 700;
	color: #fff;
	line-height: 1.3;
	margin: 0;
	position: relative;

	sub {
		display: block;
		font-size: clamp(0.8rem, 0.9vw, 0.9rem);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.4);
		line-height: 1.5;
		margin-top: 0.3rem;
	}
}

.endpage__card-spacer {
	flex: 1;
}

.endpage__card-btn {
	width: 100%;
	height: 2.75rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 100px;
	font-size: 0.95rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.2s ease,
		box-shadow 0.2s ease,
		transform 0.1s ease;

	&:active {
		transform: scale(0.98);
	}
}

.endpage__card-btn--discord {
	background: rgba(88, 101, 242, 0.15);
	outline-color: rgba(88, 101, 242, 0.3);
	color: #8b9aff;

	&:hover {
		background: rgba(88, 101, 242, 0.25);
		box-shadow: 0 0 20px -4px rgba(88, 101, 242, 0.3);
	}
}

.endpage__card-btn--rate {
	background: rgba(145, 70, 255, 0.12);
	outline-color: rgba(145, 70, 255, 0.3);
	color: #c4a1ff;

	&:hover {
		background: rgba(145, 70, 255, 0.22);
		box-shadow: 0 0 20px -4px rgba(145, 70, 255, 0.3);
	}
}

.endpage__stars {
	display: flex;
	justify-content: center;
	gap: 0.3rem;
	cursor: pointer;

	svg {
		width: clamp(2rem, 2.5vw, 2.5rem);
		height: clamp(2rem, 2.5vw, 2.5rem);
		color: rgba(255, 193, 7, 0.25);
		transition:
			color 0.2s ease,
			transform 0.15s ease,
			filter 0.2s ease;
	}

	&:hover svg {
		color: #ffc107;
		filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.5));
		animation: star-shimmer 0.6s ease infinite alternate;
	}

	svg:hover {
		transform: scale(1.25);
	}
}

@keyframes star-shimmer {
	0% {
		filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.3));
	}
	100% {
		filter: drop-shadow(0 0 12px rgba(255, 193, 7, 0.6));
	}
}

.endpage__x-btn {
	all: unset;
	display: flex;
	align-items: center;
	justify-content: center;
	align-self: center;
	width: clamp(3.5rem, 5vw, 4.5rem);
	height: clamp(3.5rem, 5vw, 4.5rem);
	background: #fff;
	border-radius: 50%;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		box-shadow 0.25s ease;

	svg {
		width: clamp(1.4rem, 2vw, 1.8rem);
		height: clamp(1.4rem, 2vw, 1.8rem);
		color: #000;
	}

	&:hover {
		transform: scale(1.08);
		box-shadow: 0 0 24px -4px rgba(255, 255, 255, 0.2);
	}

	&:active {
		transform: scale(0.96);
	}
}

@keyframes end-card-in {
	from {
		opacity: 0;
		transform: translateY(3rem) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes end-mask-reveal {
	0% {
		opacity: 0;
		transform: translateY(100%);
		clip-path: polygon(-200% 0, 300% 0, 300% 100%, -200% 100%);
	}
	1% {
		opacity: 1;
	}
	100% {
		opacity: 1;
		transform: translateY(0);
		clip-path: polygon(-200% -200%, 300% -200%, 300% 300%, -200% 300%);
	}
}
</style>
