# FreeLingo rebuild plan

## Open source launch update — 2026-10-08

**Launch target:** public GitHub repository `vineeth-pydi/FreeLingo`, MIT license, and GitHub Pages website. The app is a PWA, so the same codebase serves the website and an installable phone/desktop app. Native store distribution is a later milestone.

**v0.1.0 implemented scope:** a dependency-free static application with five starter courses, six lessons and 36 phrases per course; 12 activities per lesson; recognition, sentence arrangement, and typed recall; optional browser speech and reading aids; source-language prompt selection; device-local progress and lesson drafts; scheduled reviews; daily goals/activity views; JSON backup import/export; progress deletion; responsive/RTL layouts; offline caching; and installation metadata/icons.

**Release boundaries:** this is a community alpha. It has no accounts, backend, paid API requirement, microphone capture, certified assessment, complete A1 curriculum, content editor, or native recorded audio. Course text needs independent native-speaker review. Arabic is explicitly MSA only in this release; a dialect course remains a separate future decision. The wider design below is the long-term roadmap, not a statement that every feature exists in v0.1.0.

### GitHub and website launch sequence

1. Finish the app and update learner-facing release limitations.
2. Run script checks, content/scheduling/persistence tests, static packaging checks, and desktop/mobile browser walkthroughs.
3. Initialize the source repository on `main`; exclude build output, credentials, logs, and learner exports.
4. Publish a public repository under the confirmed owner, `vineeth-pydi`. Commit code, original course content, license, README, contribution/content guides, security policy, issue templates, and workflow.
5. Configure Pages to use GitHub Actions. Pull requests check the build; pushes to `main` deploy `dist/` through the Pages artifact workflow.
6. Confirm the deployment's returned URL. The expected project URL is `https://vineeth-pydi.github.io/FreeLingo/`, but it is not a verified live URL until deployment succeeds.
7. Enable private vulnerability reporting, create a reviewed release/tag, and invite a small feedback cohort.

### Open source governance

- Code, documentation, icons, and original course text use MIT. Audio/media contributions need explicit redistribution rights and provenance.
- Maintainers review pull requests. Content changes require variety/register context and an independent qualified reviewer before review status is promoted.
- Prefer small contributions: phrase corrections, approved alternatives, accessibility fixes, and meaningful learning/persistence tests.
- Keep stable phrase IDs so corrections do not destroy learner history.
- Keep tracking and mandatory accounts out of the default learning experience. Document privacy and operational costs before adding optional sync.

### Milestones after launch

| Milestone | Work | Exit criteria |
|---|---|---|
| v0.1 community alpha | Current static PWA and GitHub Pages publication | Five courses work, progress/reviews persist, backup round-trip works, deployment verified |
| v0.2 reviewed foundations | Native review, approved variants, script introduction, recorded audio pilot | Each launch language has documented author/reviewer sign-off and rights-cleared audio samples |
| v0.3 coherent beginner curriculum | Contextual dialogues, grammar sequence, delayed checks, richer feedback | Learner pilots show transfer beyond memorized phrases; no proficiency certification claims |
| v0.4 optional portability | Optional sync and identity, versioned content/editor | Privacy design, account export/delete, conflict handling, and version migration verified |
| v1.0 broader release | Complete reviewed beginner paths, operational/support readiness | Curriculum outcomes validated, accessibility reviewed, and support/maintenance capacity established |

### Revised implementation architecture

The alpha uses browser-native JavaScript modules, HTML/CSS, local storage, and a service worker. Node.js 22+ performs dependency-free builds and automated checks. No package installation, runtime service, database, secret, or subscription is required. All asset paths are relative for GitHub project Pages. Deployment packages only `dist/`; the build generates raster PWA icons and hashes assets to version offline caches.

The relational API/content-service architecture later in this document becomes relevant only when optional accounts, editorial publishing, or cross-device sync are introduced. Preserve the static guest experience while adding those capabilities.

### Launch evidence and limits

Automated checks cover five-language completeness, lesson composition, script-aware matching, scheduling, language isolation, immutable progress updates, backup validation, local-day streaks, and packaged offline assets. Browser walkthrough results and GitHub deployment status should be recorded in `LAUNCH_STATUS.md`. Accessibility is a design target; a full specialist audit and independent language review remain future work.

