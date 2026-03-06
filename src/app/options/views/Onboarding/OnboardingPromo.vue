<template>
	<main class="promo">
		<div class="promo__header">
			<h1 v-t="'onboarding.promo_cta'" class="promo__cta" />
			<sub v-t="'onboarding.promo_plead'" class="promo__plead" />
		</div>

		<div class="promo__grid">
			<div
				v-tooltip="t('onboarding.promo_nametag_paints_tooltip')"
				class="promo__card promo__card--paints"
				name="paints"
				@mouseenter="cursorActive = true"
				@mouseleave="cursorActive = false"
			>
				<div class="promo__card-visual promo__paint-wrap">
					<div class="promo__paint-chip">
						<span 
							class="seventv-painted-content emo-interact" 
							:data-seventv-painted-text="true"
							@mouseenter="cursorShrink = true"
							@mouseleave="cursorShrink = false"
						>CoolChatter777</span>
					</div>
				</div>
				<p class="promo__card-label">
					{{ t("onboarding.promo_nametag_paints") }}
					<span v-tooltip="t('onboarding.promo_nametag_paints_caveat')" class="promo__asterisk"> * </span>
				</p>
			</div>

			<div
				v-tooltip="t('onboarding.promo_personal_emotes_tooltip')"
				class="promo__card promo__card--emotes"
				name="personal-emotes"
				@mouseenter="cursorActive = true"
				@mouseleave="cursorActive = false"
			>
				<div class="promo__card-visual promo__emotes-row">
					<div>
						<img src="https://cdn.7tv.app/emote/6042089e77137b000de9e669/2x.webp" class="emo-interact" @mouseenter="cursorShrink = true" @mouseleave="cursorShrink = false" />
					</div>
					<div>
						<img src="https://cdn.7tv.app/emote/60aee9d5361b0164e60d02c2/2x.webp" class="emo-interact" @mouseenter="cursorShrink = true" @mouseleave="cursorShrink = false" />
					</div>
					<div>
						<img src="https://cdn.7tv.app/emote/60ae7316f7c927fad14e6ca2/2x.webp" class="emo-interact" @mouseenter="cursorShrink = true" @mouseleave="cursorShrink = false" />
					</div>
				</div>
				<p class="promo__card-label">{{ t("onboarding.promo_personal_emotes") }}</p>
			</div>

			<div v-tooltip="t('onboarding.promo_badges_tooltip')" class="promo__card promo__card--badges" name="badges" @mouseenter="cursorActive = true" @mouseleave="cursorActive = false">
				<div class="promo__card-visual promo__badge-wrap">
					<VectorBadge class="emo-interact" @mouseenter="cursorShrink = true" @mouseleave="cursorShrink = false" :background="{ component: BgBadge3 }" :logo="{ color: 'white' }" />
				</div>
				<p class="promo__card-label">{{ t("onboarding.promo_badges") }}</p>
			</div>

			<div
				v-tooltip="t('onboarding.promo_animated_avatars_tooltip')"
				class="promo__card promo__card--avatars"
				name="animated-avatars"
				@mouseenter="cursorActive = true"
				@mouseleave="cursorActive = false"
			>
				<div class="promo__card-visual promo__avatar-wrap">
					<div class="promo__avatar-ring">
						<img src="https://cdn.7tv.app/emote/630393c6dd2e5e55608ef9f6/2x.webp" class="emo-interact" @mouseenter="cursorShrink = true" @mouseleave="cursorShrink = false" />
					</div>
				</div>
				<p class="promo__card-label">{{ t("onboarding.promo_animated_avatars") }}</p>
			</div>
		</div>

		<div class="promo__actions">
			<div @mouseenter="cursorActive = true" @mouseleave="cursorActive = false" class="promo__subscribe-wrap">
				<StoreSubscribeButton class="promo__subscribe" />
			</div>
			
			<button class="promo__skip" @click="onSkipClick" @mouseenter="cursorActive = true" @mouseleave="cursorActive = false">
				<span v-t="'onboarding.promo_reject'" />
			</button>
		</div>
	</main>
</template>

<script setup lang="ts">
const emit = defineEmits<{
	(e: "completed"): void;
}>();

const { t } = useI18n();
const cursorActive = inject('CURSOR_ACTIVE', ref(false));
const cursorShrink = inject('CURSOR_SHRINK', ref(false));

function onSkipClick(): void {
	cursorActive.value = false;
	emit("completed");
}
</script>

<script lang="ts">
import { ref, inject } from "vue";
import { useI18n } from "vue-i18n";
import BgBadge3 from "@/assets/svg/seventv/BgBadge3.vue";
import VectorBadge from "@/assets/svg/seventv/VectorBadge.vue";
import { OnboardingStepRoute } from "./Onboarding";
import StoreSubscribeButton from "@/app/store/StoreSubscribeButton.vue";

export const step: OnboardingStepRoute = {
	name: "promotion",
	order: 77,
	color: "var(--seventv-subscriber-color)",
};
</script>

<style scoped lang="scss">
.promo {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	min-height: 0;
	padding: clamp(1rem, 2.8vh, 3rem) 2rem clamp(0.8rem, 2.2vh, 2rem);
	gap: clamp(1.2rem, 3vh, 3rem);
	overflow: auto;
}

.promo__header {
	text-align: center;
	max-width: 44rem;
	opacity: 0;
	transform: translateY(2rem) scale(0.95);
	animation: promo-card-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
	overflow: hidden;
}

