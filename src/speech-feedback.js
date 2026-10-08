import { segmentWords } from './audio-ui.js';
import { normalize } from './core.js';

function comparisonUnits(text, languageId) {
  const words = segmentWords(text, languageId).map(text => ({ text, key: normalize(text, languageId) })).filter(word => word.key);
  const units = words.flatMap((word, wordIndex) => languageId === 'zh'
    // Recognition services disagree about Mandarin word boundaries. Compare
    // characters, then put feedback back onto the displayed expected words.
    ? [...word.key].map(key => ({ key, text: key, wordIndex }))
    : [{ key: word.key, text: word.text, wordIndex }]);
  return { words, units };
}

/** Ordered edit alignment: each recognized occurrence can match only once. */
function align(expected, heard) {
  const rows = Array.from({ length: expected.length + 1 }, () => new Uint32Array(heard.length + 1));
  for (let i = 0; i <= expected.length; i++) rows[i][0] = i;
  for (let j = 0; j <= heard.length; j++) rows[0][j] = j;
  for (let i = 1; i <= expected.length; i++) for (let j = 1; j <= heard.length; j++) {
    const substitution = Number(expected[i - 1].key !== heard[j - 1].key);
    rows[i][j] = Math.min(rows[i - 1][j - 1] + substitution, rows[i - 1][j] + 1, rows[i][j - 1] + 1);
  }
  const output = [];
  let i = expected.length, j = heard.length;
  while (i || j) {
    const equal = i && j && expected[i - 1].key === heard[j - 1].key;
    if (i && j && rows[i][j] === rows[i - 1][j - 1] + Number(!equal)) {
      output.push({ status: equal ? 'matched' : 'retry', expected: expected[--i], heard: heard[--j] });
    } else if (i && rows[i][j] === rows[i - 1][j] + 1) {
      output.push({ status: 'missing', expected: expected[--i] });
    } else {
      output.push({ status: 'extra', heard: heard[--j] });
    }
  }
  return output.reverse();
}

/**
 * Compare recognized words with the displayed phrase. This describes the
 * browser's transcript, not the quality of sounds, an accent, or pronunciation.
 */
export function compareSpokenWords(expectedText, transcript, languageId) {
  const expected = comparisonUnits(expectedText, languageId);
  const heard = comparisonUnits(transcript, languageId);
  const totals = expected.words.map((word, wordIndex) => ({
    text: word.text, heard: [], matched: 0, retried: 0,
    total: expected.units.filter(unit => unit.wordIndex === wordIndex).length,
  }));
  const extra = [];
  let previousExtra = null;
  if (heard.units.length) for (const item of align(expected.units, heard.units)) {
    if (item.status === 'extra') {
      // Keep a Mandarin insertion readable as a run rather than one item per
      // character. Separate nonadjacent runs and distinct recognized words.
      if (languageId === 'zh' && previousExtra?.wordIndex === item.heard.wordIndex) {
        extra[extra.length - 1] += item.heard.text;
      } else extra.push(item.heard.text);
      previousExtra = item.heard;
      continue;
    }
    previousExtra = null;
    const word = totals[item.expected.wordIndex];
    if (item.heard) word.heard.push(item.heard.text);
    if (item.status === 'matched') word.matched++;
    if (item.status === 'retry') word.retried++;
  }
  const words = totals.map(word => ({
    text: word.text,
    heard: word.heard.join(languageId === 'zh' ? '' : ' '),
    status: word.matched === word.total ? 'matched' : word.matched || word.retried ? 'retry' : 'missing',
  }));
  const matchedCount = words.filter(word => word.status === 'matched').length;
  const totalCount = words.length;
  const kind = !heard.units.length ? 'empty' : totalCount && matchedCount === totalCount && !extra.length ? 'matched' : 'different';
  const summary = kind === 'matched'
    ? 'The browser recognized the expected words. Listen to the example and compare your voice.'
    : kind === 'empty'
      ? 'The browser did not return words. Listen to the example and try speaking again.'
      : 'Some words were recognized differently. Replay the highlighted words and try the phrase again.';
  return { kind, words, extra, summary, matchedCount, totalCount };
}