GitHub workflow reference: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Purpose

Rebuild FreeLingo as a practical, mobile-first language teaching tool that takes a beginner from first phrases to useful everyday conversations. The first release will offer five target languages: English, Mandarin Chinese, Hindi, Spanish, and Arabic. Lessons should teach communication, listening, reading, and writing in a connected sequence rather than reward isolated word matching.

This is a greenfield plan because the workspace contained no source files or product documentation at planning time. The existing name, FreeLingo, is treated as the working product name.

## Language selection

The five languages are selected by total speakers (first-language plus additional-language speakers), using Ethnologue's 2025 ranking as summarized in [this 2025 ranking](https://www.visualcapitalist.com/ranked-the-worlds-most-spoken-languages-in-2025/): English, Mandarin Chinese, Hindi, Spanish, and Standard Arabic. This selection maximizes broad speaker coverage; it is not a claim that the languages are equally easy to teach or that one standardized variety represents every speaker. Rankings shift with source, date, and the treatment of language varieties. Arabic is particularly sensitive to those definitions.

## Product outcomes

1. A learner can create an account, choose their interface language, choose a target language, and get a short placement or beginner path.
2. A learner can complete a 5–10 minute lesson with audio, useful phrases, explanations, and active recall.
3. A learner can review items at an appropriate interval and see what is becoming strong or needs practice.
4. A learner can practice short guided exchanges and receive understandable, actionable feedback.
5. A learner can change study pace and accessibility preferences without losing progress.
6. A content editor can add and revise lessons without shipping a new application build.

## Learner and scope assumptions

### Initial audience

- Adult and teen self-directed beginners, with English as the initial interface language.
- Learners studying for travel, family/community connection, and everyday conversation.
- Mobile web first, with responsive desktop support and installable PWA behavior where supported.

### First release includes

- Account creation and guest exploration.
- One beginner course per language, organized around practical situations.
- Audio-led pronunciation and listening activities.
- Vocabulary and sentence practice with spaced review.
- Script and orthography support from the beginning where relevant.
- Progress, reminders controlled by the learner, and data export/delete controls.
- A modest staff content editor and review workflow.

### Explicitly out of the first release

- Open social feeds, public profiles, tutoring marketplace, live classes, broad gamification economy, unrestricted generative chat, certificates, and dozens of dialect/course variants.
- These may be considered after learning efficacy, content quality, and retention are demonstrated.

## Language and curriculum decisions

All courses should share a common pedagogical spine while allowing each language team to make language-specific choices. Do not force equivalent word-for-word translations where usage differs.

| Course | First-release teaching variety and script | Early-course requirements |
|---|---|---|
| English | Internationally understandable contemporary English; audio should include more than one accent over time | Listening to varied accents, spelling conventions labeled where variants differ, stress and reductions, everyday register |
| Mandarin Chinese | Standard Mandarin (Putonghua); simplified characters by default, with optional traditional-character recognition setting | Pinyin with tone marks, tones and tone changes, characters introduced with meaning and stroke-aware reading practice, measure words and aspect |
| Hindi | Contemporary Standard Hindi; Devanagari from the first unit, transliteration available as a temporary aid | Devanagari decoding, gender/agreement, postpositions, respectful forms, natural word order; distinguish Hindi from Urdu rather than implying script equivalence |
| Spanish | Broadly useful standard Spanish with regional labels on vocabulary/audio; initial recordings from at least Latin American and Spain speakers | Pronunciation, gender/agreement, tú/usted and regional forms, ser/estar, common verb forms, listening variation |
| Arabic | Modern Standard Arabic for literacy/formal comprehension, paired with a clearly labeled spoken variety in dialogue; launch with Egyptian Arabic as the first spoken variety only if reviewed by regional specialists | Right-to-left interface and text, Arabic script and diacritics policy, MSA vs dialect distinction, sound inventory, agreement and root patterns; never present MSA as the universal home speech variety |

