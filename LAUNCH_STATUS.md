# DailyLingo launch status

Updated: 2026-10-08 (America/Chicago).

## Speaking and listening update — v0.4.0

Release scope: shared phrase, slow, and word-by-word speaker controls across learning views; a guided Listen → Speak and check → Review flow; ordered transcript comparison with per-word replay and practice prompts; explicit browser speech-provider opt-in; and bounded capture/error recovery. Local recording remains a separate way to compare by ear. The selected browser word check does not assess phonemes, accent, rhythm, or Mandarin tones.

### Local validation

- Syntax checks and all 63 automated tests passed. New coverage includes all 180 phrase forms, all 20 prompt/target-language pairs, script-aware word segmentation, ordered missing/extra/repeated words, audio clicks without answer changes, bounded speech completion, stale events, opt-in, background cleanup, unsupported browsers, and persistent announcements.
- Edge browser regression completed all 12 lesson activities in each of the five languages, checked 35 route/viewport combinations, and verified saved progress, draft resumption, phrase filtering, backup round trips, and offline lesson start with no page errors.
- Speaker routing was exercised through 2,050 real UI clicks and 230 layout checks, including every language pair at desktop and 375px. Buttons route the displayed text/language once, preserve answers, do not reveal recall targets, and have at least 44px touch targets. Screenshots were inspected.
- Speaking browser checks passed for all five languages at desktop and 375px: 61 simulated recognition attempts, 44 targeted word replays, and 35 layout checks. Covered opt-in, locale, exact/different/missing/extra words, retry, provider errors, permission withdrawal, navigation/background cancellation, stale results, a real five-second completion timeout, unsupported browsers, and persistent announcements. No page errors or horizontal overflow.
- Speech API automation uses deterministic browser doubles; it does not verify audible installed voices, physical microphone input, or the browser provider's real recognition accuracy. Those capabilities vary by device and service. Native course review remains pending.

### Verified publication

