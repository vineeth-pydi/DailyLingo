import test from 'node:test';
import assert from 'node:assert/strict';
import { units, findUnit, findConcept } from '../src/content.js';
import { exerciseSet } from '../src/core.js';
import { restoreDrafts } from '../src/drafts.js';

const key = `es:en:${units[0].id}`;
const makeDraft = () => ({ exercises: exerciseSet(units[0], 'es', 'en'), index: 1, elapsed: 12, answers: [{ id: units[0].ids[0], correct: true }] });
test('valid legacy lesson drafts resume with sanitized fields', () => {
  const draft = makeDraft(); draft.extra = 'ignored';
  const clean = restoreDrafts({ [key]: draft });
  assert.equal(clean[key].index, 1);
  assert.equal(clean[key].extra, undefined);
  assert.deepEqual(clean[key].exercises, draft.exercises);
});
test('malformed saved exercise data is dropped without losing other drafts', () => {
  for (const mutate of [d => d.exercises[0].choices = null, d => d.exercises[6].tokens = ['injected'],
    d => d.answers[0].id = units[0].ids[1], d => d.elapsed = -1,
    d => d.exercises[1] = null, d => d.exercises[0].choices[0].text = 'tampered']) {
    const draft = makeDraft(); mutate(draft);
    assert.deepEqual(restoreDrafts({ [key]: draft }), {});
  }
  assert.deepEqual(restoreDrafts({ [`${key}:extra`]: makeDraft() }), {});
  assert.deepEqual(restoreDrafts(null), {});
});


test('legacy Mandarin blank word chips are removed without dropping saved answers', () => {
  const unit = findUnit('help');
  const exercises = exerciseSet(unit, 'zh', 'en', () => .4);
  const exercise = exercises.find(item => item.id === 'yes-no' && item.kind !== 'choice');
  exercise.kind = 'build';
  exercise.tokens = Array.from(findConcept('yes-no').forms.zh.replace(/[\p{P}\p{S}]/gu, '').trim());
  const draft = { exercises, answers: [{ id: exercises[0].id, correct: true }], index: 1, elapsed: 40 };
  const before = structuredClone(draft);
  const restored = restoreDrafts({ 'zh:en:help': draft })['zh:en:help'];
  assert.ok(restored);
  assert.deepEqual(restored.answers, draft.answers);
  assert.equal(restored.elapsed, 40);
  assert.deepEqual(restored.exercises.find(item => item.kind === 'build' && item.id === 'yes-no').tokens, ['是', '不', '是']);
  assert.deepEqual(draft, before);
  draft.exercises.find(item => item.kind === 'build' && item.id === 'yes-no').tokens.push('injected');
  assert.deepEqual(restoreDrafts({ 'zh:en:help': draft }), {});
});

test('one corrupt draft leaves another valid completed draft available to resume', () => {
  const valid = makeDraft();
  valid.index = 12;
  valid.answers = valid.exercises.map(exercise => ({ id: exercise.id, correct: true }));
  const invalid = makeDraft(); invalid.exercises[0].choices[0] = null;
  const restored = restoreDrafts({ [key]: valid, 'es:zh:greetings': invalid });
  assert.deepEqual(Object.keys(restored), [key]);
  assert.equal(restored[key].index, 12);
  assert.equal(restored[key].answers.length, 12);
});
