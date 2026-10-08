import { languages, units, findConcept } from './content.js';

export const STORAGE_KEY = 'freelingo.v1';
export const DAY = 86_400_000;
const languageIds = new Set(languages.map(l => l.id));
const unitIds = new Set(units.map(u => u.id));

export function defaultState() {
  return { version: 1, target: 'es', source: 'en', goal: 10, showAids: true, completed: {}, reviews: {}, activity: {}, drafts: {} };
}

export function dayKey(time = Date.now()) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function normalize(text, language) {
  // Copied right-to-left text may contain invisible direction controls. They are
  // display metadata, not part of a learner's answer. Case handling stays locale-independent.
  let result = String(text).normalize('NFC').toLowerCase().replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[\p{P}\p{S}]/gu, '').replace(/\s+/g, ' ').trim();
  // Optional Arabic vowel signs/tatweel, but keep letters and Hindi vowel signs.
  if (language === 'ar') result = result.replace(/[\u0640\u064B-\u0652\u0670]/g, '');
  if (language === 'zh') result = result.replace(/\s/g, '');
  return result;
}

export function matchesAnswer(input, expected, language) {
  return normalize(input, language) === normalize(expected, language);
}

export function tokenize(text, language) {
  const clean = text.replace(/[\p{P}\p{S}]/gu, '').trim();
  return language === 'zh' ? Array.from(clean.replace(/\s/g, '')) : clean.split(/\s+/).filter(Boolean);
}

export function shuffle(array, random = Math.random) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isCalendarDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(`${key}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key;
}

export function validateState(value) {
  if (!value || value.version !== 1 || !languageIds.has(value.target) || !languageIds.has(value.source) || value.target === value.source || ![5, 10, 15, 20].includes(value.goal) || typeof value.showAids !== 'boolean') throw new Error('This is not a supported DailyLingo backup.');
  const clean = defaultState();
  for (const key of ['target', 'source', 'goal', 'showAids']) clean[key] = value[key];
  for (const [key, item] of Object.entries(value.completed ?? {})) {
    const [lang, unit, extra] = key.split(':');
    if (extra === undefined && languageIds.has(lang) && unitIds.has(unit) && Number.isFinite(item?.at) && item.at >= 0 && item.at <= 8.64e15 && Number.isInteger(item?.score) && item.score >= 0 && item.score <= 100) clean.completed[key] = { at: item.at, score: item.score };
  }
  for (const [key, item] of Object.entries(value.reviews ?? {})) {
    const [lang, concept, extra] = key.split(':');
    if (extra === undefined && languageIds.has(lang) && findConcept(concept) && Number.isFinite(item?.due) && item.due >= 0 && item.due <= 8.64e15 && Number.isInteger(item?.stage) && item.stage >= 0 && item.stage <= 4) clean.reviews[key] = { due: item.due, stage: item.stage, ...(item.retry === true ? { retry: true } : {}) };
  }
  for (const [key, item] of Object.entries(value.activity ?? {})) {
    if (isCalendarDay(key) && Number.isFinite(item?.seconds) && item.seconds >= 0 && item.seconds <= 86400 && Number.isSafeInteger(item?.answers) && item.answers >= 0) clean.activity[key] = { seconds: item.seconds, answers: item.answers };
  }
  // In-progress drafts are transient; do not trust them across backup imports.
  return clean;
}

export function scheduleReview(previous, correct, now = Date.now()) {
  // Optional practice before the due date must not turn immediate repetition
  // into evidence of long-term recall. A successful retry still starts at one day.
  if (correct && previous && !previous.retry && previous.due > now) return { stage: previous.stage, due: previous.due };
  const stage = correct ? previous?.retry ? 0 : Math.min((previous?.stage ?? -1) + 1, 4) : 0;
  const interval = correct ? [1, 3, 7, 14, 30][stage] * DAY : 10 * 60_000;
  return { stage, due: now + interval, ...(!correct ? { retry: true } : {}) };
}

export function dueReviews(state, now = Date.now()) {
  return Object.entries(state.reviews).filter(([key, review]) => key.startsWith(`${state.target}:`) && review.due <= now).sort((a, b) => a[1].due - b[1].due).map(([key]) => findConcept(key.split(':')[1]));
}

export function completeLesson(state, unitId, answers, seconds, now = Date.now()) {
  const next = structuredClone(state);
  const score = Math.round(answers.filter(answer => answer.correct).length / Math.max(1, answers.length) * 100);
  next.completed[`${state.target}:${unitId}`] = { at: now, score };
  for (const id of new Set(answers.map(answer => answer.id))) {
    const correct = answers.filter(answer => answer.id === id).every(answer => answer.correct);
    const key = `${state.target}:${id}`;
    next.reviews[key] = scheduleReview(state.reviews[key], correct, now);
  }
  addActivity(next, seconds, answers.length, now);
  return next;
}

export function addActivity(state, seconds, answers, now = Date.now()) {
  const key = dayKey(now);
  const previous = state.activity[key] ?? { seconds: 0, answers: 0 };
  state.activity[key] = { seconds: Math.min(86400, previous.seconds + Math.max(0, seconds)), answers: previous.answers + answers };
}

export function streak(state, now = Date.now()) {
  let count = 0;
  const date = new Date(now);
  if (!state.activity[dayKey(date.getTime())]?.answers) date.setDate(date.getDate() - 1);
  while (state.activity[dayKey(date.getTime())]?.answers) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

export function exerciseSet(unit, target, source, random = Math.random) {
  const items = unit.ids.map(findConcept);
  // Every phrase gets one recognition question and one production question.
  const production = shuffle(items, random);
  const split = Math.ceil(production.length / 2);
  return [
    ...items.map(item => ({ kind: 'choice', id: item.id, choices: shuffle([item, ...shuffle(items.filter(other => other.id !== item.id), random).slice(0, 3)], random).map(c => ({ id: c.id, text: c.forms[source] })) })),
    ...production.slice(0, split).map(item => ({ kind: 'build', id: item.id, tokens: shuffle(tokenize(item.forms[target], target), random) })),
    ...production.slice(split).map(item => ({ kind: 'type', id: item.id }))
  ];
}
