import { findLanguage, findUnit, findConcept } from './content.js';
import { tokenize } from './core.js';

// Saved drafts are browser data too. Reconstruct only the fields the lesson uses.
export function restoreDrafts(value) {
  const clean = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  for (const [key, draft] of Object.entries(value)) {
    const parts = key.split(':');
    if (parts.length !== 3) continue;
    const [target, source, unitId] = parts;
    const unit = findUnit(unitId);
    if (!findLanguage(target) || !findLanguage(source) || target === source || !unit || !draft ||
        !Number.isInteger(draft.index) || draft.index < 0 || draft.index > 12 ||
        !Number.isFinite(draft.elapsed) || draft.elapsed < 0 || draft.elapsed > 86400 ||
        !Array.isArray(draft.exercises) || draft.exercises.length !== 12 ||
        !Array.isArray(draft.answers) || draft.answers.length !== draft.index) continue;
    const exercises = [];
    for (const exercise of draft.exercises) {
      if (!exercise || !unit.ids.includes(exercise.id)) break;
      const item = findConcept(exercise.id);
      if (exercise.kind === 'choice') {
        if (!Array.isArray(exercise.choices) || exercise.choices.length !== 4 ||
            new Set(exercise.choices.map(choice => choice?.id)).size !== 4 ||
            !exercise.choices.some(choice => choice?.id === item.id) ||
            !exercise.choices.every(choice => unit.ids.includes(choice?.id) && choice.text === findConcept(choice.id).forms[source])) break;
        exercises.push({ id: item.id, kind: 'choice', choices: exercise.choices.map(({ id, text }) => ({ id, text })) });
      } else if (exercise.kind === 'build') {
        const expected = tokenize(item.forms[target], target).sort();
        if (!Array.isArray(exercise.tokens) || !exercise.tokens.every(token => typeof token === 'string')) break;
        // Legacy Mandarin drafts included blank chips around separators such as '/'.
        // Remove only whitespace chips, then validate the complete phrase as usual.
        const tokens = target === 'zh' ? exercise.tokens.filter(token => token.trim()) : exercise.tokens;
        if (tokens.length !== expected.length ||
            [...tokens].sort().some((token, index) => token !== expected[index])) break;
        exercises.push({ id: item.id, kind: 'build', tokens: [...tokens] });
      } else if (exercise.kind === 'type') exercises.push({ id: item.id, kind: 'type' });
      else break;
    }
    if (exercises.length !== 12 || !draft.answers.every((answer, index) => answer &&
        answer.id === exercises[index].id && typeof answer.correct === 'boolean')) continue;
    clean[key] = { exercises, index: draft.index, elapsed: draft.elapsed,
      answers: draft.answers.map(({ id, correct }) => ({ id, correct })) };
  }
  return clean;
}
