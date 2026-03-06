<template>
	<main class="compat-page">
		<div class="compat-page__header">
			<h1 v-t="'onboarding.compat_title'" class="compat-page__title" />
			<div class="compat-page__accent" />
			<p v-t="'onboarding.compat_subtitle'" class="compat-page__subtitle" />
		</div>

		<div class="compat-page__panel">
			<Compat :internal="true" @skip="emit('completed')" />
		</div>
	</main>
</template>

<script setup lang="ts">
import { onDeactivated, inject, provide, ref } from "vue";
import Compat from "../Compat/Compat.vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";

const emit = defineEmits<{
	(e: "completed"): void;
}>();

const ctx = useOnboarding("compatibility");
const cursorActive = inject('CURSOR_ACTIVE', ref(false));

provide('CURSOR_ACTIVE', cursorActive); // Provide down to the child compat panel if it needs it.

onDeactivated(() => {
	ctx.setCompleted(true);
});
</script>

<script lang="ts">
export const step: OnboardingStepRoute = {
	name: "compatibility",
	order: 4,
};
</script>

<style scoped lang="scss">
.compat-page {
	width: 100%;
	height: 100%;
	min-height: 0;
	justify-content: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2.5rem 2rem;
	gap: 2rem;
	overflow: hidden;
}

.compat-page__header {
	text-align: center;
	max-width: 44rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	opacity: 0;
	transform: translateY(2rem) scale(0.95);
	animation: compat-card-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
	overflow: hidden;
}

.compat-page__header > * {
	clip-path: polygon(-200% 0, 300% 0, 300% 100%, -200% 100%);
	opacity: 0;
	transform: translateY(100%);
	animation: compat-mask-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.compat-page__title {
	font-size: clamp(3.5rem, 6.5vw, 5rem);
	font-weight: 900;
	color: #fff;
	letter-spacing: -0.05em;
	line-height: 1.05;
	margin: 0;
	text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4);
	animation-delay: 0.2s;
}

.compat-page__accent {
	width: 3rem;
	height: 3px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.4);
	margin: 1.5rem 0;
	animation-delay: 0.3s;
}

.compat-page__subtitle {
	font-size: clamp(1.2rem, 1.4vw, 1.4rem);
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.6;
	margin: 0;
	font-weight: 500;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
	animation-delay: 0.4s;
}

.compat-page__panel {
	width: 100%;
	max-width: 54rem;
	border-radius: 1.5rem;
	background: linear-gradient(145deg, rgba(20, 20, 20, 0.6), rgba(8, 8, 8, 0.8));
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: 0 24px 80px -20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05);
	padding: 1.5rem;
	opacity: 0;
	transform: translateY(2rem) scale(0.97);
	animation: compat-panel-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
}

.compat-page :deep(.ui-button-important),
.compat-page :deep(.ui-button-hollow) {
	box-shadow: none !important;
}

@keyframes compat-panel-in {
	from {
		opacity: 0;
		transform: translateY(2rem) scale(0.97);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes compat-card-in {
	from {
		opacity: 0;
		transform: translateY(3rem) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes compat-mask-reveal {
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
