# Changelog

## 0.4.1 — 2026-10-08

- Replaced Settings' sun-shaped icon with a gear in the sidebar and header.
- Added a separate sun button to switch between light and dark modes, with keyboard access and labels that describe the next action.
- The first visit follows the system theme; an explicit choice persists on this device and across tabs. Theme changes preserve active speaking and learning sessions.
- Dark styling covers learning views, dialogs, forms, audio controls, and feedback. Theme initialization is cached with the offline app.

## 0.4.0 — 2026-10-08

- Guided Listen → Speak and check → Review practice, with explicit browser speech-provider opt-in.
- Word-by-word comparison highlights recognized, missing, and different words; each word offers slow replay and a practice prompt. Extra recognized words are shown separately.
- Speaker controls for phrases, meanings, answer options, arranged words, typed answers, hints, and feedback throughout the learning views.
- Script-aware word listening and comparison across all five courses, including Mandarin without spaces.
- Local recording remains available for comparison by ear. Word checks describe recognition results without grading accent, individual sounds, or Mandarin tones.
- Speech capture recovers from provider errors and unfinished checks; navigation and backgrounding stop capture and playback. Screen-reader status announcements persist through studio updates.
- New audio and feedback modules are included in the offline app cache; learning progress and backup formats remain compatible.

## 0.3.0 — 2026-10-08

- Renamed the app and repository to DailyLingo with updated metadata, install name, source links, and documentation.
- Clear daily next-step guidance, draft-first lesson resumption, and a source-language control on Home.
- Searchable phrase collection with a due-review filter, larger typography, clearer selected states, and comfortable touch targets.
- Every lesson phrase now receives a production question; successful early practice keeps its scheduled review date.
- Review answers save as they are checked and survive refresh, backgrounding, and closing without duplicate counts.
- Improved script-aware matching, Mandarin word banks, backup validation, lesson-draft validation, and speaking lifecycle handling.
- Clean static builds and app-scoped offline caches; other Pages apps and legacy installed paths keep their caches.
- Original FreeLingo progress keys and backup format remain compatible.

## 0.2.0 — 2026-10-08

- Speaking studio across all five languages and six lesson topics.
- Normal/slow pronunciation playback, selectable voices, and on-device voice filtering.
- Local 30-second recording with playback, download, deletion, and microphone lifecycle cleanup.
- Explicit opt-in browser transcription and recognized-word feedback without pronunciation scoring.
- Listening practice with hidden/revealed phrases and language-specific pronunciation tips.
- Speech dataset/license research and a roadmap for local speech models and native recordings.

## 0.1.0 — 2026-10-08

- Initial community alpha: English, Spanish, Mandarin, Hindi, and Modern Standard Arabic starter courses.
- Recognition, word arrangement, and typed recall activities.
- Device-local learning state, resumable lessons, review scheduling, activity views, and progress backups.
- Optional browser audio and reading aids.
- Responsive PWA, RTL phrase support, generated app icons, and offline asset cache.
- MIT license, contribution/content guides, and GitHub Pages workflow.
