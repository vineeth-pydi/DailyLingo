# DailyLingo

**A little practice, every day.**

DailyLingo is a free, open source, installable language learning website. Practice everyday phrases in **English, Spanish, Mandarin Chinese, Hindi, and Modern Standard Arabic**. No account, subscription, or API key is required.

**Status: v0.4.0 community alpha.** These are original starter courses awaiting independent native-speaker review, not complete A1 curricula or certified assessments. Browser audio is synthesized when a compatible voice is available.

**[Open the app](https://vineeth-pydi.github.io/DailyLingo/) · [Source and contributions](https://github.com/vineeth-pydi/DailyLingo)**

## What works

- Five courses, each with six lessons and 36 everyday phrases (180 phrase forms total).
- A 12-activity lesson flow: six recognition questions, three word arrangements, and three typed recalls. Every phrase receives one production question.
- Script-aware checking: meaningful Hindi vowel signs and Spanish accents are preserved; optional Arabic vowel signs and punctuation are normalized.
- Shared speaker controls beside learning text on Home, Languages, Review, lessons, and Speaking; normal/slow playback and expandable word-by-word listening help with phrases and individual words.
- Optional Pinyin and Hindi/Arabic reading aids, plus voice selection and an on-device-only voice filter in Speaking. Compatible voice availability depends on the browser, device, and installed voice packs.
- Guided Speaking practice: listen to the example, choose **Speak and check**, then review each expected word and replay words to try again. The browser transcript shows matched, different, or missing words, plus any extra words heard.
- Browser word checking starts only after an explicit opt-in. It compares recognized words, without grading individual sounds, accent, rhythm, or Mandarin tones; recognition errors and background noise can affect feedback.
- A secondary **Record and compare by ear** option captures up to 30 seconds locally, with listening back, downloading, and deleting.
- Phrase reviews scheduled at 1, 3, 7, 14, and 30 days; missed/hinted items return after 10 minutes. Successful early practice preserves the scheduled review date.
- A clear daily practice plan, draft-first lesson resumption, daily goals, and activity history.
- A searchable phrase collection with target-language, meaning, and reading-aid search, plus a due-review filter.
- Device-local progress and validated resumable lesson drafts.
- Review answers save immediately; refreshing or closing preserves checked answers without counting them twice.
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

The build replaces generated `dist/` output, creates PWA PNG icons, and gives the offline cache a release-specific digest scoped to the app's URL. Removed assets are not carried into the next deployment. Deploy only `dist/`, never the repository root. The development server builds once at startup; restart it after editing source files.

## Deploy to GitHub Pages

The repository includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Pull requests run checks. Pushes to `main` run checks, build the static site, and deploy the resulting Pages artifact.

1. Create a public repository named `DailyLingo` and push the source.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run the workflow or push to `main`.
4. Read the deployed URL from the `github-pages` environment/workflow deployment.

The project Pages address for `vineeth-pydi/DailyLingo` is [vineeth-pydi.github.io/DailyLingo](https://vineeth-pydi.github.io/DailyLingo/). All application asset paths are relative so project Pages URLs work correctly. Confirm publication in the latest `github-pages` deployment before treating a local build as live.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). For a fork, change the repository URL in `src/config.js` before publishing.

## Project layout

```text
public/                  HTML, CSS, PWA manifest, service worker, SVG icon
src/content.js           Languages, phrases, reading aids, lesson metadata
src/core.js              Scheduling, answer checking, state validation
src/drafts.js            Safe lesson-draft restoration
src/app.js               Views, interaction, browser persistence, audio
src/config.js            Public repository link
src/audio-ui.js          Shared phrase and word speaker controls, script-aware segmentation
src/speech.js            Guided Speaking, voices, browser word check, local recording
src/speech-feedback.js   Ordered transcript comparison and per-word retry feedback
scripts/build.mjs        Static packaging and dependency-free icon generation
scripts/serve.mjs        Local HTTP preview
tests/                   Learning logic, content, and static build tests
.github/workflows/       Checks and GitHub Pages deployment
```

## Privacy and limitations

DailyLingo keeps the original FreeLingo storage keys and backup format so the rename preserves existing progress on the same browser and origin. Progress lives in this browser's local storage. Clearing browser data or using another device does not automatically preserve it; export a backup. Backups contain practice history, preferences, and phrase IDs, so share them intentionally.

There are no analytics, trackers, app-managed accounts, or server-side learner records. GitHub Pages may receive normal hosting request data under its own policies. Optional audio uses the browser/OS speech service; processing location and available voices depend on the platform. Speaking requests microphone access only when you choose **Record my voice** or **Speak and check**. Local recordings remain in tab memory; DailyLingo does not upload them. Changing phrases or leaving Speaking clears the recording. Navigation, hiding the tab, or time limits stop microphone capture. **Speak and check** uses optional browser transcription, which may send audio to the browser provider and may need internet access; it starts only after you enable **Allow browser word check** and choose the button.

Voice preferences are stored separately from progress backups. Transcription consent and recordings are never stored in a backup. Speech availability depends on browser, device, voice packs, and language. The word check does not measure accent, phonemes, rhythm, or Mandarin tone accuracy. A recognized-word match cannot confirm correct pronunciation, and a mismatch can reflect a recognition error. Listening and local recording remain available when browser word checking is unsupported, subject to the device's voice and microphone capabilities. See [SPEECH_RESOURCES.md](SPEECH_RESOURCES.md) for researched datasets, licenses, and the subscription-free speech roadmap.

Phrase examples sometimes use a specific gender, register, or regional word. Notes highlight some cases; approved variants and native reference recordings are future work. Arabic is MSA only in this alpha. Use one active learning tab to avoid conflicting progress edits. Offline caches may be evicted by the browser; reload online to cache again. Cache cleanup is scoped to this app; caches for an older `/FreeLingo/` installation are preserved. Open the new `/DailyLingo/` address online once to cache the renamed app. Existing home-screen shortcuts may still point at the old address; install the renamed app from its new address.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CONTENT_GUIDE.md](CONTENT_GUIDE.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Phrase corrections and accessibility improvements are especially welcome. The updated product and launch roadmap is in [REBUILD_PLAN.md](REBUILD_PLAN.md).

## License

Code, original phrase text, generated icons, and documentation are released under the [MIT license](LICENSE). Do not add third-party audio, copied curricula, or images without compatible licensing and provenance.
