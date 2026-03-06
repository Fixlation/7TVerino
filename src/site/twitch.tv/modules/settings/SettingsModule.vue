<template>
	<SettingsMenuButton @toggle="ctx.open = !ctx.open" />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import { useExperimentalStreamPreload } from "./useExperimentalStreamPreload";

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
});

const ctx = useSettingsMenu();
useExperimentalStreamPreload();

markAsReady();
</script>

<script lang="ts">
import { declareConfig } from "@/composable/useSettings";

export const config = [
	declareConfig("general.performance_mode", "TOGGLE", {
		path: ["General", "Performance"],
		label: "Performance Mode (Experimental)",
		hint: "Experimental: Enables alternate chat rendering, adaptive runtime tuning, and bounded prewarm/prefetch. May increase background activity and can fall back to the default path if Twitch behaves unexpectedly.",
		defaultValue: false,
	}),
];
</script>

<style scoped lang="scss">
.settings-menu-enter-active,
.settings-menu-leave-active {
	transition: opacity 120ms;
}

.settings-menu-enter-from,
.settings-menu-leave-to {
	opacity: 0;
}
</style>
