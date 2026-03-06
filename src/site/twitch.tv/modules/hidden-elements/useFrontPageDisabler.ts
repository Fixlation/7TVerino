import { onUnmounted, watch } from "vue";
import { useConfig } from "@/composable/useSettings";

const FRONT_PAGE_VIDEO_SELECTOR = "div[data-a-player-type='frontpage'] video";
const FRONT_PAGE_IFRAME_SELECTOR = "div[data-a-target='frontpage-headliner'] iframe";

function isFrontPageVideo(target: EventTarget | null): target is HTMLVideoElement {
	return target instanceof HTMLVideoElement && !!target.closest("div[data-a-player-type='frontpage']");
}

function stopFrontPageVideo(video: HTMLVideoElement): void {
	try {
		video.muted = true;
		video.volume = 0;
		video.autoplay = false;
	} catch {
		// noop
	}

	try {
		video.pause();
	} catch {
		// noop
	}

	try {
		video.removeAttribute("src");
		video.srcObject = null;
		video.load();
	} catch {
		// noop
	}
}

function stopFrontPageFrame(frame: HTMLIFrameElement): void {
	try {
		frame.src = "about:blank";
	} catch {
		// noop
	}
}

export function useFrontPageDisabler(): void {
	const disableFrontPage = useConfig<boolean>("layout.disable_front_page");

	let observer: MutationObserver | null = null;
	let queuedFrame: number | null = null;

	function stopFrontPagePlayback(): void {
		document.querySelectorAll<HTMLVideoElement>(FRONT_PAGE_VIDEO_SELECTOR).forEach(stopFrontPageVideo);
		document.querySelectorAll<HTMLIFrameElement>(FRONT_PAGE_IFRAME_SELECTOR).forEach(stopFrontPageFrame);
	}

	function cancelQueuedStop(): void {
		if (queuedFrame === null) return;

		cancelAnimationFrame(queuedFrame);
		queuedFrame = null;
	}

	function queueStopFrontPagePlayback(): void {
		if (queuedFrame !== null) return;

		queuedFrame = requestAnimationFrame(() => {
			queuedFrame = null;

			if (!disableFrontPage.value) return;
			stopFrontPagePlayback();
		});
	}

	// Twitch can start playback on an existing video without replacing the node.
	function onFrontPagePlaybackAttempt(ev: Event): void {
		if (!disableFrontPage.value) return;
		if (!isFrontPageVideo(ev.target)) return;

		stopFrontPageVideo(ev.target);
	}

	function connect(): void {
		if (observer || !document.body) return;

		observer = new MutationObserver(() => queueStopFrontPagePlayback());
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["src"],
		});

		document.addEventListener("play", onFrontPagePlaybackAttempt, true);
		document.addEventListener("playing", onFrontPagePlaybackAttempt, true);
		queueStopFrontPagePlayback();
	}

	function disconnect(): void {
		observer?.disconnect();
		observer = null;

		document.removeEventListener("play", onFrontPagePlaybackAttempt, true);
		document.removeEventListener("playing", onFrontPagePlaybackAttempt, true);
		cancelQueuedStop();
	}

	watch(
		disableFrontPage,
		(enabled) => {
			if (!enabled) {
				disconnect();
				return;
			}

			connect();
			queueStopFrontPagePlayback();
		},
		{ immediate: true },
	);

	onUnmounted(disconnect);
}