Arabic is the largest scope risk. Before production, conduct learner research to determine whether the launch course should pair MSA with Egyptian Arabic or select another dialect for the target market. Keep dialect-specific audio, lexicon, and grammar metadata separable so the decision does not require a data-model rewrite.

## Learning design

### Course structure

- **Units:** practical themes such as introductions, directions, food, daily routines, health, and making plans.
- **Lessons:** one communicative goal, 5–10 minutes, typically 6–12 new items, with cumulative reuse.
- **Activities:** listen and choose, match meaning, build a sentence, type or select a response, speak and compare, short dialogue comprehension, and scheduled recall.
- **Checks:** low-stakes retrieval throughout; short unit checks that revisit both recent and older material.
- **Explanations:** concise rule, example, literal gloss where useful, natural translation, audio, and cultural/register note when needed.

Teach new forms in a comprehensible context, then require learners to retrieve and use them. Use spaced repetition for durable recall, but avoid making the review queue dominate new communicative practice. Show why an answer is incorrect and offer a retry with a hint.

### Feedback policy

- Objective answers can be marked immediately.
- Typed answers should accept approved orthographic variants and report what differed.
- Speech recognition should be an optional practice aid, never the only proof of learning. Accent variation, recording quality, and model confidence must be visible in the feedback design.
- When speech recognition is unavailable or uncertain, offer self-assessment, replay, and a native recording model.
- Avoid grading dialect or accent as “wrong” where the learner produced an understandable valid variant.

## Core user journeys

1. **Start:** choose interface language, target language, reason to learn, daily study preference; preview the first lesson before creating an account.
2. **Placement:** optional short adaptive check; explain that it estimates a starting point and allow beginner reset.
3. **Daily study:** home shows resume lesson, due reviews, and a small next step; learner can skip reminders and streak pressure.
4. **Lesson:** listen, notice, practice, produce, get feedback, then see a short recap and saved review items.
5. **Review:** queue mixes due words and sentences; learner marks confidence through performance, not a self-rating alone.
6. **Progress:** show completed communicative goals, listening/speaking/reading/writing practice, recent consistency, and next recommended action.
7. **Settings:** manage language, script/transliteration support, playback speed, captions, reminders, privacy/export/delete, and accessibility preferences.

## Information architecture and key screens

- Public landing/course catalog
- Sign-in and guest path
- Onboarding and placement
- Home / continue learning
- Course map and unit page
- Lesson player
- Review queue
- Guided conversation practice
- Progress dashboard
- Settings and account/data controls
- Content editor: course list, lesson editor, audio/asset association, review queue, preview, publish/version history

## Technical design

The exact stack should be chosen after inspecting deployment and hosting constraints. For a clean start, use a TypeScript web stack with a responsive component system, a relational database, object storage for audio, and a separately versioned content model. Keep the learner experience usable on low-bandwidth mobile connections.

### Suggested system boundaries

1. **Client application:** lesson rendering, audio playback, accessible interaction, offline cache for the current unit and review queue, local event buffering.
2. **Application API:** authentication, course enrollment, progress writes, review scheduling, content delivery, account privacy operations.
3. **Content service/model:** immutable published lesson versions and draft editing; language-specific fields for script, transliteration, variety/register, and audio speaker metadata.
4. **Media storage/CDN:** compressed audio with transcripts, attribution/licensing, speaker/variety metadata, and cache headers.
5. **Analytics:** privacy-minimized learning events with retention limits and opt-out where practical.

### Initial data entities

- `User`, `Preference`, `Course`, `CourseVersion`, `Unit`, `Lesson`, `Activity`
- `Lexeme` (lemma, part of speech, sense, language variety, script form, transliteration, audio reference)
- `Sentence` (surface form, token alignment where available, literal gloss, natural translation, register/variety)
- `Attempt` (activity, response category, correctness, timestamp, optional confidence)
- `ReviewItem` (learner, content reference, due time, interval, ease/state)
- `Progress` (learner, versioned lesson state, completed goals)
- `MediaAsset` (URI, transcript, speaker, variety, license, checksums)
- `ContentReview` and `PublishedVersion` (reviewer, status, change history)

