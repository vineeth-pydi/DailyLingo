import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, units, concepts } from '../src/content.js';
import { defaultState, normalize, matchesAnswer, tokenize, scheduleReview, dueReviews, completeLesson, exerciseSet, validateState, streak, dayKey, DAY } from '../src/core.js';

test('all five courses have 36 unique aligned phrases and complete lessons', () => {
  assert.equal(languages.length, 5);
  assert.equal(concepts.length, 36);
  assert.equal(new Set(concepts.map(c => c.id)).size, concepts.length);
  for (const language of languages) for (const concept of concepts) assert.ok(concept.forms[language.id]?.trim());
  assert.deepEqual(units.flatMap(unit => unit.ids), concepts.map(c => c.id));
});

test('answer checking tolerates punctuation but preserves meaningful script differences', () => {
  assert.ok(matchesAnswer('  ¡HOLA! ', 'Hola', 'es'));
  assert.ok(matchesAnswer('شكرًا', 'شكرا', 'ar'));
  assert.ok(matchesAnswer('你 好！', '你好', 'zh'));
  assert.equal(matchesAnswer('Si', 'Sí', 'es'), false);
  assert.equal(matchesAnswer('पान', 'पानी', 'hi'), false);
  assert.equal(normalize('कृपया', 'hi'), 'कृपया');
});

test('review intervals grow, failed answers return soon, and languages stay separate', () => {
  const now = 1_800_000_000_000;
  assert.deepEqual(scheduleReview(undefined, true, now), { due: now + DAY, stage: 0 });
  assert.deepEqual(scheduleReview({ stage: 0 }, true, now), { due: now + 3 * DAY, stage: 1 });
  assert.deepEqual(scheduleReview({ stage: 4 }, true, now), { due: now + 30 * DAY, stage: 4 });
  assert.deepEqual(scheduleReview({ stage: 3 }, false, now), { due: now + 600_000, stage: 0, retry: true });
  assert.deepEqual(scheduleReview({ stage: 0, retry: true }, true, now), { due: now + DAY, stage: 0 });
  const state = defaultState();
  state.reviews = { 'es:hello': { due: now, stage: 0 }, 'ar:thanks': { due: now, stage: 0 }, 'es:thanks': { due: now + DAY, stage: 0 } };
  assert.deepEqual(dueReviews(state, now).map(item => item.id), ['hello']);
});

test('lesson completion saves score, schedules difficult items, and does not mutate input', () => {
  const state = defaultState();
  const now = 1_800_000_000_000;
  const next = completeLesson(state, 'greetings', [{ id: 'hello', correct: true }, { id: 'thanks', correct: false }], 120, now);
  assert.deepEqual(state.completed, {});
  assert.equal(next.completed['es:greetings'].score, 50);
  assert.equal(next.reviews['es:thanks'].due, now + 600_000);
  assert.equal(next.activity[dayKey(now)].seconds, 120);
});

test('every lesson has 12 valid exercises with exactly one correct recognition option', () => {
  for (const language of languages) for (const unit of units) {
    const source = language.id === 'en' ? 'es' : 'en';
    const exercises = exerciseSet(unit, language.id, source, () => .4);
    assert.equal(exercises.length, 12);
    for (const exercise of exercises) {
      assert.ok(unit.ids.includes(exercise.id));
      if (exercise.kind === 'choice') {
        assert.equal(exercise.choices.length, 4);
        assert.equal(exercise.choices.filter(choice => choice.id === exercise.id).length, 1);
      }
      if (exercise.kind === 'build') assert.ok(exercise.tokens.length);
    }
  }
});

test('backup validation rejects invalid preferences and strips unrecognized data', () => {
  assert.throws(() => validateState({ ...defaultState(), target: 'xx' }));
  assert.throws(() => validateState({ ...defaultState(), source: 'es' }));
  assert.throws(() => validateState({ ...defaultState(), goal: -2 }));
  const raw = { ...defaultState(), arbitrary: '<script>', reviews: { 'xx:hello': { due: 100, stage: 0 }, 'es:hello': { due: 100, stage: 0 } }, drafts: { evil: {} } };
  const parsed = validateState(raw);
  assert.equal(parsed.arbitrary, undefined);
  assert.deepEqual(parsed.drafts, {});
  assert.deepEqual(Object.keys(parsed.reviews), ['es:hello']);
  assert.deepEqual(validateState({ ...defaultState(), reviews: { 'es:hello': { due: 1e100, stage: 0 } } }).reviews, {});
});

test('valid backup preserves progress and retry state through a JSON round-trip', () => {
  const state = completeLesson(defaultState(), 'greetings', [{ id: 'hello', correct: false }], 90, 1_800_000_000_000);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});

