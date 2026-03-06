<template>
	<main class="changelog-page">
		<div class="changelog-page__glow" />
		<div class="changelog-page__content">
			<Changelog :no-header="true" />
		</div>
	</main>
</template>

<script setup lang="ts">
import Changelog from "@/site/global/Changelog.vue";

const { setCompleted } = useOnboarding("changelog");

onDeactivated(() => {
	setCompleted(true);
});
</script>

<script lang="ts">
import { onDeactivated } from "vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";

export const step: OnboardingStepRoute = {
	name: "changelog",
	order: 0.5,
};
</script>

<style scoped lang="scss">
.changelog-page {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 0;
	display: flex;
	justify-content: center;
	padding: clamp(0.8rem, 2.4vh, 2rem);
	overflow: auto;
}

.changelog-page__glow {
	display: none;
}

.changelog-page__content {
	position: relative;
	width: 100%;
	max-width: 44rem;
	opacity: 0;
	transform: translateY(2rem) scale(0.95);
	animation: changelog-card-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;

	@media screen and (width <= 1000px) {
		padding: 0;
	}
}

@keyframes changelog-card-in {
	from {
		opacity: 0;
		transform: translateY(3rem) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