Use stable IDs across course versions. Store the version a learner completed so editorial updates do not silently rewrite historical progress. Store only the minimum response/audio data needed; default to not retaining raw learner voice recordings.

### Offline and sync behavior

- Cache the current course unit, its media, and due review items when the learner opts in or connectivity is poor.
- Queue lesson attempts locally with idempotency keys; reconcile progress on reconnect.
- Resolve conflicts by preserving attempt events and recomputing derived progress, rather than overwriting the latest state blindly.
- Clearly label features that require a connection, including any speech service.

## Content production and quality controls

1. Define learning objectives and scope for each course.
2. Draft by a language educator with native or near-native command and teaching experience.
3. Review naturalness, grammar, register, cultural framing, transliteration, and answer variants with an independent reviewer.
4. Record audio with consent and usage rights; include transcript, speaker variety, and recording provenance.
5. Test every accepted answer and audio/text alignment in the editor preview.
6. Pilot lessons with learners and revise confusing instructions or unnatural examples.
7. Publish immutable course versions, with a rollback path.

Require at least two qualified reviewers for launch-critical content, including one native speaker familiar with the target variety. Use a shared content rubric; language specialists retain final authority over their course.

## Accessibility, privacy, and safety

- Target WCAG 2.2 AA for core flows: keyboard access, screen-reader labels, contrast, focus order, reduced motion, scalable text, and non-color cues.
- Support right-to-left layout as a first-class direction, including mixed-script sentences and punctuation.
- Provide captions/transcripts, replay controls, adjustable playback speed, and visual alternatives to audio-only tasks.
- Provide alternatives to speaking aloud and avoid requiring microphone permission during onboarding.
- Explain microphone processing and retention before recording; default to ephemeral processing and do not store raw audio unless a learner explicitly saves it for personal practice.
- Provide account export and deletion, a clear privacy notice, and age-appropriate defaults. Set the minimum age and any parental-consent requirements after a jurisdictional review.
- Avoid manipulative streak loss, shame language, or leaderboards as default mechanics.

## Measurement plan

Use learning and product signals together. Do not use time-in-app alone as a success measure.

### Learning measures

- Delayed recall accuracy at 1-, 7-, and 30-day intervals for sampled vocabulary/sentences.
- Unit-check performance and transfer to unseen but structurally related examples.
- Listening comprehension and productive response completion by skill.
- Learner-reported usefulness and confidence, clearly separated from demonstrated performance.

### Product measures

- Onboarding-to-first-lesson completion.
- Lesson completion and return within 7/30 days.
- Review completion rate and overdue queue size.
- Drop-off by activity type, device, and connection quality.
- Content issue reports and correction time.

Collect only events needed to answer defined product questions, aggregate where possible, and avoid collecting sensitive free-text or audio by default.

## Delivery plan

### Phase 0 — Product discovery and technical baseline (1–2 weeks)

- Inspect target deployment, hosting, existing brand assets, and user research if available.
- Confirm primary learner market, interface language, age range, device priority, and Arabic dialect decision.
- Write product requirements, accessibility baseline, privacy data map, and initial content rubric.
- Choose stack and deployment approach based on operational constraints.

**Exit:** approved scope, language varieties, architecture sketch, and measurable pilot outcomes.

### Phase 1 — Foundation and vertical slice (2–3 weeks)

- Establish app shell, design tokens, routing, authentication or guest persistence, database schema, and CI/deployment preview.
- Implement course catalog and one complete sample lesson, including audio, answer checking, progress persistence, and review scheduling.
- Build a minimal content authoring flow and versioned lesson format.

**Exit:** one learner can complete and resume a lesson across sessions; an editor can draft, preview, and publish it.

### Phase 2 — Learning engine and first two courses (3–5 weeks)

- Implement activity types, attempts, spaced review, unit checks, progress, and offline queue behavior.
- Produce and review English and Spanish beginner pilots.
- Run moderated usability sessions with target learners and fix the highest-friction issues.

**Exit:** end-to-end pilot with lesson sequence, review loop, accessibility check, and initial learning baseline.

### Phase 3 — Script-capable courses (4–6 weeks)