.promo__header > * {
	clip-path: polygon(-200% 0, 300% 0, 300% 100%, -200% 100%);
	opacity: 0;
	transform: translateY(100%);
	animation: promo-mask-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.promo__cta {
	font-size: clamp(3.5rem, 6.5vw, 5rem);
	font-weight: 900;
	letter-spacing: -0.05em;
	line-height: 1.05;
	margin: 0;
	color: #fff;
	text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4);
	animation-delay: 0.2s;
}

.promo__plead {
	display: block;
	margin-top: 1.5rem;
	font-size: clamp(1.2rem, 1.4vw, 1.4rem);
	color: rgba(255, 255, 255, 0.7);
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
	line-height: 1.6;
	font-weight: 500;
	animation-delay: 0.3s;
}

.promo__grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1.5rem;
	width: 100%;
	max-width: 48rem;
}

.promo__card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.25rem;
	padding: 1.5rem;
	background: linear-gradient(145deg, rgba(20, 20, 20, 0.8), rgba(8, 8, 8, 0.9));
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 1rem;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
	transition:
		transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		background 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	opacity: 0;
	transform: translateY(2rem) scale(0.97);
	animation: promo-card-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	&:hover {
		transform: translateY(-8px) scale(1.02);
		background: linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(12, 12, 12, 1));
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);

		&::after {
			opacity: 1;
		}
	}
}

.promo__card:nth-child(1) {
	animation-delay: 0.1s;
}

.promo__card:nth-child(2) {
	animation-delay: 0.18s;
}

.promo__card:nth-child(3) {
	animation-delay: 0.26s;
}

.promo__card:nth-child(4) {
	animation-delay: 0.34s;
}

.promo__card-visual {
	display: grid;
	place-items: center;
	width: 100%;
	aspect-ratio: 16 / 9;
	border-radius: 0.5rem;
	background: rgba(255, 255, 255, 0.03);
	overflow: hidden;
}

.emo-interact {
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
	
	&:hover {
		transform: scale(1.15) !important;
		filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)) brightness(1.1);
	}
}

.promo__paint-wrap {
	padding: 1rem;
}

.promo__paint-chip {
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
	border-radius: 0.5rem;
	background: rgba(25, 25, 30, 0.9);
}

.promo__emotes-row {
	display: grid;
	grid-template-columns: 0.5fr 1fr 0.5fr;
	gap: 0.5rem;
	padding: 0.75rem;

	> div {
		display: grid;
		place-items: center;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	> :first-child,
	> :last-child {
		opacity: 0.6;
	}
}

.promo__badge-wrap {
	font-size: clamp(3rem, 5vw, 4rem);
}

.promo__avatar-wrap {
	.promo__avatar-ring {
		display: grid;
		place-items: center;
		width: 50%;
		aspect-ratio: 1;
		border-radius: 50%;
		border: 3px solid #9146ff;
		background: #0d0d12;
		overflow: hidden;

		img {
			width: 85%;
			height: 85%;
			object-fit: contain;
		}
	}
}

.promo__card-label {
	font-size: 0.95rem;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.8);
	text-align: center;
	margin: 0;
	letter-spacing: 0.02em;
}

.promo__asterisk {
	color: rgba(255, 255, 255, 0.25);
	cursor: help;
}

.promo__card--paints .seventv-painted-content {
	font-weight: 700;
	font-size: clamp(0.9rem, 1.2vw, 1.2rem);
	background-image: linear-gradient(
		90deg,
		rgb(203, 255, 230) 0%,
		rgb(203, 255, 230) 20%,
		rgb(175, 233, 255) 20%,
		rgb(175, 233, 255) 40%,
		rgb(191, 185, 255) 40%,
		rgb(191, 185, 255) 60%,
		rgb(255, 207, 234) 60%,
		rgb(255, 207, 234) 80%,
		rgb(254, 255, 190) 80%,
		rgb(254, 255, 190) 100%
	);
	filter: drop-shadow(0 0 8px rgba(191, 185, 255, 0.6));
}

.promo__actions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	margin-top: -0.5rem;
	opacity: 0;
	transform: translateY(2rem) scale(0.97);
	animation: promo-card-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;

	:deep(button),
	button {
		box-shadow: none;
	}
}

.promo__subscribe {
	height: 3.5rem;
	padding: 0 4rem;
	font-size: 1.1rem;
	font-weight: 600;
	border-radius: 100px;
	transition:
		box-shadow 0.3s ease,
		transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	box-shadow: none !important;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 0 30px rgba(255, 255, 255, 0.2) !important;
	}

	&:active {
		transform: translateY(0) scale(0.97);
	}
}

:deep(.seventv-button-subscribe.promo__subscribe) {
	height: 3.5rem;
	padding: 0 4rem;
	font-size: 1.1rem;
	font-weight: 600;
	border-radius: 100px;
	box-shadow: none !important;
}

.promo__skip {
	all: unset;
	cursor: pointer;
	font-size: 0.85rem;
	color: rgba(255, 255, 255, 0.3);
	transition: color 0.2s ease;

	&:hover {
		color: #fff;
	}
}

@media screen and (max-width: 600px) {
	.promo__grid {
		grid-template-columns: 1fr;
	}
}

@keyframes promo-card-in {
	from {
		opacity: 0;
		transform: translateY(3rem) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes promo-mask-reveal {
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