test('streak uses local calendar days across midnight and permits yesterday as the last practice', () => {
  const now = new Date(2026, 9, 8, 9).getTime();
  const state = defaultState();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  state.activity[dayKey(yesterday.getTime())] = { seconds: 30, answers: 1 };
  assert.equal(streak(state, now), 1);
  state.activity[dayKey(now)] = { seconds: 30, answers: 1 };
  assert.equal(streak(state, now), 2);
});


test('copied punctuation and direction controls do not reject a correct answer', () => {
  assert.ok(matchesAnswer('¡ Hola !', 'Hola', 'es'));
  assert.ok(matchesAnswer('\u2067شكرًا\u2069', 'شكرا', 'ar'));
  assert.ok(matchesAnswer('\u200fكيف حالك؟\u200f', 'كيف حالك', 'ar'));
  assert.ok(matchesAnswer('HOLA', 'Hola', 'es'));
  assert.ok(matchesAnswer('Adio\u0301s', 'Adiós', 'es'));
  assert.equal(matchesAnswer('Adios', 'Adiós', 'es'), false);
});

test('successful optional practice preserves the due date until spaced recall is due', () => {
  const now = 1_800_000_000_000;
  const previous = { stage: 2, due: now + DAY };
  const before = structuredClone(previous);
  assert.deepEqual(scheduleReview(previous, true, now), previous);
  assert.deepEqual(previous, before);
  assert.deepEqual(scheduleReview(previous, true, previous.due), { stage: 3, due: previous.due + 14 * DAY });
  assert.deepEqual(scheduleReview(previous, false, now), { stage: 0, due: now + 600_000, retry: true });
  assert.deepEqual(scheduleReview({ stage: 0, due: now + 600_000, retry: true }, true, now), { stage: 0, due: now + DAY });
});

test('repeating a lesson early cannot postpone recall, but misses still schedule a retry', () => {
  const now = 1_800_000_000_000;
  const answers = [{ id: 'hello', correct: true }];
  let state = completeLesson(defaultState(), 'greetings', answers, 30, now);
  for (let i = 1; i <= 5; i++) state = completeLesson(state, 'greetings', answers, 30, now + i * 60_000);
  assert.deepEqual(state.reviews['es:hello'], { stage: 0, due: now + DAY });
  state = completeLesson(state, 'greetings', [{ id: 'hello', correct: true }, { id: 'hello', correct: false }], 30, now + 600_000);
  assert.deepEqual(state.reviews['es:hello'], { stage: 0, due: now + 1_200_000, retry: true });
});

test('each lesson gives every phrase production practice and Mandarin has no blank word chips', () => {
  for (const target of languages) for (const source of languages.filter(language => language.id !== target.id)) for (const unit of units) {
    for (const random of [() => .01, () => .4, () => .99]) {
      const exercises = exerciseSet(unit, target.id, source.id, random);
      const production = exercises.filter(exercise => exercise.kind !== 'choice');
      assert.equal(production.filter(exercise => exercise.kind === 'build').length, 3);
      assert.equal(production.filter(exercise => exercise.kind === 'type').length, 3);
      assert.deepEqual(production.map(exercise => exercise.id).sort(), [...unit.ids].sort());
      for (const exercise of production.filter(exercise => exercise.kind === 'build')) assert.ok(exercise.tokens.every(token => token.trim().length > 0));
    }
  }
  assert.deepEqual(tokenize('是 / 不是', 'zh'), ['是', '不', '是']);
});

test('backup imports discard malformed keys and impossible calendar days without losing valid progress', () => {
  const raw = {
    ...defaultState(),
    completed: { 'es:greetings': { at: 100, score: 75 }, 'es:greetings:extra': { at: 100, score: 75 } },
    reviews: { 'es:hello': { due: 100, stage: 0 }, 'es:hello:extra': { due: 100, stage: 0 } },
    activity: {
      '2024-02-29': { seconds: 60, answers: 1 },
      '2026-02-29': { seconds: 60, answers: 1 },
      '2026-02-31': { seconds: 60, answers: 1 },
      '2026-10-08': { seconds: 60, answers: Number.MAX_SAFE_INTEGER + 1 }
    }
  };
  const before = structuredClone(raw);
  const clean = validateState(raw);
  assert.deepEqual(Object.keys(clean.completed), ['es:greetings']);
  assert.deepEqual(Object.keys(clean.reviews), ['es:hello']);
  assert.deepEqual(Object.keys(clean.activity), ['2024-02-29']);
  assert.deepEqual(raw, before);
});
