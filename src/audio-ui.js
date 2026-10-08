const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const speaker = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></svg>';
const lifecycleWindows = new WeakSet();

// Audio from every section stops when its page or tab is left. Binding once
// also covers the helper's use in the locally delegated Speaking listener.
export function installAudioLifecycle(windowRef = globalThis.window, documentRef = globalThis.document) {
  if (!windowRef?.addEventListener || !documentRef?.addEventListener || lifecycleWindows.has(windowRef)) return;
  lifecycleWindows.add(windowRef);
  const stop = () => { try { windowRef.speechSynthesis?.cancel(); } catch { /* Some browsers remove speech services while closing. */ } };
  for (const event of ['hashchange', 'pagehide', 'beforeunload']) windowRef.addEventListener(event, stop);
  documentRef.addEventListener('visibilitychange', () => { if (documentRef.hidden) stop(); });
}

// Segment script-aware words; keep punctuation in full-phrase audio only.
export function segmentWords(text, languageId) {
  const value = String(text ?? '').normalize('NFC').trim();
  if (!value) return [];
  if (typeof Intl.Segmenter === 'function') {
    try {
      return [...new Intl.Segmenter(languageId, { granularity: 'word' }).segment(value)]
        .filter(part => part.isWordLike).map(part => part.segment);
    } catch { /* Use the script-safe fallback for older or limited engines. */ }
  }
  if (languageId === 'zh') return [...value].filter(character => /[\p{L}\p{N}]/u.test(character));
  return value.match(/[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*/gu) ?? [];
}

export function audioButton(text, language, { slow = false, label = '', className = '', disabled = false } = {}) {
  const value = String(text ?? '').trim();
  const name = label || `Listen${slow ? ' slowly' : ''} to ${value} in ${language.name}`;
  return `<button type="button" class="icon-button audio-button ${escape(className)}" data-audio-text="${escape(value)}" data-audio-language="${escape(language.id)}" data-audio-slow="${slow}" aria-label="${escape(name)}" title="${escape(name)}" ${disabled || !value ? 'disabled' : ''}>${speaker}${slow ? '<span class="audio-speed" aria-hidden="true">½</span>' : ''}</button>`;
}

export function wordAudio(text, language, { label = '' } = {}) {
  const words = segmentWords(text, language.id);
  if (!words.length) return '';
  return `<details class="word-listening"><summary>${speaker}<span>${escape(label || 'Listen word by word')}</span></summary><div class="word-listening-items" lang="${escape(language.id)}" dir="${escape(language.direction)}">${words.map(word => `<button type="button" class="listen-word" data-audio-text="${escape(word)}" data-audio-language="${escape(language.id)}" data-audio-slow="true" aria-label="${escape(`Listen to ${word} in ${language.name}`)}"><span>${escape(word)}</span>${speaker}</button>`).join('')}</div></details>`;
}

export function audioText(text, language, { className = '', textTag = 'span', slow = true, wordByWord = true, label = '' } = {}) {
  // Restrict the tag rather than allowing arbitrary markup into templates.
  const tag = ['span', 'p', 'h2', 'h3', 'strong'].includes(textTag) ? textTag : 'span';
  return `<div class="listenable-text ${escape(className)}"><div class="audio-line"><${tag} class="learning-text" lang="${escape(language.id)}" dir="${escape(language.direction)}">${escape(text)}</${tag}><span class="audio-controls">${audioButton(text, language, { label })}${slow ? audioButton(text, language, { slow: true }) : ''}</span></div>${wordByWord ? wordAudio(text, language) : ''}</div>`;
}

// Explicit language travels with the displayed text, so source prompts never
// accidentally play (and reveal) the target answer. This listener is delegated.
export function handleAudioClick(event, speakText, notify = () => {}, findLanguage) {
  const button = event.target.closest('[data-audio-text]');
  if (!button) return false;
  if (button.disabled) return true;
  const language = findLanguage(button.dataset.audioLanguage);
  if (!language || !button.dataset.audioText?.trim()) return true;
  event.preventDefault();
  event.stopPropagation?.();
  installAudioLifecycle();
  speakText(button.dataset.audioText, language, button.dataset.audioSlow === 'true', notify);
  return true;
}
