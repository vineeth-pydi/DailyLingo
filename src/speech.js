import { concepts, units } from './content.js';
import { matchesAnswer } from './core.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const preferenceKey = 'freelingo-speech-v1';
let preferences = { localOnly: true, voices: {} };
try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey));
  if (saved && typeof saved.localOnly === 'boolean') preferences.localOnly = saved.localOnly;
  if (saved?.voices && typeof saved.voices === 'object') preferences.voices = saved.voices;
} catch { /* Audio preferences are optional when storage is unavailable. */ }
const savePreferences = () => { try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch { /* Keep session preferences. */ } };
export function resetSpeechPreferences() {
  preferences = { localOnly: true, voices: {} };
  try { localStorage.removeItem(preferenceKey); } catch { /* Reset this session even without storage. */ }
}
const matchingVoices = language => (window.speechSynthesis?.getVoices() ?? [])
  .filter(voice => voice.lang.toLowerCase().split(/[-_]/)[0] === language.id && (!preferences.localOnly || voice.localService))
  .sort((a, b) => Number(b.lang.toLowerCase() === language.locale.toLowerCase()) - Number(a.lang.toLowerCase() === language.locale.toLowerCase()));

export function speakPhrase(item, language, slow = false, notify = () => {}) {
  if (!window.speechSynthesis) { notify('Pronunciation playback is unavailable in this browser. Try the reading guide.'); return; }
  const voices = matchingVoices(language);
  const voice = voices.find(candidate => candidate.voiceURI === preferences.voices[language.id]) ?? voices[0];
  if (!voice) { notify(`No ${preferences.localOnly ? 'on-device ' : ''}${language.name} voice is available. Open Speaking to choose a voice, or install one in your device settings.`); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(item.forms[language.id]);
  utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = slow ? 0.6 : 0.9;
  utterance.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error)) notify('This voice could not play. Try another voice or use the reading guide.'); };
  window.speechSynthesis.speak(utterance);
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
  let recording = false, requesting = false, recognition = null, recognizing = false, timer, speechTimer;
  let status = 'Listen, say it aloud, and compare your recording.', transcript = '', transcriptFeedback = '', consent = false;
  let captureGeneration = 0;
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.isSecureContext);
  const items = () => concepts.filter(item => units.find(unit => unit.id === unitId).ids.includes(item.id));
  const current = () => items()[index];
  const stopTracks = () => { stream?.getTracks().forEach(track => track.stop()); stream = null; };
  const clearRecording = () => { if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = ''; recordingBlob = null; };
  const stopCapture = () => {
    captureGeneration++; requesting = false; clearTimeout(timer); clearTimeout(speechTimer);
    if (recorder?.state === 'recording') recorder.stop();
    recorder = null; stopTracks(); recording = false;
    recognition?.abort(); recognition = null; recognizing = false;
  };
  const resetPhrase = () => { stopCapture(); clearRecording(); transcript = ''; transcriptFeedback = ''; status = 'Listen, say it aloud, and compare your recording.'; window.speechSynthesis?.cancel(); };
  const busy = () => recording || requesting || recognizing;
  const disabled = condition => condition ? 'disabled' : '';
  const notify = message => { if (!disposed) { status = message; updateStatus(); } };

  function updateStatus() {
    const node = root.querySelector('#speech-status');
    if (node) node.textContent = status;
  }
  function render() {
    if (disposed) return;
    const focusedId = root.contains(document.activeElement) ? document.activeElement.id : '';
    const focusedAction = root.contains(document.activeElement) ? document.activeElement.dataset.speech : '';
    const item = current(), voices = matchingVoices(language);
    root.innerHTML = `<section class="page-intro"><p class="eyebrow">FIND YOUR VOICE</p><h1>Listen. Try it. Make it yours.</h1><p>Speaking practice in ${escape(language.name)}. Free, with no account or subscription.</p></section>
      <div class="speaking-grid"><section class="settings-card speaking-card"><div class="speaking-heading"><h2>Your speaking studio</h2><span class="pill">${index + 1} / ${items().length}</span></div>
      <label class="field-label" for="speaking-unit">Choose a topic</label><select id="speaking-unit" ${disabled(busy())}>${units.map(unit => `<option value="${unit.id}" ${unit.id === unitId ? 'selected' : ''}>${escape(unit.title)}</option>`).join('')}</select>
      <div class="speaking-phrase"><p class="eyebrow">SAY THIS IN ${language.name.toUpperCase()}</p><h3 lang="${language.id}" dir="${language.direction}">${hidden ? 'Listen first…' : escape(item.forms[language.id])}</h3>${!hidden && item.aids[language.id] ? `<p class="reading-aid">${escape(item.aids[language.id])}</p>` : ''}<p lang="${sourceLanguage.id}" dir="${sourceLanguage.direction}">${escape(item.forms[sourceLanguage.id])}</p><button class="text-link" data-speech="reveal" ${disabled(busy())}>${hidden ? 'Reveal phrase' : 'Hide phrase for listening practice'}</button></div>
      <div class="speech-actions"><button class="button primary" data-speech="listen" ${disabled(busy() || !voices.length)}>Listen</button><button class="button secondary" data-speech="slow" ${disabled(busy() || !voices.length)}>Listen slowly</button><button class="button secondary" data-speech="stop-audio">Stop audio</button></div>
      <hr><h3>Say it, then listen back</h3><p class="field-help">Record up to 30 seconds. FreeLingo keeps the recording in this tab and does not upload it. Changing phrases or leaving Speaking clears it.</p>
      <div class="speech-actions"><button class="button ${recording ? 'primary' : 'secondary'}" data-speech="record" ${disabled(!canRecord || requesting || recognizing)}>${requesting ? 'Waiting for microphone…' : recording ? 'Stop recording' : 'Record my voice'}</button>${recordingUrl ? '<button class="button secondary" data-speech="delete-recording">Delete recording</button>' : ''}</div>
      ${!canRecord ? '<p class="field-help">Recording needs a supported browser and HTTPS (or localhost). You can still practise aloud.</p>' : ''}
      ${recordingUrl ? `<div class="recording-playback"><label for="recording-audio">Your recording</label><audio id="recording-audio" controls src="${escape(recordingUrl)}"></audio><a class="text-link" href="${escape(recordingUrl)}" download="freelingo-${language.id}-${item.id}.${recordingBlob.type.includes('mp4') ? 'm4a' : recordingBlob.type.includes('ogg') ? 'ogg' : 'webm'}">Download my recording</a></div>` : ''}
      <p id="speech-status" class="speech-status" role="status" aria-live="polite">${escape(status)}</p>
      <div class="speech-actions phrase-navigation"><button class="button secondary" data-speech="previous" ${disabled(busy())}>Previous phrase</button><button class="button secondary" data-speech="next" ${disabled(busy())}>Next phrase</button></div></section>
      <div class="speaking-side"><section class="settings-card"><h2>Choose your voice</h2><label class="toggle-row"><span><strong>On-device voices only</strong><small>Prefer audio that works without a network service</small></span><input id="speech-local-only" type="checkbox" ${preferences.localOnly ? 'checked' : ''} ${disabled(busy())}></label><label class="field-label" for="speech-voice">${escape(language.name)} voice</label><select id="speech-voice" ${disabled(!voices.length || busy())}>${voices.length ? voices.map(voice => `<option value="${escape(voice.voiceURI)}" ${preferences.voices[language.id] === voice.voiceURI ? 'selected' : ''}>${escape(voice.name)} · ${escape(voice.lang)} · ${voice.localService ? 'on-device' : 'network'}</option>`).join('') : '<option>No compatible voice found</option>'}</select><p class="field-help">${voices.length ? 'Synthetic audio varies by device and accent. It is a listening aid, not a native-speaker assessment.' : `Install a ${escape(language.name)} voice in your device’s language or speech settings. You may also disable the on-device filter to see network voices.`} Network voices may send phrase text to your browser or OS provider.</p></section>
      <section class="settings-card"><h2>Try speech-to-text</h2><p class="field-help">This optional check compares recognized words with the phrase. It does not grade your accent, tones, or pronunciation. Your browser’s speech provider may receive microphone audio and require internet access.</p><label class="toggle-row"><span><strong>Allow browser transcription</strong><small>I understand audio may leave this device</small></span><input id="speech-consent" type="checkbox" ${consent ? 'checked' : ''} ${disabled(recording || requesting)}></label><button class="button secondary" data-speech="transcribe" ${disabled(!Recognition || !window.isSecureContext || !consent || recording || requesting)}>${recognizing ? 'Stop listening' : 'Check spoken words'}</button>${!Recognition ? '<p class="field-help">Browser transcription is unavailable here. Recording and listening back still work on supported devices.</p>' : ''}<div class="speech-transcript" role="status" aria-live="polite">${transcript ? `<span>You said:</span><p lang="${language.id}" dir="${language.direction}">${escape(transcript)}</p><p>${escape(transcriptFeedback)}</p>` : ''}</div></section>
      <section class="settings-card"><h2>Small pronunciation steps</h2><ul class="pronunciation-tips">${guides[language.id].map(tip => `<li>${escape(tip)}</li>`).join('')}</ul><p class="field-help">Starter guidance awaits independent language review. Listen, record, compare, and repeat at your own pace.</p></section></div></div>`;
    const focusTarget = focusedId ? root.querySelector(`#${focusedId}`) : focusedAction ? root.querySelector(`[data-speech="${focusedAction}"]`) : null;
    if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
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
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(value => MediaRecorder.isTypeSupported(value));
      const capture = new MediaRecorder(stream, type ? { mimeType: type } : undefined), chunks = [];
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onstop = () => {
        if (disposed || generation !== captureGeneration) return;
        clearTimeout(timer); stopTracks(); recorder = null; recording = false;
        clearRecording();
        if (chunks.length) { recordingBlob = new Blob(chunks, { type: capture.mimeType }); recordingUrl = URL.createObjectURL(recordingBlob); status = 'Listen back, then compare with the example voice.'; }
        else status = 'No audio was captured. Try recording again.';
        render();
      };
      capture.onerror = () => { stopCapture(); status = 'Recording stopped because the microphone was unavailable. Try again.'; render(); };
      clearRecording(); recorder = capture; capture.start(); requesting = false; recording = true;
      status = 'Recording… Stop when you finish. Recording ends automatically after 30 seconds.';
      timer = setTimeout(() => { if (capture.state === 'recording') capture.stop(); stopTracks(); }, 30000);
      render();
    } catch (error) {
      if (disposed || generation !== captureGeneration) return;
      stopCapture();
      status = error.name === 'NotAllowedError' ? 'Microphone access was declined. You can allow it in browser settings or practise aloud.' : 'The microphone could not start. Check that it is connected and available.';
      render();
    }
  }

  function startTranscription() {
    if (!Recognition || !consent || busy()) return;
    window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause();
    const capturedPhrase = current(), generation = ++captureGeneration;
    const capture = new Recognition(); recognition = capture;
    capture.lang = language.locale; capture.continuous = false; capture.interimResults = false;
    capture.maxAlternatives = 1; transcript = ''; transcriptFeedback = '';
    let failed = false;
    capture.onresult = event => {
      if (disposed || generation !== captureGeneration) return;
      transcript = event.results[0][0].transcript;
      transcriptFeedback = matchesAnswer(transcript, capturedPhrase.forms[language.id], language.id)
        ? 'The recognized words match. Listen back to work on the sounds and rhythm.'
        : 'The recognized words differ. This can reflect your speech, background noise, or recognition errors. Try listening and saying it again.';
      status = 'Word check complete. This is not a pronunciation score.'; render();
    };
    capture.onerror = event => {
      if (disposed || generation !== captureGeneration) return;
      failed = true;
      const messages = { 'not-allowed': 'Microphone or speech-service access was declined.', 'no-speech': 'No speech was recognized. Try again in a quieter place.', 'network': 'The speech service could not connect. Recording still works locally.', 'language-not-supported': 'This browser speech service does not support the selected language.', 'audio-capture': 'The speech service could not access your microphone.' };
      status = messages[event.error] ?? 'Transcription stopped. Try again or use local recording.';
    };
    capture.onend = () => {
      if (disposed || generation !== captureGeneration) return;
      clearTimeout(speechTimer); recognizing = false; recognition = null;
      if (!transcript && !failed) status = 'No words were returned. Try again or use local recording.';
      render();
    };
    try {
      capture.start(); recognizing = true; status = 'Listening for your phrase… Stop listening when you finish.';
      speechTimer = setTimeout(() => { if (recognition === capture) capture.stop(); }, 15000); render();
    } catch { recognition = null; recognizing = false; status = 'Transcription could not start in this browser. Try recording instead.'; render(); }
  }

  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  function onClick(event) {
    const button = event.target.closest('[data-speech]'); if (!button || button.disabled) return;
    const action = button.dataset.speech;
    if (action === 'listen' || action === 'slow') { root.querySelector('audio')?.pause(); speakPhrase(current(), language, action === 'slow', notify); }
    else if (action === 'stop-audio') { window.speechSynthesis?.cancel(); root.querySelector('audio')?.pause(); }
    else if (action === 'reveal') { hidden = !hidden; render(); }
    else if (action === 'record') { if (recording) { clearTimeout(timer); recorder?.stop(); stopTracks(); } else void startRecording(); }
    else if (action === 'delete-recording') { root.querySelector('audio')?.pause(); clearRecording(); status = 'Recording deleted.'; render(); }
    else if (action === 'transcribe') { if (recognizing) recognition?.stop(); else startTranscription(); }
    else if (action === 'next' || action === 'previous') { resetPhrase(); index = (index + (action === 'next' ? 1 : -1) + items().length) % items().length; render(); }
  }
  function onChange(event) {
    const { id, value, checked } = event.target;
    if (id === 'speaking-unit') { resetPhrase(); unitId = value; index = 0; render(); }
    else if (id === 'speech-local-only') { window.speechSynthesis?.cancel(); preferences.localOnly = checked; savePreferences(); render(); }
    else if (id === 'speech-voice') { window.speechSynthesis?.cancel(); preferences.voices[language.id] = value; savePreferences(); }
    else if (id === 'speech-consent') { consent = checked; if (!consent && recognizing) { stopCapture(); status = 'Transcription stopped.'; } render(); }
  }
  function refreshVoices() { if (!busy()) render(); }
  function onHidden() { if (document.hidden && busy()) { stopCapture(); status = 'Microphone stopped when you left the tab. Record again when you are ready.'; render(); } }
  window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
  document.addEventListener('visibilitychange', onHidden);
  activePractice = { dispose() {
    disposed = true; stopCapture(); clearRecording(); window.speechSynthesis?.cancel();
    root.removeEventListener('click', onClick); root.removeEventListener('change', onChange);
    window.speechSynthesis?.removeEventListener('voiceschanged', refreshVoices);
    document.removeEventListener('visibilitychange', onHidden);
  } };
  render();
}
