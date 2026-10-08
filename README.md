# FreeLingo

**A little practice. A world of possibility.**

FreeLingo is a free, open source, installable language learning website. Practice everyday phrases in **English, Spanish, Mandarin Chinese, Hindi, and Modern Standard Arabic**. No account, subscription, or API key is required.

**Status: v0.1.0 community alpha.** These are original starter courses awaiting independent native-speaker review, not complete A1 curricula or certified assessments. Browser audio is synthesized when a compatible voice is available.

**[Open the app](https://vineeth-pydi.github.io/FreeLingo/) · [Source and contributions](https://github.com/vineeth-pydi/FreeLingo)**

## What works

- Five courses, each with six lessons and 36 everyday phrases (180 phrase forms total).
- A 12-activity lesson flow with recognition, word arrangement, and typed recall.
- Script-aware checking: meaningful Hindi vowel signs and Spanish accents are preserved; optional Arabic vowel signs and punctuation are normalized.
- Optional Pinyin and Hindi/Arabic reading aids, plus browser text-to-speech with voice availability feedback.
- Phrase reviews scheduled at 1, 3, 7, 14, and 30 days; missed/hinted items return after 10 minutes.
- Device-local progress, daily goals, activity history, and resumable lesson drafts.
- Prompt meanings in any of the five languages, distinct from the target language. Interface text is in English.
- Backup export/import and progress deletion.
- Responsive keyboard-accessible interface, RTL Arabic content, and reduced-motion support.
- Web app installation and offline lessons after a successful online load. Voices may need connectivity.

## Run locally

Use **Node.js 22 or newer**. There are no third-party runtime or build dependencies.

```sh
npm run dev
```

Open `http://127.0.0.1:4173`. To use a different port, set `PORT` in your shell before starting. The server is bound to loopback only.

```sh
npm run check
npm test
npm run build
```

The build writes `dist/`, creates PWA PNG icons, and gives the offline cache a release-specific digest. Deploy only `dist/`, never the repository root. The development server builds once at startup; restart it after editing source files.

## Deploy to GitHub Pages

The repository includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Pull requests run checks. Pushes to `main` run checks, build the static site, and deploy the resulting Pages artifact.

1. Create a public repository named `FreeLingo` and push the source.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run the workflow or push to `main`.
4. Read the deployed URL from the `github-pages` environment/workflow deployment.

The live app for `vineeth-pydi/FreeLingo` is [vineeth-pydi.github.io/FreeLingo](https://vineeth-pydi.github.io/FreeLingo/). All application asset paths are relative so project Pages URLs work correctly.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). For a fork, change the repository URL in `src/config.js` before publishing.

## Project layout

```text
public/                  HTML, CSS, PWA manifest, service worker, SVG icon
src/content.js           Languages, phrases, reading aids, lesson metadata
src/core.js              Scheduling, answer checking, state validation
src/app.js               Views, interaction, browser persistence, audio
src/config.js            Public repository link
scripts/build.mjs        Static packaging and dependency-free icon generation
scripts/serve.mjs        Local HTTP preview
tests/                   Learning logic, content, and static build tests
.github/workflows/       Checks and GitHub Pages deployment
```

## Privacy and limitations

Progress lives in this browser's local storage. Clearing browser data or using another device does not automatically preserve it; export a backup. Backups contain practice history, preferences, and phrase IDs, so share them intentionally.

There are no analytics, trackers, app-managed accounts, or server-side learner records. GitHub Pages may receive normal hosting request data under its own policies. Optional audio uses the browser/OS speech service; processing location and available voices depend on the platform. The app never requests microphone access.

Phrase examples sometimes use a specific gender, register, or regional word. Notes highlight some cases; approved variants and recorded audio are future work. Arabic is MSA only in this alpha. Use one active learning tab to avoid conflicting progress edits. Offline caches may be evicted by the browser; reload online to cache again.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CONTENT_GUIDE.md](CONTENT_GUIDE.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Phrase corrections and accessibility improvements are especially welcome. The updated product and launch roadmap is in [REBUILD_PLAN.md](REBUILD_PLAN.md).

## License

Code, original phrase text, generated icons, and documentation are released under the [MIT license](LICENSE). Do not add third-party audio, copied curricula, or images without compatible licensing and provenance.
