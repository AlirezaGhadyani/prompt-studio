# Contributing

Thanks for taking the time to improve Prompt Studio.

## Development

```sh
npm ci
npm run check   # typecheck + tests + build
```

`npm run check` is the same command CI runs. A pull request that changes behavior should include a test and an update to the README or the relevant doc.

## Project rules

- Keep changes focused. One concern per pull request.
- Do not add runtime dependencies unless they are necessary and bundled into `panel/main.js`.
- The panel runs in a sandboxed iframe: no direct network, filesystem, `navigator.clipboard`, or downloads.
- Only `package.json`, `panel/index.html`, and `panel/main.js` ship to OpenChamber. `node_modules` is ignored.
- Commit the rebuilt `panel/main.js` with source changes. OpenChamber never builds at install time.
- Do not commit secrets, API keys, or the generated `migration/` folder.

## Shipping an update

1. Change the source.
2. Bump `version` in `package.json`.
3. Run `npm run check`.
4. Commit the source and the rebuilt `panel/main.js`.
5. Push. OpenChamber checks Git installs for updates in Settings → Extensions.

## Reporting a bug

Open an issue with:

- Prompt Studio version and OpenChamber version.
- Steps to reproduce, expected result, and actual result.
- Any console error from the panel. Never include API keys or private prompt text.