Release commit [`5c2b228`](https://github.com/vineeth-pydi/DailyLingo/commit/5c2b228c93469491ca22612d559e316e64bc30fb) passed the [GitHub Pages validation and deployment workflow](https://github.com/vineeth-pydi/DailyLingo/actions/runs/37857939396) on 2026-10-08. GitHub reported success for that exact commit.

The published [DailyLingo app](https://vineeth-pydi.github.io/DailyLingo/#speaking) passed the same full learning regression and guided-speaking browser checks described above. All 15 fetched runtime assets matched the tested build exactly by SHA256, including the new audio and word-feedback modules, service worker, and generated icons. Local source line endings were normalized to match the committed/Linux build before byte comparison. This verifies publication and UI behavior; controlled speech-provider tests do not establish physical microphone or recognition accuracy.

## Historical DailyLingo update — v0.3.0

Release scope: DailyLingo branding; daily next-step guidance and draft-first lesson resumption; source-language choice on Home; phrase search and a due-review filter; readable responsive interface improvements; validated lesson recovery; speaking lifecycle fixes; clean static packaging; and app-scoped offline caches. The five original starter courses remain community alpha content awaiting independent language review.

Original FreeLingo storage IDs and backup formats are preserved. Existing progress stays available on the same browser and origin. Old `/FreeLingo/` installed shortcuts may need replacing with an installation from `/DailyLingo/`. An online first load at the new address establishes its offline cache.

Current release checks and publication evidence are recorded below as they complete. Historical validation and publication records for v0.1.0 and v0.2.0 follow separately; they do not verify this release.

### Current release validation

- Syntax checks and all 37 automated tests passed. Coverage includes learning, valid and malformed drafts, review lifecycle persistence, keyboard focus, recording/transcription races, clean builds, and scope-safe offline caches.
- All 20 target/prompt-language pairs across six lessons and three deterministic exercise patterns pass content and learning checks.
- Browser checks completed all 12 activities in each of the five languages at 100%, verified six saved reviews and progress after reload, and checked seven screens at five viewport sizes (35 combinations) with no horizontal overflow.
- Phrase search/filtering, draft-first resumption, review reload without duplicate counts, progress export/import, rejected malformed backups, and offline reload/lesson start passed in installed Microsoft Edge. Reduced-motion mode had no JavaScript page errors. Screenshots were inspected on desktop and at 375px.
- Real microphone capture, installed native voice output, and independent native-speaker course review remain device/content checks; speech lifecycle tests use browser mocks.
- Published repository: [vineeth-pydi/DailyLingo](https://github.com/vineeth-pydi/DailyLingo). The original repository was renamed in place, preserving its ID and commit history.
- Published app: [DailyLingo](https://vineeth-pydi.github.io/DailyLingo/).

### Verified publication

Release commit [`9ebb38e`](https://github.com/vineeth-pydi/DailyLingo/commit/9ebb38eecbc56849e216e19a2594299319a50b55) passed the [GitHub Pages build and deployment](https://github.com/vineeth-pydi/DailyLingo/actions/runs/37854413596) on 2026-10-08. GitHub reported the workflow completed successfully for that exact commit.

The same browser journeys passed against the published `/DailyLingo/` address: complete lessons in all five languages, 35 route/viewport combinations, saved progress, phrase search/filtering, backup round trips, and offline reload/lesson start. Eight fetched runtime files (HTML, CSS, app/core/drafts/speech modules, service worker, and manifest) matched the tested local build by SHA256. These checks confirm the published release; historical records below remain separate.

## Historical speech update — v0.2.0

The Speaking studio now covers all five languages and existing lesson topics. It adds selectable browser voices, normal/slow playback, text hide/reveal, local 30-second recording with playback/download/deletion, and opt-in browser transcription. The word check is not a pronunciation score. The app requires no learner subscription, account, or paid API.

The static build completed using bundled Node.js v24.19.0. Microphone recording and transcription have not been exercised on physical devices; availability depends on browser permissions, speech services, installed voices, and language. No new local test run was requested for this update. The existing Pages workflow runs its checks during publication.

Candidate speech datasets, their publisher licenses/download conditions, and the next implementation phases are documented in [SPEECH_RESOURCES.md](SPEECH_RESOURCES.md). No third-party corpus or model has been downloaded, bundled, or trained. The validation record below describes the original v0.1.0 release.

## Historical v0.1.0 local readiness

- v0.1.0 community alpha built as a responsive, installable static web app.
- Five languages; 30 lessons; 180 phrase forms; recognition, arrangement, typed recall, and spaced reviews.
- MIT license, README, contribution/content guides, code of conduct, security policy, issue templates, and Pages workflow prepared.
- Source committed on local branch `main`.
- Static output is in ignored `dist/`; no secrets, learner backups, or preview artifacts are included in Git.

## Historical v0.1.0 validation

- JavaScript syntax checks passed.
- Nine automated tests passed using Node.js v24.19.0. CI is configured for Node.js 22.
- Tests cover content completeness, exercise validity, answer normalization, review intervals/retries, language separation, lesson completion, backup validation/round-trip, calendar streaks, and static/PWA assets.
- Desktop walkthrough completed a Spanish lesson through all three activity types, including incorrect and hinted answers.
- Closing and reloading a partially completed lesson preserved the draft and resumed at the next activity.
- Progress import restored preferences and a due review; completing that review rescheduled it correctly.
- Export invoked the browser download successfully, although the browser automation's download-capture event timed out, so its saved file path was not verified.
- Phone layout checked at 390 × 844; Arabic content has RTL direction; Mandarin displays simplified characters and Pinyin.
- The local preview server was stopped, then the app reloaded successfully from its offline cache. The five-course catalog and Mandarin lesson still worked. No browser console errors were reported for that check.
- The preview server was stopped after verification. Start again with `npm run dev` using Node.js 22+.

## Historical v0.1.0 publication

Public repository: [vineeth-pydi/FreeLingo](https://github.com/vineeth-pydi/FreeLingo).

Live app: [vineeth-pydi.github.io/FreeLingo](https://vineeth-pydi.github.io/FreeLingo/).

The public repository was created under the confirmed owner, source was pushed to `main`, and GitHub Pages was configured for workflow builds. The owner completed GitHub's credential authorization. Credentials are stored by Git Credential Manager, not in project files or source history.

The initial [build and deployment](https://github.com/vineeth-pydi/FreeLingo/actions/runs/37845084544) completed successfully for commit `88e8d0421f99d8290543c4424e28d1a38c454118`. The deployed site was opened at its public Pages URL and rendered the learning dashboard correctly. Private vulnerability reporting is enabled. Later source pushes run the same checks and deployment workflow.

## Release limitations

Independent native-speaker review, full beginner curricula, recorded audio, a specialist accessibility audit, spoken Arabic dialects, and optional cross-device sync remain roadmap work. Browser voice availability and offline audio depend on the device. Current courses are phrase practice, not certified proficiency instruction.
