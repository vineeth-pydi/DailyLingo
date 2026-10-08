# FreeLingo launch status

Updated: 2026-10-08 (America/Chicago).

## Ready locally

- v0.1.0 community alpha built as a responsive, installable static web app.
- Five languages; 30 lessons; 180 phrase forms; recognition, arrangement, typed recall, and spaced reviews.
- MIT license, README, contribution/content guides, code of conduct, security policy, issue templates, and Pages workflow prepared.
- Source committed on local branch `main`.
- Static output is in ignored `dist/`; no secrets, learner backups, or preview artifacts are included in Git.

## Validation completed

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

## Published

Public repository: [vineeth-pydi/FreeLingo](https://github.com/vineeth-pydi/FreeLingo).

Live app: [vineeth-pydi.github.io/FreeLingo](https://vineeth-pydi.github.io/FreeLingo/).

The public repository was created under the confirmed owner, source was pushed to `main`, and GitHub Pages was configured for workflow builds. The owner completed GitHub's credential authorization. Credentials are stored by Git Credential Manager, not in project files or source history.

The initial [build and deployment](https://github.com/vineeth-pydi/FreeLingo/actions/runs/37845084544) completed successfully for commit `88e8d0421f99d8290543c4424e28d1a38c454118`. The deployed site was opened at its public Pages URL and rendered the learning dashboard correctly. Private vulnerability reporting is enabled. Later source pushes run the same checks and deployment workflow.

## Release limitations

Independent native-speaker review, full beginner curricula, recorded audio, a specialist accessibility audit, spoken Arabic dialects, and optional cross-device sync remain roadmap work. Browser voice availability and offline audio depend on the device. Current courses are phrase practice, not certified proficiency instruction.
