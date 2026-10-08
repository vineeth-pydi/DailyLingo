import { concepts, units } from './content.js';
import { audioText, audioButton, handleAudioClick } from './audio-ui.js';
import { findLanguage } from './content.js';
import { compareSpokenWords } from './speech-feedback.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const speakerIcon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></svg>';
const preferenceKey = 'dailylingo-speech-v1';
const legacyPreferenceKey = 'freelingo-speech-v1';
let preferences = { localOnly: true, voices: {} };
try {
  const stored = localStorage.getItem(preferenceKey);
  const legacy = stored === null ? localStorage.getItem(legacyPreferenceKey) : null;
  const saved = JSON.parse(stored ?? legacy);
  if (saved && typeof saved.localOnly === 'boolean') preferences.localOnly = saved.localOnly;
  if (saved?.voices && typeof saved.voices === 'object' && !Array.isArray(saved.voices)) {
    preferences.voices = Object.fromEntries(Object.entries(saved.voices).filter(([, value]) => typeof value === 'string'));
  }
  if (legacy !== null) {
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    localStorage.removeItem(legacyPreferenceKey);
  }
} catch { /* Audio preferences are optional when storage is unavailable. */ }
const savePreferences = () => { try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); localStorage.removeItem(legacyPreferenceKey); } catch { /* Keep session preferences. */ } };
export function resetSpeechPreferences() {
  preferences = { localOnly: true, voices: {} };
  try { localStorage.removeItem(preferenceKey); localStorage.removeItem(legacyPreferenceKey); } catch { /* Reset this session even without storage. */ }
}
const matchingVoices = language => (window.speechSynthesis?.getVoices() ?? [])
  .filter(voice => voice.lang.toLowerCase().split(/[-_]/)[0] === language.id && (!preferences.localOnly || voice.localService))
  .sort((a, b) => Number(b.lang.toLowerCase() === language.locale.toLowerCase()) - Number(a.lang.toLowerCase() === language.locale.toLowerCase()));

export function speakPhrase(item, language, slow = false, notify = () => {}) {
  return speakText(item.forms[language.id], language, slow, notify);
}

export function speakText(text, language, slow = false, notify = () => {}) {
  const synthesis = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  if (!synthesis || typeof Utterance !== 'function') { notify('Pronunciation playback is unavailable in this browser. Try the reading guide.'); return; }
  const voices = matchingVoices(language);
  const voice = voices.find(candidate => candidate.voiceURI === preferences.voices[language.id]) ?? voices[0];
  if (!voice) { notify(`No ${preferences.localOnly ? 'on-device ' : ''}${language.name} voice is available. Open Speaking to choose a voice, or install one in your device settings.`); return; }
  try {
    synthesis.cancel();
    const utterance = new Utterance(String(text));
    utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = slow ? 0.6 : 0.9;
    return new Promise(resolve => {
      utterance.onend = () => resolve(true);
      utterance.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error)) notify('This voice could not play. Try another voice or use the reading guide.'); resolve(false); };
      try { synthesis.speak(utterance); }
      catch { notify('This voice could not play. Try another voice or use the reading guide.'); resolve(false); }
    });
  } catch { notify('This voice could not play. Try another voice or use the reading guide.'); }
}

const guides = {
  en: ['Listen for word stress: one syllable often stands out.', 'Copy the rhythm of the whole phrase, then try each word.', 'English spelling does not always show how a word sounds.'],
  es: ['Keep the five vowel sounds clear and steady.', 'Listen for the stressed syllable; written accents can help locate it.', 'Accent and regional pronunciation vary. Choose the voice you want to practise with.'],
  zh: ['Use Pinyin as a reading aid and listen to the tone of each syllable.', 'Practise tones in the full phrase: tones can change in context.', 'Slow playback helps listening, but may change the natural rhythm.'],
  hi: ['Listen carefully to vowel length and aspirated consonants.', 'Compare dental and retroflex sounds as you learn Devanagari.', 'Romanized reading aids are approximate; return to the script and audio.'],
  ar: ['Practise short and long vowels separately, then in a phrase.', 'Listen for doubled consonants and sounds formed in the throat.', 'These phrases use Modern Standard Arabic; everyday dialects differ.']
};
let activePractice = null;
export function disposeSpeechPractice() { activePractice?.dispose(); activePractice = null; }

