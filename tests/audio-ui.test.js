import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, concepts, findLanguage } from '../src/content.js';
import { audioButton, audioText, wordAudio, segmentWords, handleAudioClick, installAudioLifecycle } from '../src/audio-ui.js';

test('every starter phrase has phrase, slow and script-aware word playback in all five languages', () => {
  for (const language of languages) for (const item of concepts) {
    const text = item.forms[language.id];
    const html = audioText(text, language);
    const words = segmentWords(text, language.id);
    assert.ok(words.length > 0, `${language.id}:${item.id} has playable words`);
    assert.ok(html.includes(`lang="${language.id}" dir="${language.direction}"`));
    assert.equal((html.match(/data-audio-language=/g) ?? []).length, words.length + 2);
    assert.equal((html.match(/data-audio-slow="false"/g) ?? []).length, 1);
    assert.equal((html.match(/data-audio-slow="true"/g) ?? []).length, words.length + 1);
    assert.equal((html.match(/aria-label=/g) ?? []).length, words.length + 2);
    assert.ok(html.includes('<summary>'));
    // Each playable word is a real button, not an interactive child of a button.
    assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>).)*<button/s);
    assert.equal((html.match(/type="button"/g) ?? []).length, words.length + 2);
  }
});

test('Mandarin word segmentation does not require whitespace; punctuation is never a word button', () => {
  assert.ok(segmentWords('你好吗？', 'zh').length >= 2);
  assert.deepEqual(segmentWords('¿Cómo estás?', 'es'), ['Cómo', 'estás']);
  assert.deepEqual(segmentWords('كيف حالك؟', 'ar'), ['كيف', 'حالك']);
  assert.deepEqual(segmentWords('आप कैसे हैं?', 'hi'), ['आप', 'कैसे', 'हैं']);
  assert.deepEqual(segmentWords('?!…', 'en'), []);
});

test('limited-engine fallback keeps Hindi and Arabic marks intact and segments Mandarin characters', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    assert.deepEqual(segmentWords('आप कैसे हैं?', 'hi'), ['आप', 'कैसे', 'हैं']);
    assert.deepEqual(segmentWords('مرحبًا، شكرًا', 'ar'), ['مرحبًا', 'شكرًا']);
    assert.deepEqual(segmentWords('你好！', 'zh'), ['你', '好']);
  } finally { Intl.Segmenter = original; }
});

test('audio markup escapes text and attributes and rejects arbitrary heading tags', () => {
  const html = audioText('<img src=x onerror="oops"> &\' hi', findLanguage('en'), { textTag: 'script', className: '" onclick="bad' });
  assert.doesNotMatch(html, /<img|<script|onclick="bad/);
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&quot;'));
  assert.ok(audioButton('', findLanguage('es')).includes('disabled'));
  assert.equal(wordAudio(' ', findLanguage('ar')), '');
});

test('delegated playback uses the displayed language, requested speed and notification callback', () => {
  const calls = [], notify = () => {};
  const button = { disabled: false, dataset: { audioText: 'Good morning', audioLanguage: 'en', audioSlow: 'true' } };
  let prevented = 0;
  const event = { target: { closest: selector => selector === '[data-audio-text]' ? button : null }, preventDefault() { prevented++; } };
  assert.equal(handleAudioClick(event, (...args) => calls.push(args), notify, findLanguage), true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['Good morning', findLanguage('en'), true, notify]);
  assert.equal(prevented, 1);
  button.disabled = true;
  handleAudioClick(event, (...args) => calls.push(args), notify, findLanguage);
  button.disabled = false; button.dataset.audioLanguage = 'unknown';
  handleAudioClick(event, (...args) => calls.push(args), notify, findLanguage);
  assert.equal(calls.length, 1);
  assert.equal(handleAudioClick({ target: { closest: () => null } }, () => {}, notify, findLanguage), false);
});

test('shared phrase audio stops on navigation, leaving the page, and hiding the tab; lifecycle binds once', () => {
  const windowRef = new EventTarget(), documentRef = new EventTarget();
  let cancellations = 0;
  windowRef.speechSynthesis = { cancel() { cancellations++; } };
  documentRef.hidden = false;
  installAudioLifecycle(windowRef, documentRef); installAudioLifecycle(windowRef, documentRef);
  for (const name of ['hashchange', 'pagehide', 'beforeunload']) windowRef.dispatchEvent(new Event(name));
  assert.equal(cancellations, 3);
  documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(cancellations, 3, 'returning to a visible tab does not stop new speech');
  documentRef.hidden = true; documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(cancellations, 4);
  assert.doesNotThrow(() => installAudioLifecycle(undefined, undefined));
});
