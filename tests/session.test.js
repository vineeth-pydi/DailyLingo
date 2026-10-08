import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as content from '../src/content.js';
import * as core from '../src/core.js';
import { restoreDrafts } from '../src/drafts.js';
import * as audioUI from '../src/audio-ui.js';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');

function harness(initial = core.defaultState()) {
  const clock = { now: new Date(2026, 9, 8, 9).getTime() };
  class ControlledDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const events = new Map();
  const focus = [];
  const spoken = [];
  const storage = new Map([[core.STORAGE_KEY, JSON.stringify(initial)]]);
  const environment = { noWords: false };
  const node = selector => ({
    innerHTML: '', textContent: '', classList: { add() {}, remove() {} },
    focus() { focus.push(selector); }, close() {}, showModal() {}, addEventListener() {},
    querySelector(child) { return child === '.word-bank .word-chip:not(:disabled)' && environment.noWords ? null : node(child); }
  });
  const nodes = new Map(['#app', '#lesson-dialog', '#confirm-dialog', '#toast', '#main'].map(id => [id, node(id)]));
  function listen(surface, name, callback) {
    const key = surface + ':' + name;
    if (!events.has(key)) events.set(key, []);
    events.get(key).push(callback);
  }
  const document = { hidden: false, querySelector: id => nodes.get(id) ?? node(id), addEventListener: (name, callback) => listen('document', name, callback) };
  const context = vm.createContext({
    ...content, ...core, ...audioUI, restoreDrafts, structuredClone, Date: ControlledDate,
    dayKey: (time = clock.now) => core.dayKey(time),
    dueReviews: (state, time = clock.now) => core.dueReviews(state, time),
    streak: (state, time = clock.now) => core.streak(state, time),
    scheduleReview: (previous, correct, time = clock.now) => core.scheduleReview(previous, correct, time),
    addActivity: (state, seconds, answers, time = clock.now) => core.addActivity(state, seconds, answers, time),
    completeLesson: (state, unit, answers, seconds, time = clock.now) => core.completeLesson(state, unit, answers, seconds, time),
    REPOSITORY_URL: '', mountSpeechPractice() {}, disposeSpeechPractice() {}, speakText(...args) { spoken.push(args); }, resetSpeechPreferences() {},
    document, window: { addEventListener: (name, callback) => listen('window', name, callback) },
    navigator: {}, location: { hash: '#home' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    setTimeout() { return 1; }, clearTimeout() {}
  });
  vm.runInContext(appSource + '\nglobalThis.inspect = { startReview, startLesson, checkAnswer, nextExercise, closeLesson, renderExercise, homeView, coursesView, phraseCards, state: () => state, session: () => session };', context);
  return {
    ...context.inspect, focus, spoken, environment, document, clock,
    html(selector = '#lesson-dialog') { return nodes.get(selector).innerHTML; },
    advance(seconds) { clock.now += seconds * 1000; },
    saved() { return JSON.parse(storage.get(core.STORAGE_KEY)); },
    activity() { return this.saved().activity[core.dayKey(clock.now)]; },
    dispatch(surface, name, event = {}) { for (const callback of events.get(surface + ':' + name) ?? []) callback(event); },
    click(action, data = {}) {
      const button = { dataset: { action, ...data }, disabled: false };
      this.dispatch('document', 'click', { target: { closest: selector => selector === '[data-action]' ? button : null } });
    }
  };
}

test('checked review answers survive lifecycle events with one count and one scheduled retry', () => {
  const app = harness();
  app.startReview([content.findConcept('hello'), content.findConcept('thanks')]);
  app.advance(2); app.session().typed = 'wrong'; app.checkAnswer();
  const due = app.saved().reviews['es:hello'].due;
  assert.equal(app.activity().answers, 1);
  assert.equal(app.activity().seconds, 2);
  assert.equal(app.saved().reviews['es:hello'].retry, true);
  app.advance(1);
  app.dispatch('window', 'pagehide'); app.dispatch('window', 'beforeunload');
  app.document.hidden = true; app.dispatch('document', 'visibilitychange');
  assert.equal(app.activity().answers, 1);
  assert.equal(app.activity().seconds, 3);
  assert.equal(app.saved().reviews['es:hello'].due, due);
  app.closeLesson(); app.dispatch('window', 'pagehide');
  assert.equal(app.activity().answers, 1);
  assert.equal(app.activity().seconds, 3);
});

test('finishing and closing a review does not duplicate answers or count time spent on its summary', () => {
  const app = harness();
  app.startReview([content.findConcept('hello'), content.findConcept('thanks')]);
  app.advance(2); app.session().typed = 'Hola'; app.checkAnswer(); app.nextExercise();
  app.advance(3); app.session().typed = 'Gracias'; app.checkAnswer(); app.nextExercise();
  assert.equal(app.session().finished, true);
  assert.equal(app.activity().answers, 2);
  assert.equal(app.activity().seconds, 5);
  app.advance(30); app.dispatch('window', 'pagehide'); app.closeLesson();
  assert.equal(app.activity().answers, 2);
  assert.equal(app.activity().seconds, 5);
  assert.equal(app.saved().reviews['es:hello'].stage, 0);
  assert.equal(app.saved().reviews['es:thanks'].stage, 0);
});

test('lesson answers remain resumable drafts until completion and resume at the next question', () => {
  const app = harness();
  app.startLesson('greetings');
  app.advance(4); app.session().selected = app.session().exercises[0].id; app.checkAnswer();
  app.dispatch('window', 'pagehide'); app.dispatch('window', 'beforeunload'); app.closeLesson();
  const saved = app.saved();
  assert.equal(saved.drafts['es:en:greetings'].index, 1);
  assert.equal(saved.drafts['es:en:greetings'].answers.length, 1);
  assert.deepEqual(saved.completed, {});
  assert.deepEqual(saved.activity, {});
  const resumed = harness(saved); resumed.startLesson('greetings');
  assert.equal(resumed.session().index, 1);
  assert.equal(resumed.session().answers.length, 1);
});

test('a fully answered draft finalizes once when resumed', () => {
  const state = core.defaultState();
  const exercises = core.exerciseSet(content.units[0], 'es', 'en', () => .4);
  state.drafts['es:en:greetings'] = { exercises, index: 12, elapsed: 30, answers: exercises.map(exercise => ({ id: exercise.id, correct: true })) };
  const app = harness(state); app.startLesson('greetings');
  assert.equal(app.activity().answers, 12);
  assert.equal(app.activity().seconds, 30);
  assert.equal(app.saved().completed['es:greetings'].score, 100);
  assert.deepEqual(app.saved().drafts, {});
  app.closeLesson(); app.dispatch('window', 'beforeunload');
  assert.equal(app.activity().answers, 12);
  assert.equal(app.activity().seconds, 30);
});

test('choice and word-bank rerenders preserve usable keyboard focus', () => {
  const app = harness(); app.startLesson('greetings');
  app.focus.length = 0;
  app.click('select-answer', { answer: 'hello' });
  assert.equal(app.focus.at(-1), '[data-action="select-answer"][data-answer="hello"]');
  app.session().index = 6; app.session().selected = ''; app.session().chosen = [];
  app.renderExercise(); app.focus.length = 0;
  app.click('pick-word', { index: '0' });
  assert.equal(app.focus.at(-1), '.word-bank .word-chip:not(:disabled)');
  app.environment.noWords = true;
  app.click('pick-word', { index: '1' });
  assert.equal(app.focus.at(-1), 'button[type="submit"]');
  app.environment.noWords = false;
  app.session().chosen = [0]; app.click('unpick-word', { index: '0' });
  assert.equal(app.focus.at(-1), '.word-bank .word-chip:not(:disabled)');
});

test('source and target playback remain correct through choice, recall, hints and feedback for every language pair', () => {
  for (const target of content.languages) for (const source of content.languages.filter(value => value.id !== target.id)) {
    const state = core.defaultState(); state.target = target.id; state.source = source.id;
    const app = harness(state); app.startLesson('greetings');
    let html = app.html();
    assert.ok(html.includes(`data-audio-language="${target.id}"`));
    assert.ok(html.includes(`data-audio-language="${source.id}"`));
    for (const choice of app.session().exercises[0].choices) {
      assert.ok(html.includes(audioUI.audioButton(choice.text, source)));
      assert.ok(html.includes(audioUI.wordAudio(choice.text, source)));
    }
    assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>).)*<button/s);
    // Typed recall must play the displayed source prompt without exposing audio
    // for the expected target answer until the learner asks for a hint/check.
    const recallIndex = app.session().exercises.findIndex(exercise => exercise.kind === 'type');
    app.session().index = recallIndex; app.renderExercise(); html = app.html();
    const concept = content.findConcept(app.session().exercises[recallIndex].id);
    assert.ok(html.includes(audioUI.audioButton(concept.forms[source.id], source)));
    assert.ok(!html.includes(`data-audio-language="${target.id}"`));
    app.session().typed = 'practice'; app.renderExercise();
    assert.ok(app.html().includes('aria-label="Listen to your typed answer"'));
    app.click('hint'); html = app.html();
    assert.ok(html.includes(audioUI.audioButton(concept.forms[target.id], target)));
    app.session().typed = concept.forms[target.id]; app.checkAnswer(); html = app.html();
    assert.ok(html.includes('feedback-target'));
    assert.ok(html.includes(audioUI.audioText(concept.forms[source.id], source, { className: 'feedback-meaning' })));
  }
});