export function mountSpeechPractice(root, language, sourceLanguage) {
  disposeSpeechPractice();
  let unitId = units[0].id, index = 0, hidden = false, disposed = false;
  let recorder = null, stream = null, recordingUrl = '', recordingBlob = null;
  let recording = false, stopping = false, requesting = false, recognition = null, recognizing = false, endingRecognition = false, timer, speechTimer, speechEndTimer;
  let status = 'Start by listening to the example. Then speak and check the words the browser hears.', transcript = '', consent = false, wordFeedback = null;
  let captureGeneration = 0;
  // Keep one live region attached while the studio's controls are rerendered.
  const announcement = document.createElement?.('div');
  if (announcement) {
    announcement.className = 'speech-announcement';
    announcement.setAttribute('role', 'status'); announcement.setAttribute('aria-live', 'polite'); announcement.setAttribute('aria-atomic', 'true');
    document.body.append(announcement);
  }
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const Recorder = window.MediaRecorder;
  const canRecord = !!(navigator.mediaDevices?.getUserMedia && typeof Recorder === 'function' && window.isSecureContext);
  const items = () => concepts.filter(item => units.find(unit => unit.id === unitId).ids.includes(item.id));
  const current = () => items()[index];
  const stopTracks = () => { stream?.getTracks().forEach(track => track.stop()); stream = null; };
  const clearRecording = () => { if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = ''; recordingBlob = null; };
  const stopCapture = () => {
    captureGeneration++; requesting = false; clearTimeout(timer); clearTimeout(speechTimer); clearTimeout(speechEndTimer);
    const capture = recorder, transcriber = recognition;
    recorder = null; recognition = null; recording = false; stopping = false; recognizing = false; endingRecognition = false;
    stopTracks();
    try { if (capture && capture.state !== 'inactive') capture.stop(); } catch { /* Tracks are already released. */ }
    try { transcriber?.abort(); } catch { /* Ignore a speech service that already ended. */ }
  };
  const resetPhrase = () => { stopCapture(); clearRecording(); transcript = ''; wordFeedback = null; status = 'Listen to the new phrase, then speak and check.'; window.speechSynthesis?.cancel(); };
  const busy = () => recording || stopping || requesting || recognizing;
  const disabled = condition => condition ? 'disabled' : '';
  const notify = message => { if (!disposed) { status = message; updateStatus(); } };

  function updateStatus() {
    const node = root.querySelector('#speech-status');
    if (node) node.textContent = status;
    if (announcement) announcement.textContent = status;
  }
  function renderFeedback() {
    if (!wordFeedback) return '<div class="word-check-placeholder"><strong>3 · Review and repeat</strong><p>Your word comparison will appear here after you speak. Words to revisit will have their own listen button.</p></div>';
    return `<section class="word-check-results" aria-labelledby="word-check-title"><p class="eyebrow">3 · REVIEW AND REPEAT</p><h3 id="word-check-title">${wordFeedback.kind === 'matched' ? 'The recognized words match' : 'Words to try again'}</h3><p>${escape(wordFeedback.summary)}</p><div class="speech-transcript"><span>The browser heard:</span>${audioText(transcript, language, { label: 'Listen to the recognized text in a synthetic voice', slow: false })}</div><ul class="checked-words">${wordFeedback.words.map(word => `<li class="checked-word ${word.status}"><div class="checked-word-heading"><strong lang="${language.id}" dir="${language.direction}">${escape(word.text)}</strong><span class="word-check-state">${word.status === 'matched' ? 'Heard' : word.status === 'missing' ? 'Not heard' : 'Try again'}</span>${audioButton(word.text, language, { slow: true })}</div>${word.status !== 'matched' ? `<p>${word.heard ? `Heard “${escape(word.heard)}”. ` : 'This word was not recognized. '}Listen to the word slowly, say it on its own, then repeat the full phrase.</p>` : ''}</li>`).join('')}</ul>${wordFeedback.extra.length ? `<p class="field-help">Also heard: <span lang="${language.id}" dir="${language.direction}">${escape(wordFeedback.extra.join(' · '))}</span>. Try only the displayed phrase.</p>` : ''}<p class="field-help">A mismatch can come from speech, background noise, or recognition errors. This check does not assess individual sounds, accent, rhythm, or Mandarin tones.</p><button class="button secondary" data-speech="retry" ${disabled(busy() || !Recognition || !consent || !window.isSecureContext)}>Try the phrase again</button></section>`;
  }
  function render() {
    if (disposed) return;
    const focusedId = root.contains(document.activeElement) ? document.activeElement.id : '';
    const focusedAction = root.contains(document.activeElement) ? document.activeElement.dataset.speech : '';
    const item = current(), voices = matchingVoices(language);
    root.innerHTML = `<section class="page-intro"><p class="eyebrow">FIND YOUR VOICE</p><h1>Listen. Speak. Try again.</h1><p>Listen to ${escape(language.name)}, speak the phrase, and check which words your browser hears.</p></section>
      <div class="speaking-grid"><section class="settings-card speaking-card"><div class="speaking-heading"><h2>Your speaking studio</h2><span class="pill">${index + 1} / ${items().length}</span></div>
      <ol class="speech-steps" aria-label="Speaking practice steps"><li><span>1</span> Listen</li><li><span>2</span> Speak</li><li><span>3</span> Review</li></ol>
      <label class="field-label" for="speaking-unit">Choose a topic</label><select id="speaking-unit" ${disabled(busy())}>${units.map(unit => `<option value="${unit.id}" ${unit.id === unitId ? 'selected' : ''}>${escape(unit.title)}</option>`).join('')}</select>
      <div class="speaking-phrase"><p class="eyebrow">1 · LISTEN IN ${language.name.toUpperCase()}</p>${hidden ? '<h3>Listen first…</h3>' : audioText(item.forms[language.id], language, { textTag: 'h3', className: 'speaking-target' })}${!hidden && item.aids[language.id] ? `<p class="reading-aid">${escape(item.aids[language.id])}</p>` : ''}${audioText(item.forms[sourceLanguage.id], sourceLanguage, { className: 'speaking-meaning', slow: false })}<button class="text-link" data-speech="reveal" ${disabled(busy())}>${hidden ? 'Reveal phrase' : 'Hide phrase for listening practice'}</button></div>
      <div class="speech-actions"><button class="button secondary" data-speech="listen" ${disabled(busy() || !voices.length)}>${speakerIcon} Listen to the phrase</button><button class="button secondary" data-speech="slow" ${disabled(busy() || !voices.length)}>${speakerIcon} Listen slowly</button><button class="button secondary" data-speech="stop-audio">Stop audio</button></div>
      <section class="speak-check"><p class="eyebrow">2 · SPEAK AND CHECK</p><h3>Say the phrase aloud</h3><p class="field-help">The browser compares the words it recognizes with this phrase. Speak clearly at a natural pace; the check finishes when you pause.</p><label class="toggle-row"><span><strong>Allow browser word check</strong><small>Your browser’s speech provider may receive microphone audio. Internet may be required.</small></span><input id="speech-consent" type="checkbox" ${consent ? 'checked' : ''} ${disabled(recording || stopping || requesting || !Recognition || !window.isSecureContext)}></label><button class="button primary" data-speech="transcribe" ${disabled(!Recognition || !window.isSecureContext || !consent || recording || stopping || requesting || endingRecognition)} aria-pressed="${recognizing}">${endingRecognition ? 'Checking your words…' : recognizing ? 'Finish and check' : 'Speak and check'}</button>${!Recognition ? '<p class="field-help">Browser word check is unavailable here. Try a current Chrome or Edge browser, or use recording below to compare by ear.</p>' : !window.isSecureContext ? '<p class="field-help">Browser transcription requires HTTPS (or localhost).</p>' : !consent ? '<p class="field-help">Enable the word check above to use your microphone.</p>' : ''}</section>
      <p id="speech-status" class="speech-status">${escape(status)}</p>
      ${renderFeedback()}
      <details class="self-recording" ${recording || stopping || requesting || recordingUrl ? 'open' : ''}><summary>Record and compare by ear</summary><p class="field-help">Record up to 30 seconds, play your voice, then replay the example. This separate recording stays in this tab and is not uploaded. Changing phrases or leaving Speaking clears it.</p>
      <div class="speech-actions"><button class="button ${recording ? 'primary' : 'secondary'}" data-speech="record" ${disabled(!canRecord || stopping || requesting || recognizing)} aria-pressed="${recording}">${requesting ? 'Waiting for microphone…' : stopping ? 'Saving recording…' : recording ? 'Stop recording' : 'Record my voice'}</button>${recordingUrl ? '<button class="button secondary" data-speech="delete-recording">Delete recording</button>' : ''}</div>
      ${!canRecord ? '<p class="field-help">Recording needs a supported browser and HTTPS (or localhost). You can still practise aloud.</p>' : ''}
      ${recordingUrl ? `<div class="recording-playback"><label for="recording-audio">Your recording</label><audio id="recording-audio" controls src="${escape(recordingUrl)}"></audio><a class="text-link" href="${escape(recordingUrl)}" download="dailylingo-${language.id}-${item.id}.${recordingBlob.type.includes('mp4') ? 'm4a' : recordingBlob.type.includes('ogg') ? 'ogg' : 'webm'}">Download my recording</a></div>` : ''}
      </details>
      <div class="speech-actions phrase-navigation"><button class="button secondary" data-speech="previous" ${disabled(busy())}>Previous phrase</button><button class="button secondary" data-speech="next" ${disabled(busy())}>Next phrase</button></div></section>
      <div class="speaking-side"><section class="settings-card"><h2>Choose your voice</h2><label class="toggle-row"><span><strong>On-device voices only</strong><small>Prefer audio that works without a network service</small></span><input id="speech-local-only" type="checkbox" ${preferences.localOnly ? 'checked' : ''} ${disabled(busy())}></label><label class="field-label" for="speech-voice">${escape(language.name)} voice</label><select id="speech-voice" ${disabled(!voices.length || busy())}>${voices.length ? voices.map(voice => `<option value="${escape(voice.voiceURI)}" ${preferences.voices[language.id] === voice.voiceURI ? 'selected' : ''}>${escape(voice.name)} · ${escape(voice.lang)} · ${voice.localService ? 'on-device' : 'network'}</option>`).join('') : '<option>No compatible voice found</option>'}</select><p class="field-help">${voices.length ? 'Synthetic audio varies by device and accent. It is a listening aid, not a native-speaker assessment.' : `Install a ${escape(language.name)} voice in your device’s language or speech settings. You may also disable the on-device filter to see network voices.`} Network voices may send phrase text to your browser or OS provider.</p></section>
      <section class="settings-card"><h2>Make one word clearer</h2><ol class="pronunciation-tips"><li>Listen to the full phrase.</li><li>Use “Listen word by word” to practise a tricky word.</li><li>Speak and check, then replay any word marked “Try again”.</li></ol><p class="field-help">Recognized words can help guide practice. They cannot confirm correct pronunciation or judge an accent.</p></section>
      <section class="settings-card"><h2>Small pronunciation steps</h2><ul class="pronunciation-tips">${guides[language.id].map(tip => `<li>${escape(tip)}</li>`).join('')}</ul><p class="field-help">Starter guidance awaits independent language review. Listen, record, compare, and repeat at your own pace.</p></section></div></div>`;
    const focusTarget = focusedId ? root.querySelector(`#${focusedId}`) : focusedAction ? root.querySelector(`[data-speech="${focusedAction}"]`) : null;
    if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
    updateStatus();
  }

  async function startRecording() {
    if (busy() || !canRecord) return;
    window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause();
    const generation = ++captureGeneration;
    requesting = true; status = 'Allow the microphone in your browser to start a recording.'; render();
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed || generation !== captureGeneration) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream = acquired;
      const type = typeof Recorder.isTypeSupported === 'function'
        ? ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(value => Recorder.isTypeSupported(value))
        : undefined;
      const capture = new Recorder(stream, type ? { mimeType: type } : undefined), chunks = [];
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onstop = () => {
        if (disposed || generation !== captureGeneration) return;
        clearTimeout(timer); stopTracks(); recorder = null; recording = false; stopping = false;
        clearRecording();
        if (chunks.length) { recordingBlob = new Blob(chunks, { type: capture.mimeType }); recordingUrl = URL.createObjectURL(recordingBlob); status = 'Listen back, then compare with the example voice.'; }
        else status = 'No audio was captured. Try recording again.';
        render();
      };
      capture.onerror = () => {
        if (disposed || generation !== captureGeneration) return;
        stopCapture(); status = 'Recording stopped because the microphone was unavailable. Try again.'; render();
      };
      clearRecording(); recorder = capture; capture.start(); requesting = false; recording = true;
      status = 'Recording… Stop when you finish. Recording ends automatically after 30 seconds.';
      timer = setTimeout(() => { if (!disposed && generation === captureGeneration) finishRecording(); }, 30000);
      render();
    } catch (error) {
      if (disposed || generation !== captureGeneration) return;
      stopCapture();
      status = error.name === 'NotAllowedError' ? 'Microphone access was declined. You can allow it in browser settings or practise aloud.' : 'The microphone could not start. Check that it is connected and available.';
      render();
    }
  }

  function finishRecording() {
    if (!recording || stopping || !recorder) return;
    const capture = recorder;
    recording = false; stopping = true; clearTimeout(timer);
    status = 'Saving your recording…'; render();
    try { if (capture.state !== 'inactive') capture.stop(); }
    catch { stopCapture(); status = 'The recording could not finish. Try recording again.'; render(); }
    stopTracks();
  }

  function startTranscription() {
    if (!Recognition || !window.isSecureContext || !consent || busy()) return;
    window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause();
    const capturedPhrase = current(), generation = ++captureGeneration;
    let capture;
    try { capture = new Recognition(); }
    catch { status = 'Transcription could not start in this browser. Try recording instead.'; render(); return; }
    recognition = capture;
    capture.lang = language.locale; capture.continuous = false; capture.interimResults = false;
    capture.maxAlternatives = 1; transcript = ''; wordFeedback = null; endingRecognition = false;
    let failed = false;
    capture.onresult = event => {
      if (disposed || generation !== captureGeneration) return;
      const words = event.results?.[event.resultIndex ?? 0]?.[0]?.transcript;
      if (typeof words !== 'string' || !words.trim()) return;
      transcript = words.trim().slice(0, 2000);
      wordFeedback = compareSpokenWords(capturedPhrase.forms[language.id], transcript, language.id);
      status = wordFeedback.kind === 'matched' ? 'The recognized words match. Replay the example to practise sounds and rhythm.' : 'Word check complete. Review the words to try again below.';
      render();
    };
    capture.onerror = event => {
      if (disposed || generation !== captureGeneration) return;
      failed = true;
      const messages = { 'not-allowed': 'Microphone or speech-service access was declined.', 'no-speech': 'No speech was recognized. Try again in a quieter place.', 'network': 'The speech service could not connect. Recording still works locally.', 'language-not-supported': 'This browser speech service does not support the selected language.', 'audio-capture': 'The speech service could not access your microphone.' };
      stopCapture();
      status = messages[event.error] ?? 'Transcription stopped. Try again or use local recording.';
      render();
    };
    capture.onend = () => {
      if (disposed || generation !== captureGeneration) return;
      clearTimeout(speechTimer); clearTimeout(speechEndTimer); recognizing = false; endingRecognition = false; recognition = null;
      if (!transcript && !failed) status = 'No words were returned. Try again or use local recording.';
      render();
    };
    try {
      capture.start(); recognizing = true; status = 'Listening… Say the displayed phrase. Select “Finish and check” when you finish.';
      speechTimer = setTimeout(() => { if (recognition === capture) stopTranscription(); }, 15000); render();
    } catch { stopCapture(); status = 'Transcription could not start in this browser. Try recording instead.'; render(); }
  }

  function stopTranscription() {
    if (!recognizing || endingRecognition || !recognition) return;
    const capture = recognition;
    endingRecognition = true; clearTimeout(speechTimer); status = 'Finishing the word check…'; render();
    speechEndTimer = setTimeout(() => {
      if (disposed || recognition !== capture) return;
      stopCapture();
      status = transcript ? 'Word check complete. Review the recognized words below.' : 'The speech service did not finish. Try the word check again, or record and compare by ear.';
      render();
    }, 5000);
    try { capture.stop(); }
    catch { stopCapture(); status = 'Transcription stopped. Try again or use local recording.'; render(); }
  }

  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  function onClick(event) {
    if (event.target.closest('[data-audio-text]')?.dataset.audioText !== undefined) {
      root.querySelector('audio')?.pause();
      handleAudioClick(event, (...args) => busy() ? notify('Finish the microphone check before playing an example.') : speakText(...args), notify, findLanguage);
      return;
    }
    const button = event.target.closest('[data-speech]'); if (!button || button.disabled) return;
    const action = button.dataset.speech;
    if (action === 'listen' || action === 'slow') { root.querySelector('audio')?.pause(); speakPhrase(current(), language, action === 'slow', notify); }
    else if (action === 'stop-audio') { window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause(); }
    else if (action === 'reveal') { hidden = !hidden; render(); }
    else if (action === 'record') { if (recording) finishRecording(); else void startRecording(); }
    else if (action === 'delete-recording') { root.querySelector('audio')?.pause(); clearRecording(); status = 'Recording deleted.'; render(); }
    else if (action === 'transcribe' || action === 'retry') { if (recognizing) stopTranscription(); else startTranscription(); }
    else if (action === 'next' || action === 'previous') { resetPhrase(); index = (index + (action === 'next' ? 1 : -1) + items().length) % items().length; render(); }
  }
  function onChange(event) {
    const { id, value, checked } = event.target;
    if (id === 'speaking-unit') { resetPhrase(); unitId = value; index = 0; render(); }
    else if (id === 'speech-local-only') { window.speechSynthesis?.cancel(); preferences.localOnly = checked; savePreferences(); render(); }
    else if (id === 'speech-voice') { window.speechSynthesis?.cancel(); preferences.voices[language.id] = value; savePreferences(); }
    else if (id === 'speech-consent') { consent = checked; if (!consent && recognizing) { stopCapture(); transcript = ''; wordFeedback = null; status = 'Transcription stopped.'; } render(); }
  }
  function refreshVoices() { if (!busy()) render(); }
  function onHidden() {
    if (!document.hidden) return;
    window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause();
    if (busy()) { stopCapture(); status = 'Microphone stopped when you left the tab. Record again when you are ready.'; render(); }
  }
  window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
  document.addEventListener('visibilitychange', onHidden);
  activePractice = { dispose() {
    disposed = true; stopCapture(); root.querySelector('audio')?.pause(); clearRecording(); window.speechSynthesis?.cancel();
    announcement?.remove();
    root.removeEventListener('click', onClick); root.removeEventListener('change', onChange);
    window.speechSynthesis?.removeEventListener('voiceschanged', refreshVoices);
    document.removeEventListener('visibilitychange', onHidden);
  } };
  render();
}
