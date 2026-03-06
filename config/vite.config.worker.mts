import { appName, getFullVersion, r } from "./vite.utils";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
	const mode = process.env.NODE_ENV;
	const outDir = process.env.OUT_DIR || "";
	const isNightly = process.env.BRANCH === "nightly";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH || "",
	};

	process.stdout.write("Building worker...\n");

	return {
		mode,
		resolve: {
			alias: {
				"@": r("src"),
			},
		},

		root: r("."),
		build: {
			outDir: r("dist", outDir),
			emptyOutDir: false,
			write: true,
			rollupOptions: {
				input: {
					worker: r("src/worker/worker.root.ts"),
				},
				output: {
					entryFileNames: "worker.js",
				},
			},
		},
	};
});