test('build token speakers are siblings of selection buttons and remain available after selection', () => {
  const app = harness(); app.startLesson('greetings');
  app.session().index = app.session().exercises.findIndex(exercise => exercise.kind === 'build');
  app.renderExercise();
  const exercise = app.session().exercises[app.session().index];
  assert.equal((app.html().match(/class="word-chip-control"/g) ?? []).length, exercise.tokens.length);
  for (const token of exercise.tokens) assert.ok(app.html().includes(audioUI.audioButton(token, content.findLanguage('es'))));
  app.click('pick-word', { index: '0' });
  assert.ok(app.html().includes('Listen to your arranged phrase'));
  assert.equal((app.html().match(/class="word-chip-control"/g) ?? []).length, exercise.tokens.length + 1);
  assert.doesNotMatch(app.html(), /<button[^>]*>(?:(?!<\/button>).)*<button/s);
});

test('home, course and review learning phrases offer matching-language audio and per-word controls', () => {
  for (const target of content.languages) {
    const state = core.defaultState(); state.target = target.id; state.source = target.id === 'en' ? 'es' : 'en';
    const app = harness(state);
    assert.ok(app.homeView().includes(audioUI.audioButton(target.greeting, target)));
    const courses = app.coursesView();
    for (const language of content.languages) {
      assert.ok(courses.includes(audioUI.audioButton(language.greeting, language)));
      assert.ok(courses.includes(audioUI.audioButton(language.native, language)));
    }
    const concept = content.findConcept('how-are-you');
    const review = app.phraseCards([[`${target.id}:${concept.id}`, { due: Date.now() }]]);
    for (const language of [target, content.findLanguage(state.source)]) {
      assert.ok(review.includes(audioUI.audioButton(concept.forms[language.id], language)));
      assert.ok(review.includes(audioUI.wordAudio(concept.forms[language.id], language)));
    }
  }
});

test('speaker clicks invoke audio without selecting or changing an answer', () => {
  const app = harness(); app.startLesson('greetings');
  const button = { disabled: false, dataset: { audioText: 'Hello', audioLanguage: 'en', audioSlow: 'false' } };
  app.dispatch('document', 'click', { target: { closest: selector => selector === '[data-audio-text]' ? button : null }, preventDefault() {} });
  assert.equal(app.spoken.length, 1);
  assert.equal(app.spoken[0][0], 'Hello');
  assert.equal(app.spoken[0][1].id, 'en');
  assert.equal(app.session().selected, '');
  assert.equal(app.session().answers.length, 0);
});
