import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSpokenWords } from '../src/speech-feedback.js';
import { concepts, languages } from '../src/content.js';
import { segmentWords } from '../src/audio-ui.js';

test('all 180 starter phrases produce ordered exact word matches in every course', () => {
  for (const language of languages) for (const concept of concepts) {
    const expected = concept.forms[language.id];
    const result = compareSpokenWords(expected, expected, language.id);
    assert.equal(result.kind, 'matched', `${language.id}:${concept.id}`);
    assert.equal(result.matchedCount, segmentWords(expected, language.id).length);
    assert.equal(result.totalCount, result.matchedCount);
    assert.deepEqual(result.extra, []);
    assert.ok(result.words.every(word => word.status === 'matched' && word.heard));
  }
});

test('case, punctuation, canonically equivalent accents and optional Arabic vowel signs follow core matching', () => {
  assert.equal(compareSpokenWords('Thank you!', 'THANK YOU.', 'en').kind, 'matched');
  assert.equal(compareSpokenWords('¿Cómo estás?', 'Co\u0301mo esta\u0301s.', 'es').kind, 'matched');
  assert.equal(compareSpokenWords('شكرًا، من فضلك', '\u200Fشكرا من فضلك\u200E', 'ar').kind, 'matched');
  assert.equal(compareSpokenWords('मुझे माफ़ कीजिए', 'मुझे माफ़ कीजिए।', 'hi').kind, 'matched');
  assert.equal(compareSpokenWords('Sí', 'si', 'es').kind, 'different');
  assert.equal(compareSpokenWords('पानी', 'पान', 'hi').kind, 'different');
  assert.equal(compareSpokenWords('من أين أنت', 'من اين انت', 'ar').kind, 'different');
});

test('one word mismatch in each language receives retry feedback without an accent judgment', () => {
  for (const [language, expected, transcript] of [
    ['en', 'Thank you', 'Thank me'],
    ['es', 'Por favor', 'Por comida'],
    ['zh', '请给我菜单', '请给他菜单'],
    ['hi', 'आप कैसे हैं', 'आप कहाँ हैं'],
    ['ar', 'من فضلك', 'من البيت'],
  ]) {
    const result = compareSpokenWords(expected, transcript, language);
    assert.equal(result.kind, 'different', language);
    assert.ok(result.words.some(word => word.status === 'retry'), language);
    assert.doesNotMatch(result.summary, /pronunciation score|perfect|correct pronunciation|accent/iu);
    assert.equal(Object.hasOwn(result, 'score'), false);
  }
});

test('ordered alignment distinguishes missing words and added words', () => {
  const missing = compareSpokenWords('I am at home', 'I am home', 'en');
  assert.deepEqual(missing.words.map(word => word.status), ['matched', 'matched', 'missing', 'matched']);
  assert.equal(missing.words[2].heard, '');
  assert.equal(missing.matchedCount, 3);
  const extra = compareSpokenWords('Please repeat', 'Please kindly repeat', 'en');
  assert.deepEqual(extra.extra, ['kindly']);
  assert.equal(extra.kind, 'different');
  assert.equal(extra.matchedCount, 2);
  assert.equal(compareSpokenWords('I am home', 'home am I', 'en').kind, 'different');
});

test('a repeated expected word cannot reuse the same transcript occurrence', () => {
  const missing = compareSpokenWords('go go', 'GO', 'en');
  assert.equal(missing.totalCount, 2);
  assert.equal(missing.matchedCount, 1);
  assert.deepEqual(missing.words.map(word => word.status).sort(), ['matched', 'missing']);
  const extra = compareSpokenWords('go', 'go go', 'en');
  assert.equal(extra.matchedCount, 1);
  assert.deepEqual(extra.extra, ['go']);
  assert.equal(extra.kind, 'different');
  const arabic = compareSpokenWords('شكرًا شكرا', 'شكرا', 'ar');
  assert.equal(arabic.matchedCount, 1);
  assert.equal(arabic.totalCount, 2);
});

test('Mandarin comparison ignores transcript word boundaries and keeps displayed word feedback', () => {
  const expected = '你叫什么名字？';
  const result = compareSpokenWords(expected, '你 叫 什 么 名 字', 'zh');
  assert.equal(result.kind, 'matched');
  assert.deepEqual(result.words.map(word => word.text), segmentWords(expected, 'zh'));
  assert.ok(result.words.every(word => word.text === word.heard));
  const extra = compareSpokenWords('你好', '你好朋友', 'zh');
  assert.equal(extra.kind, 'different');
  assert.equal(extra.extra.join(''), '朋友');
  const repeated = compareSpokenWords('你好 你好', '你好', 'zh');
  assert.equal(repeated.matchedCount, 1);
  assert.equal(repeated.totalCount, 2);
  const reordered = compareSpokenWords('你好吗', '吗好你', 'zh');
  assert.equal(reordered.kind, 'different');
  assert.ok(reordered.words.some(word => word.status !== 'matched'));
});

test('empty, punctuation-only and missing expected text never become a successful match', () => {
  for (const transcript of ['', '   ', '?!!', null, undefined]) {
    const result = compareSpokenWords('Please repeat', transcript, 'en');
    assert.equal(result.kind, 'empty');
    assert.equal(result.matchedCount, 0);
    assert.ok(result.words.every(word => word.status === 'missing'));
  }
  assert.equal(compareSpokenWords('', '', 'en').kind, 'empty');
  const noExpected = compareSpokenWords('', 'hello', 'en');
  assert.equal(noExpected.kind, 'different');
  assert.equal(noExpected.totalCount, 0);
  assert.deepEqual(noExpected.extra, ['hello']);
});

test('older-engine segmentation fallback preserves script meaning and recognition matching', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    assert.equal(compareSpokenWords('你好吗？', '你 好 吗', 'zh').kind, 'matched');
    assert.equal(compareSpokenWords('आप कैसे हैं?', 'आप कैसे हैं', 'hi').kind, 'matched');
    assert.equal(compareSpokenWords('مِنْ فَضْلِكَ', 'من فضلك', 'ar').kind, 'matched');
  } finally { Intl.Segmenter = original; }
});
