# Speech resources and a subscription-free roadmap

Researched 2026-10-08. These are candidate resources, not bundled assets. The app currently uses browser voices, local recording, and optional browser transcription. No dataset, speech model, or hosted inference service has been downloaded or integrated.

## Datasets

| Dataset and primary source | Languages relevant to FreeLingo | License shown by publisher | Recommended use and constraints |
| --- | --- | --- | --- |
| [Mozilla Common Voice](https://mozilladatacollective.com/datasets) · [collection source on GitHub](https://github.com/common-voice/common-voice) | Check English, Spanish, Mandarin (`zh-CN`), Hindi, and Arabic locale releases individually | Common Voice releases generally CC0-1.0; other Data Collective datasets have different licenses | Diverse voices for recognition evaluation or fine-tuning. Use the release's datasheet, validated clips, and download conditions. Current Common Voice distribution is through Mozilla Data Collective, not necessarily old Hugging Face mirrors. Dataset releases can require an account. |
| [Google FLEURS on Hugging Face](https://huggingface.co/datasets/google/fleurs) | `en_us`, `es_419`, `cmn_hans_cn`, `hi_in`, `ar_eg` | CC BY 4.0 | A useful first multilingual ASR benchmark. Approximately 12 hours per language across 102 languages. Keep test data out of training. Arabic's `ar_eg` config is a locale identifier; review actual recordings with an MSA specialist before using them as course reference audio. |
| [LibriSpeech on Hugging Face](https://huggingface.co/datasets/openslr/librispeech_asr) · [OpenSLR original](https://www.openslr.org/12/) | English | CC BY 4.0 | About 1,000 hours of transcribed audiobook speech. Recognition evaluation, not an everyday beginner curriculum or a set of learner pronunciation labels. |
| [AISHELL-3 / OpenSLR 93](https://www.openslr.org/93/) | Mandarin | Apache 2.0 | About 85 hours with character and Pinyin transcripts; designed for multi-speaker TTS. Preserve applicable notices. Review tones and naturalness before producing course audio. |
| [AI4Bharat IndicVoices](https://huggingface.co/datasets/ai4bharat/IndicVoices) | Hindi among 22 Indian languages | CC BY 4.0 | Natural speech for recognition. Hugging Face access is gated: publisher requires login and acceptance of contact-sharing conditions. Training data is much larger than an app download; use a small research subset. |
| [AI4Bharat IndicVoices-R](https://huggingface.co/datasets/ai4bharat/indicvoices_r) | Hindi among 22 Indian languages | CC BY 4.0 | Restored speech intended for TTS; 1,704 hours across the collection. Also gated. Restoration can introduce artifacts, so use native review for teaching audio. |
| [Chilean Spanish / OpenSLR 71](https://www.openslr.org/71/) | Chilean Spanish | CC BY-SA 4.0 | Volunteer recordings intended for TTS. Label regional pronunciation and keep attribution and share-alike terms with adapted audio. Do not relicense third-party recordings as MIT. |

These publisher license labels are a starting point. Pin the selected release and retain its actual license and terms before redistribution. Publicly visible files, free downloads, open code, and redistributable audio are separate properties. Do not treat a repository's software license as the dataset license.

### Resources with restrictions

- [ST-CMDS / OpenSLR 38](https://www.openslr.org/38/) lists CC BY-NC-ND 4.0. Noncommercial and no-derivatives conditions make it unsuitable as the default corpus for a broadly reusable open source product.
- [L2-ARCTIC](https://psi.engr.tamu.edu/l2-arctic-corpus/) is an English learner corpus with pronunciation annotations, distributed under CC BY-NC 4.0 with a download form. Its noncommercial restriction makes it unsuitable as our default corpus. Native read-speech datasets above do not supply reliable learner error labels for all five languages.

## Models and runtime tools (not datasets)

- [Whisper](https://github.com/openai/whisper): multilingual recognition; publisher releases code and model weights under MIT. It can run locally without a paid API. Transcribing correctly does **not** establish correct pronunciation. Check short phrases, silence hallucinations, accents, noise, and language differences before integration.
- [Transformers.js](https://huggingface.co/docs/transformers.js/index): candidate browser runtime for an ONNX speech model. An optional downloadable model can let learners transcribe on their own device. Runtime, model, conversion, and training-data licenses need separate review; mobile memory, performance, download size, and offline caching need evaluation. No runtime dependency is installed yet.
- TTS engines and voices must be checked separately. An open engine does not guarantee that every downloadable voice is permissively licensed, supports all five languages, or sounds suitable for beginners.

## Build order

### Phase 1 — implemented in v0.2.0

- Speaking studio for all 180 phrase forms, grouped by the existing six lesson topics.
- Normal and slow pronunciation playback, selectable voices, and an on-device-only filter enabled by default.
- Hide/reveal text for listening practice, script direction, and existing reading aids.
- Record up to 30 seconds; listen back, download, or delete the recording. Audio remains in tab memory and is discarded on navigation. Microphone tracks stop on navigation, hidden tab, errors, or the time limit.
- Optional browser transcription with an explicit disclosure/opt-in because some browsers use remote recognition. Compare words only; no accent or proficiency score.
- No learner subscription, account, paid inference API, tracker, or server audio store.

### Phase 2 — native reference recordings

Collect or commission consenting native speakers reading the existing phrases and accepted variants. A research corpus rarely contains exactly the course phrase in the right register. Start with 36 phrases per language, normal and slow variants where natural. Use a permissive release agreement, language/region labels, independent review, and a separate audio attribution manifest.

For every shipped clip retain: phrase ID, exact transcript, language/variety, speaker consent reference, original source/release, author credit, license URL, changes made, duration, sample rate, checksum, and reviewer. Do not commit private consent forms or identifying speaker records. Add clip attribution in the app and preserve separate audio licenses alongside the MIT code license.

### Phase 3 — optional local recognition

Prototype a small multilingual Whisper model in a worker. Download only after a learner explicitly selects local speech recognition and sees the download size. Show loading/progress/cancel, keep microphone audio on device, provide recording fallback, and cache model files separately from the essential PWA shell. Pin model artifacts and retain notices. Benchmark FLEURS splits and consented learner recordings on representative desktop/phone hardware before choosing the model.

### Phase 4 — pronunciation feedback

Use qualified language reviewers to build consented learner evaluation sets. Separate word recognition from phoneme alignment, vowel length, Mandarin tones, rhythm, stress, and dialect differences. Compare feedback with human judgments and publish limitations by language/device. Avoid opaque numerical accent scores or making speech recognition a mandatory lesson gate.

### Phase 5 — fuller free courses

Expand contextual dialogues, script foundations, grammar, listening comprehension, and curriculum progression with native review. Preserve an offline non-microphone route through every lesson. Cross-device sync and hosted conversation AI remain optional future features with separate funding and privacy decisions.

## Cost model

The learner should never need a subscription, payment, API key, or AI account for core learning. Keep the core app static and use local computation and packaged recordings. Open source does not eliminate developer costs: hosting quotas, storage/bandwidth, language review, and any future training or server inference still need funding. Prefer optional donations/grants and publish operating costs rather than introducing mandatory paid features.

## Choosing a coding assistant

Astra is not a runtime requirement for FreeLingo and is not needed for this first speech feature set. Continue with the current coding model for implementation and integration. Luna suits small, clearly specified changes such as copy, CSS, a bounded lesson addition, or a small bug fix; use Sol for broader technical integration. Astra can help with ambiguous architecture or difficult research, but it cannot replace native-language review or a speech evaluation set. This is a project recommendation based on [official OpenAI model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection), not a measured comparison on this repository.
