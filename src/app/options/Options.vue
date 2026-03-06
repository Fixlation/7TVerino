<template>
	<main class="seventv-options" :class="{ 'no-header': noHeader }">
		<Transition name="general-heading-fade">
			<div v-if="!noHeader" class="general-heading">
				<div class="app-title">
					<Logo7TV class="app-title__logo" />
				</div>
			</div>
		</Transition>

		<RouterView />
	</main>

	<Tooltip />
</template>

<script setup lang="ts">
import { provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Tooltip from "@/site/global/Tooltip.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import { OPTIONS_CONTEXT_KEY } from "./keys";

provide(OPTIONS_CONTEXT_KEY, true);

const route = useRoute();
const noHeader = ref(false);

watch(
	() => [route.name, route.params.step, route.query.noheader],
	() => {
		const step = Array.isArray(route.params.step) ? route.params.step[0] : route.params.step;
		const isOnboardingStart = route.name === "Onboarding" && (!step || step === "start");
		noHeader.value = route.query.noheader === "1" || isOnboardingStart;
	},
	{ immediate: true },
);

document.body.setAttribute("theme", "dark");
</script>

<style lang="scss">
@import "@/assets/style/global";

html[data-seventv-app] {
	box-sizing: border-box;
	font-family: Roboto, sans-serif;
	height: 100%;
	width: 100%;

	*,
	*::before,
	*::after {
		box-sizing: inherit;
		margin: 0;
	}
}

body[data-seventv-app] {
	height: 100%;
	width: 100%;
	overflow-x: hidden;
	color: var(--seventv-text-color-normal);
}

#app {
	height: 100%;
	width: 100%;
}

.general-heading {
	display: grid;
	grid-template-columns: 50% 50%;
	padding: 0.5rem;
	background: rgba(10, 10, 10, 0.75);
	max-height: 6rem;
	overflow: hidden;
	position: relative;
	z-index: 10020;
	isolation: isolate;

	.app-title {
		font-size: 1vw;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #fff;

		svg {
			font-size: 2rem;
			font-size: 2vw;
			margin-right: 0.15rem;
			color: #fff;
			fill: #fff;
		}

		svg * {
			color: #fff;
			fill: #fff;
		}
	}
}

.seventv-options {
	height: 100%;
	width: 100%;
	background: var(--seventv-background-shade-1);

	&.no-header {
		background: none;

		.general-heading {
			display: none;
		}
	}
}

.app-title__logo,
.app-title__logo * {
	color: #fff !important;
	fill: #fff !important;
	opacity: 1 !important;
}

.general-heading-fade-enter-active {
	transition:
		max-height 0.72s cubic-bezier(0.16, 1, 0.3, 1),
		padding-top 0.72s cubic-bezier(0.16, 1, 0.3, 1),
		padding-bottom 0.72s cubic-bezier(0.16, 1, 0.3, 1),
		opacity 0.58s ease,
		transform 0.72s cubic-bezier(0.16, 1, 0.3, 1),
		filter 0.72s ease;
	transition-delay: 0.1s;
	will-change: max-height, padding, opacity, transform, filter;
}

.general-heading-fade-leave-active {
	transition:
		max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		padding-top 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		padding-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		opacity 0.2s ease,
		transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
		filter 0.3s ease;
	will-change: max-height, padding, opacity, transform, filter;
}

.general-heading-fade-enter-from,
.general-heading-fade-leave-to {
	max-height: 0;
	padding-top: 0;
	padding-bottom: 0;
	opacity: 0;
	transform: translateY(-0.6rem);
	filter: blur(6px);
}

.general-heading-fade-enter-to,
.general-heading-fade-leave-from {
	max-height: 6rem;
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
	opacity: 1;
	transform: translateY(0);
	filter: blur(0);
}
</style>