- Add shared script handling, transliteration display controls, token-level alignment where useful, fonts, input support, and mixed direction testing.
- Produce Mandarin and Hindi pilot courses; validate with specialist reviewers.
- Test on low-end mobile devices and unreliable connections.

**Exit:** script-based lessons render, play, accept expected answers, and remain accessible on target devices.

### Phase 4 — Arabic, polish, and limited launch (4–6 weeks)

- Finalize dialect scope with learner research and qualified reviewers.
- Add Arabic script direction, MSA/dialect labels, chosen spoken variety, audio, and mixed-text QA.
- Complete privacy/account controls, analytics review, support/contact path, and operational monitoring.
- Invite a limited cohort; review learning outcomes, defects, and course feedback weekly.

**Exit:** no critical accessibility, privacy, content correctness, or data-loss issue; pilot thresholds met or a specific remediation plan approved.

### Phase 5 — Expand based on evidence (ongoing)

- Improve lessons from learner errors and delayed-recall outcomes.
- Expand each course toward the next proficiency band only when content review capacity is ready.
- Consider additional accents/dialects, conversation practice, native apps, and new languages based on demand and quality capacity.

Estimates assume a small dedicated team and parallel content production. Re-estimate after Phase 0; language review and audio recording are likely to set the schedule more than frontend implementation.

## Team and ownership

- Product lead: scope, learner research, outcomes, prioritization.
- Design/research: onboarding, lesson interactions, accessibility, usability studies.
- Engineering: client, API/data, content pipeline, deployment, observability.
- Learning design lead: curriculum model, assessment, review scheduling.
- Language specialists: course authoring and final review for each selected variety.
- Audio producer: casting, recording, licensing, editing, quality control.
- Privacy/accessibility reviewers: review high-impact flows and release readiness.

One person may cover multiple roles in a small team, but language-specific review should not be replaced by general QA.

## Launch acceptance checklist

- A new learner can reach the first meaningful lesson without account friction.
- Lessons save and resume correctly, including reconnect after offline practice.
- Reviews schedule consistently and explain the learner's next action.
- Every launch item has an approved answer set, natural audio, transcript, license, and language/variety metadata.
- RTL and mixed-direction Arabic content pass visual and assistive-technology checks.
- Screen reader, keyboard, contrast, zoom, captions, and reduced-motion checks pass on core flows.
- Learner can control notifications, export their data, delete their account, and understand microphone behavior.
- No critical data-loss, content correctness, or privacy defects remain.
- Pilot reporting includes delayed learning evidence, not just sign-ups or streaks.

## Main risks and mitigations

| Risk | Effect | Mitigation |
|---|---|---|
| Five languages create uneven content quality | Learners receive inconsistent courses | Shared rubric and platform; staged rollout; language specialist sign-off |
| Arabic variety is underspecified | Learners hear formal language where they need speech, or vice versa | Make MSA/dialect distinction explicit; research and name the dialect; keep variants modeled separately |
| Transliteration becomes a crutch | Learners fail to acquire scripts | Use it as an optional scaffold that can fade; teach script from the first unit |
| Speech scoring is biased or unreliable | Learners receive misleading pronunciation feedback | Make it optional, confidence-aware, and never the sole success path; use human-reviewed reference audio |
| Content operations become a bottleneck | Lessons ship slowly or errors linger | Build editor/review/version flow early; plan paid reviewer capacity and correction SLAs |
| Motivation mechanics overshadow learning | Learners optimize streaks instead of retention | Center recall and communicative goals; keep reminders and competition opt-in |
| Offline sync loses attempts | Learner trust and progress are damaged | Append attempt events with idempotency; test reconnect and conflict paths before pilot |

## Decisions to resolve in discovery

1. Who is the first launch audience and which interface languages should be available at launch?
2. Which Arabic spoken variety best serves that audience, and will it launch alongside MSA?
3. Is the first supported platform responsive web/PWA, native mobile, or both?
4. What learner age range and jurisdictions determine privacy and consent requirements?
5. Which existing brand, domain, infrastructure, or user research can be reused?
6. What budget and reviewer capacity are available for five high-quality curricula and audio libraries?
