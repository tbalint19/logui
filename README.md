#!/usr/bin/env node

process.on("SIGINT", () => {
	console.log("EXITING...")
	process.exit(1)
})
to build/index.js first line

/assets/package.json to /build/package.json