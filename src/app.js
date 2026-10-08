import { languages, units, concepts, findLanguage, findConcept, findUnit } from './content.js';
import { STORAGE_KEY, defaultState, validateState, dayKey, dueReviews, streak, exerciseSet, completeLesson, addActivity, scheduleReview, matchesAnswer, DAY } from './core.js';
import { REPOSITORY_URL } from './config.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#lesson-dialog');
const confirmation = document.querySelector('#confirm-dialog');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const paths = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  book: '<path d="M3 4h6c2 0 3 1 3 3v14c0-2-1-3-3-3H3zM21 4h-6c-2 0-3 1-3 3v14c0-2 1-3 3-3h6z"/>',
  repeat: '<path d="M20 7H7a4 4 0 0 0-4 4M16 3l4 4-4 4M4 17h13a4 4 0 0 0 4-4M8 13l-4 4 4 4"/>',
  chart: '<path d="M4 20V12M12 20V4M20 20V8"/>',
  settings: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  speaker: '<path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
  fire: '<path d="M12 3c2 4-1 5 2 8l3-3c5 6 2 13-5 13-7 0-10-7-5-13 0 4 3 4 5-5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  wave: '<path d="M5 13V8a2 2 0 0 1 4 0v5M9 12V5a2 2 0 0 1 4 0v7M13 12V7a2 2 0 0 1 4 0v7M17 13v-2a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7c-4 0-6-2-8-5l-3-4a2 2 0 0 1 2-3l4 4"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M19 21v-3a6 6 0 0 0-3-5"/>',
  cup: '<path d="M3 8h13v7a6 6 0 0 1-12 0V8M16 8h2a3 3 0 0 1 0 6h-2M3 22h15M6 2v3M12 2v3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9H4l-3 2 2-7a9 9 0 1 1 18-4zM7 10h10M7 14h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  leaf: '<path d="M20 3C7 2 2 8 5 15s13 4 15-12zM4 21 16 9"/>',
  github: '<path d="M9 21v-4c-5 1-5-3-7-3M15 21v-4c0-1 0-2-1-2 4 0 7-2 7-6 0-2-1-3-2-4 0-1 0-3-1-3l-4 2H10L6 2c-1 0-1 2-1 3-1 1-2 2-2 4 0 4 3 6 7 6-1 0-1 1-1 2"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
const logo = '<span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M9 11h13a8 8 0 0 1 8 8v11H17a8 8 0 0 1-8-8z" stroke="currentColor" stroke-width="2.5"/><path d="M16 18h8m-8 6h5M32 5v8m-4-4h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></span>';
let storageAvailable = true;
let storageNotice = '';
let state = load();
let session = null;
let toastTimer;
let installPrompt;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const value = JSON.parse(raw);
    const clean = validateState(value);
    for (const [key, draft] of Object.entries(value.drafts ?? {})) {
      const [target, source, unit] = key.split(':');
      const lesson = findUnit(unit);
      if (!findLanguage(target) || !findLanguage(source) || target === source || !lesson || !Number.isInteger(draft.index) || draft.index < 0 || draft.index > 12 || !Array.isArray(draft.exercises) || draft.exercises.length !== 12 || !Array.isArray(draft.answers) || draft.answers.length !== draft.index || !Number.isFinite(draft.elapsed)) continue;
      if (draft.exercises.every(ex => lesson.ids.includes(ex.id) && ['choice', 'build', 'type'].includes(ex.kind)) && draft.answers.every(answer => lesson.ids.includes(answer.id) && typeof answer.correct === 'boolean')) clean.drafts[key] = draft;
    }
    return clean;
  } catch { storageNotice = 'Saved progress could not be read. Export or back up browser data before making changes if you need to recover it.'; return defaultState(); }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { storageAvailable = false; toast('Progress could not be saved. Export a backup from Settings before closing this tab.'); }
}

function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('visible'), 6500);
}

const route = () => ['home', 'courses', 'review', 'progress', 'settings', 'about'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
const completedCount = language => units.filter(unit => state.completed[`${language}:${unit.id}`]).length;
const currentLanguage = () => findLanguage(state.target);
const nextUnit = () => units.find(unit => !state.completed[`${state.target}:${unit.id}`]) ?? units[0];
const languageBadge = (language, cls = '') => `<span class="language-badge ${cls}" style="--badge:${language.color};--badge-ink:${language.ink}" lang="${language.id}" dir="${language.direction}">${language.id === 'zh' ? '文' : language.id === 'hi' ? 'अ' : language.id === 'ar' ? 'ع' : language.short}</span>`;

function render() {
  const view = route();
  const language = currentLanguage();
  const due = dueReviews(state).length;
  const titles = { home: 'Your learning space', courses: 'Explore languages', review: 'Make it stick', progress: 'Your progress', settings: 'Make yourself at home', about: 'Open by design' };
  app.innerHTML = `
    <aside class="sidebar">
      <a href="#home" class="brand" aria-label="FreeLingo home">${logo}<span>Free<span class="brand-light">Lingo</span></span></a>
      <span class="sidebar-label">YOUR LITTLE DAILY ADVENTURE</span>
      <nav aria-label="Main navigation">${[['home', 'home', 'Learn'], ['courses', 'globe', 'Languages'], ['review', 'repeat', 'Review'], ['progress', 'chart', 'Progress']].map(([id, glyph, label]) => `<a href="#${id}" ${view === id ? 'aria-current="page"' : ''} class="nav-link ${view === id ? 'active' : ''}">${icon(glyph)}<span>${label}</span>${id === 'review' && due ? `<span class="nav-count">${due}</span>` : ''}</a>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="open-note">${icon('leaf')}<strong>Knowledge belongs<br>to everyone.</strong><p>Free to learn.<br>Open to build together.</p><a href="#about">Meet the project ${icon('arrow')}</a></div><a href="#settings" class="nav-link ${view === 'settings' ? 'active' : ''}" ${view === 'settings' ? 'aria-current="page"' : ''}>${icon('settings')}<span>Settings</span></a><div class="profile"><span class="avatar">Y</span><div><strong>Your learning space</strong><small>Saved on this device</small></div><span class="profile-dot" title="Device-local progress"></span></div></div>
    </aside>
    <div class="workspace"><header class="topbar"><span>${escape(titles[view])}</span><div class="header-actions"><span class="streak-chip">${icon('fire')} ${streak(state)} <span>day${streak(state) === 1 ? '' : 's'}</span></span><label class="language-select-label">${languageBadge(language, 'tiny')}<select id="target-header" aria-label="Learning language">${languages.map(l => `<option value="${l.id}" ${l.id === state.target ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label><a class="icon-button header-settings" href="#settings" aria-label="Practice settings">${icon('settings')}</a></div></header>
    <main id="main" tabindex="-1">${view === 'home' ? homeView() : view === 'courses' ? coursesView() : view === 'review' ? reviewView() : view === 'progress' ? progressView() : view === 'settings' ? settingsView() : aboutView()}</main><footer class="footer"><span>A little practice. A world of possibility.</span><a href="#about">Free & open source ${icon('github')}</a></footer></div>`;
  document.title = `FreeLingo · ${titles[view]}`;
}

function homeView() {
  const language = currentLanguage();
  const unit = nextUnit();
  const draft = state.drafts[`${state.target}:${state.source}:${unit.id}`];
  const completed = completedCount(state.target);
  const daily = state.activity[dayKey()] ?? { seconds: 0, answers: 0 };
  const minutes = Math.floor(daily.seconds / 60);
  const due = dueReviews(state).length;
  return `<section class="welcome"><div><p class="eyebrow">MAKE ROOM FOR SOMETHING NEW</p><h1>One little lesson.<br>A little closer to the world.</h1><p>Your next conversation starts here. Let’s keep going.</p></div><span class="date-label">${new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</span></section>
  <div class="home-columns"><div class="learning-column"><section class="hero-card"><div class="hero-content"><span class="pill">${languageBadge(language, 'tiny')} YOUR ${language.name.toUpperCase()} JOURNEY</span><h2>${completed === units.length ? 'Keep the words flowing.' : completed === 0 ? 'A new world starts<br>with a simple hello.' : escape(unit.title) + '.'}</h2><p>${escape(unit.goal)}<br>Six useful phrases. One small step.</p><button class="button primary" data-action="lesson" data-unit="${unit.id}">${draft ? 'Resume lesson' : completed === 0 ? 'Let’s begin' : 'Continue learning'} ${icon('arrow')}</button><span class="hero-meta">${icon('clock')} About 5 minutes <span>·</span> Lesson ${units.indexOf(unit) + 1} of 6</span></div><div class="hero-art" aria-hidden="true"><span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span><span class="art-dot dot-one"></span><span class="art-dot dot-two"></span><div class="speech-card speech-back" lang="ar" dir="rtl">مرحبًا<span>MARḤABAN</span></div><div class="speech-card speech-front" lang="${language.id}" dir="${language.direction}">${escape(language.greeting)}<span>${language.id === 'en' ? 'LET’S CONNECT' : 'A WORLD OF HELLOS'}</span></div><span class="art-spark">✳</span><span class="art-caption">Connection is a language, too.</span></div></section>
  <div class="section-heading"><div><h2>Your path, one step at a time</h2><p>Small lessons for real-life moments.</p></div><a href="#courses" class="text-link">All languages ${icon('arrow')}</a></div>
  <div class="lesson-list">${units.map((lesson, index) => {
    const done = state.completed[`${state.target}:${lesson.id}`];
    return `<button class="lesson-row ${lesson.id === unit.id ? 'next' : ''}" data-action="lesson" data-unit="${lesson.id}"><span class="lesson-number ${done ? 'done' : ''}">${done ? icon('check') : String(index + 1).padStart(2, '0')}</span><span class="lesson-icon">${icon(lesson.icon)}</span><span class="lesson-info"><strong>${escape(lesson.title)}</strong><small>${escape(lesson.subtitle)}</small></span><span class="lesson-status">${done ? 'Practiced' : lesson.id === unit.id ? 'Up next' : '6 phrases'}</span>${icon('chevron')}</button>`;
  }).join('')}</div></div>
  <aside class="right-column"><section class="goal-card"><div class="small-heading"><h2>Your daily moment</h2>${icon('sun')}</div><div class="goal-ring" style="--progress:${Math.min(100, daily.seconds / (state.goal * 60) * 100)}"><div><strong>${minutes}<span> / ${state.goal}</span></strong><small>minutes practiced</small></div></div><p>${daily.seconds >= state.goal * 60 ? 'You made room for learning today.' : 'A few minutes today.<br>A habit that opens doors.'}</p><a href="#settings" class="text-link">Adjust your goal ${icon('arrow')}</a></section><section class="review-card"><span class="soft-icon">${icon('repeat')}</span><h2>A quick refresh?</h2><p>${due ? `${due} phrase${due === 1 ? '' : 's'} ready for another look. Help them find a place in your memory.` : 'Your words grow stronger when you revisit them. Reviews will appear after your first lesson.'}</p><button class="button secondary" data-action="review">${due ? 'Review phrases' : 'Explore review'} ${icon('arrow')}</button></section><section class="mini-progress"><div class="small-heading"><h2>Growing a little</h2><span>${completed}/6</span></div><div class="progress-track"><span style="width:${completed / 6 * 100}%"></span></div><p>${completed} lesson${completed === 1 ? '' : 's'} practiced in ${language.name}</p></section></aside></div>
  <section class="world-strip"><div class="world-icon">${icon('globe')}</div><div><strong>Five languages. Countless connections.</strong><span>No paywalls. No pressure. Just a place to learn.</span></div><div class="language-stack">${languages.map(l => languageBadge(l, 'tiny')).join('')}</div></section>`;
}

function coursesView() {
  return `<section class="page-intro"><p class="eyebrow">CHOOSE YOUR NEXT CONNECTION</p><h1>So many ways to say hello.</h1><p>Five widely spoken languages. Start somewhere that matters to you.</p></section><div class="course-grid">${languages.map(language => `<article class="course-card" style="--course-color:${language.color};--course-ink:${language.ink}"><div class="course-visual"><span class="course-greeting" lang="${language.id}" dir="${language.direction}">${escape(language.greeting)}</span>${languageBadge(language)}<span class="course-flower">✳</span></div><div class="course-body"><p class="eyebrow">BEGINNER · COMMUNITY ALPHA</p><h2>${language.name}<span lang="${language.id}" dir="${language.direction}">${language.native}</span></h2><p>${language.description}</p><div class="course-meta">6 lessons <span>·</span> 36 phrases</div><div class="progress-track"><span style="width:${completedCount(language.id) / 6 * 100}%"></span></div><button class="button ${language.id === state.target ? 'primary' : 'secondary'}" data-action="choose-language" data-language="${language.id}">${language.id === state.target ? 'Continue learning' : 'Start learning'} ${icon('arrow')}</button></div></article>`).join('')}<article class="contribute-card">${icon('leaf')}<h2>Make a good thing<br>grow.</h2><p>Know a language well? Help review phrases, improve explanations, or build the next feature.</p><a href="#about" class="text-link">Build with us ${icon('arrow')}</a></article></div><div class="info-note">${icon('book')}<p>These starter courses teach useful phrases. They are not complete A1 curricula or certified assessments. Native review, richer grammar, and recorded audio are on the roadmap.</p></div>`;
}

function reviewView() {
  const all = Object.entries(state.reviews).filter(([key]) => key.startsWith(`${state.target}:`));
  const due = dueReviews(state);
  return `<section class="page-intro"><p class="eyebrow">A LITTLE REPETITION GOES A LONG WAY</p><h1>Give your words another hello.</h1><p>Recall a phrase, check yourself, and let time do its part.</p></section><section class="review-banner"><span class="large-soft-icon">${icon('repeat')}</span><div><h2>${due.length ? `${due.length} phrases are ready for you.` : all.length ? 'You’re all caught up.' : 'Your collection starts with a lesson.'}</h2><p>${due.length ? 'A few minutes of practice will make these feel more familiar.' : all.length ? 'You can still practice any phrase below. Due reviews return as time passes.' : 'Finish a lesson to save its phrases here for future practice.'}</p></div><button class="button primary" data-action="${due.length ? 'start-review' : all.length ? 'practice-all' : 'lesson'}" data-unit="${nextUnit().id}">${due.length || all.length ? 'Start practice' : 'Start a lesson'} ${icon('arrow')}</button></section><div class="section-heading"><div><h2>Your phrase collection</h2><p>${all.length} phrases in ${currentLanguage().name}</p></div><span class="quiet-badge">Intervals: 1 · 3 · 7 · 14 · 30 days</span></div>${all.length ? `<div class="phrase-grid">${all.map(([key, review]) => {
    const item = findConcept(key.split(':')[1]);
    return `<article class="phrase-card"><div class="phrase-card-top"><span class="pill ${review.due <= Date.now() ? 'due-pill' : ''}">${review.due <= Date.now() ? 'Ready to review' : 'Next: ' + new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(review.due))}</span><button class="icon-button" data-action="speak" data-concept="${item.id}" aria-label="Listen to ${escape(item.forms[state.target])}">${icon('speaker')}</button></div><h3 lang="${state.target}" dir="${currentLanguage().direction}">${escape(item.forms[state.target])}</h3><p lang="${state.source}" dir="${findLanguage(state.source).direction}">${escape(item.forms[state.source])}</p><button class="text-link" data-action="single-review" data-concept="${item.id}">Practice this phrase ${icon('arrow')}</button></article>`;
  }).join('')}</div>` : `<div class="empty-state">${icon('book')}<h2>A fresh page.</h2><p>Your first lesson will add six useful phrases to this collection.</p></div>`}`;
}

function progressView() {
  const activity = Object.values(state.activity);
  const totalMinutes = Math.floor(activity.reduce((sum, day) => sum + day.seconds, 0) / 60);
  const practiced = Object.keys(state.completed).length;
  const stats = [[practiced, 'lessons practiced', 'book'], [Object.keys(state.reviews).length, 'phrases collected', 'chat'], [totalMinutes, 'minutes learning', 'clock'], [streak(state), 'day practice streak', 'fire']];
  return `<section class="page-intro"><p class="eyebrow">SMALL STEPS ADD UP</p><h1>Look how far you’ve come.</h1><p>Celebrate the practice. Keep making room for the next conversation.</p></section><div class="stats-grid">${stats.map(([number, label, glyph]) => `<article class="stat-card">${icon(glyph)}<strong>${number}</strong><span>${label}</span></article>`).join('')}</div><section class="activity-card"><div class="section-heading"><div><h2>A week of little moments</h2><p>Active practice time. Every day is a fresh start.</p></div><span class="quiet-badge">Your goal: ${state.goal} min / day</span></div><div class="week-chart">${Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + index);
    const minutes = (state.activity[dayKey(date.getTime())]?.seconds ?? 0) / 60;
    return `<div class="chart-day ${index === 6 ? 'today' : ''}"><span>${Math.floor(minutes)} min</span><div class="bar-space"><div class="chart-bar" style="height:${Math.max(2, Math.min(100, minutes / Math.max(state.goal, totalMinutes / 7, 1) * 100))}%" role="img" aria-label="${escape(date.toLocaleDateString('en'))}: ${Math.floor(minutes)} minutes"></div></div><strong>${new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)}</strong></div>`;
  }).join('')}</div></section><section class="language-progress"><h2>Your languages</h2>${languages.map(language => `<div class="language-progress-row">${languageBadge(language)}<div><strong>${language.name}</strong><div class="progress-track"><span style="width:${completedCount(language.id) / 6 * 100}%"></span></div></div><span>${completedCount(language.id)} / 6 lessons</span><button class="icon-button" data-action="choose-language" data-language="${language.id}" aria-label="Learn ${language.name}">${icon('arrow')}</button></div>`).join('')}</section><div class="info-note">${icon('leaf')}<p>Practice time and lesson completion show participation. They do not measure fluency or a certified proficiency level. Spaced reviews help you revisit the phrases you’ve learned.</p></div>`;
}

function settingsView() {
  return `<section class="page-intro"><p class="eyebrow">LEARNING AT YOUR PACE</p><h1>A space that feels like yours.</h1><p>Choose your rhythm. Take your progress with you.</p></section><div class="settings-grid"><section class="settings-card"><h2>Your practice</h2><label class="field-label" for="target-settings">I’m learning</label><select id="target-settings">${languages.map(l => `<option value="${l.id}" ${l.id === state.target ? 'selected' : ''}>${l.name} · ${l.native}</option>`).join('')}</select><label class="field-label" for="source-settings">Translate prompts into</label><select id="source-settings">${languages.filter(l => l.id !== state.target).map(l => `<option value="${l.id}" ${l.id === state.source ? 'selected' : ''}>${l.name} · ${l.native}</option>`).join('')}</select><p class="field-help">Menus are in English. Phrase meanings use this language.</p><label class="field-label" for="daily-goal">Daily practice goal</label><select id="daily-goal">${[5, 10, 15, 20].map(value => `<option value="${value}" ${value === state.goal ? 'selected' : ''}>${value} minutes</option>`).join('')}</select><label class="toggle-row"><span><strong>Pronunciation guides</strong><small>Show Pinyin and script reading aids</small></span><input type="checkbox" id="show-aids" ${state.showAids ? 'checked' : ''}></label><p class="field-help">Reading aids are approximations, not a replacement for listening or learning the script.</p></section><section class="settings-card"><h2>Your data stays yours</h2><p>Lessons and progress are stored in this browser. There are no accounts, tracking scripts, or app servers receiving your answers.</p><p class="field-help">Clearing browser data clears your progress. Export a backup before switching browsers or devices.</p><div class="settings-actions"><button class="button secondary" data-action="export">${icon('download')} Export progress</button><label class="button secondary import-label" for="import-file">Import backup<input type="file" id="import-file" accept=".json,application/json"></label></div><h3>Audio & privacy</h3><p class="field-help">Optional audio uses your browser’s speech service. Available voices and whether speech is processed on-device depend on your browser and operating system. No microphone is used.</p><h3>Install FreeLingo</h3><p class="field-help">Use your browser’s “Install app” or “Add to Home Screen” option. Once loaded online, the app shell and lessons are cached for offline practice. Browser voices may still need a connection.</p><button class="button secondary" data-action="install">Install help ${icon('arrow')}</button><hr><button class="danger-button" data-action="reset">Erase progress on this device</button><p class="field-help">This removes all lesson history and settings. Export first if you want a backup.</p></section></div>`;
}

function aboutView() {
  return `<section class="page-intro"><p class="eyebrow">LEARNING BELONGS TO EVERYONE</p><h1>Free to learn.<br>Open to build together.</h1><p>FreeLingo is a community alpha for language learning. No subscription. No account required.</p></section><div class="about-grid"><section class="settings-card"><span class="large-soft-icon">${icon('globe')}</span><h2>A small beginning, a shared future.</h2><p>This first release covers 36 starter phrases in English, Spanish, Mandarin, Hindi, and Modern Standard Arabic. You can learn, practice recall, and keep your progress on your own device.</p><p>Courses are original starter content awaiting independent native-speaker review. Phrases may use a specific gender or politeness form. We welcome corrections with context and regional alternatives.</p><a class="button primary" href="#courses">Find your language ${icon('arrow')}</a></section><section class="settings-card"><h2>Help the next learner</h2><p>Contribute a phrase correction, language review, accessibility improvement, or code change. The source code and original course text are available under the MIT license.</p>${REPOSITORY_URL ? `<a class="button secondary" href="${escape(REPOSITORY_URL)}" target="_blank" rel="noopener">${icon('github')} View on GitHub</a>` : '<p class="field-help">The repository is prepared for GitHub publication. The public repository link will appear here once configured.</p>'}<h3>What comes next</h3><ul class="roadmap-list"><li>Native-speaker review and approved regional variants</li><li>Recorded audio and richer pronunciation support</li><li>Script foundations and grammar in context</li><li>More complete beginner curricula and guided dialogues</li><li>An optional way to sync progress across devices</li></ul><p class="field-help">Version 0.1.0 · Community alpha · No certified proficiency claims</p></section></div>`;
}

function setTarget(id) {
  if (!findLanguage(id)) return;
  state.target = id;
  if (state.source === id) state.source = id === 'en' ? 'es' : 'en';
  save(); render();
}

function tick() {
  if (!session) return;
  const now = Date.now();
  if (!document.hidden) session.elapsed += Math.min(60, Math.max(0, (now - session.tick) / 1000));
  session.tick = now;
}

function saveDraft() {
  if (!session || session.mode !== 'lesson' || session.finished) return;
  tick();
  state.drafts[session.key] = { exercises: session.exercises, answers: session.answers, index: session.index + (session.feedback ? 1 : 0), elapsed: session.elapsed };
  save();
}

function startLesson(unitId) {
  const unit = findUnit(unitId);
  if (!unit) return;
  const key = `${state.target}:${state.source}:${unitId}`;
  const draft = state.drafts[key];
  session = { mode: 'lesson', unit, key, exercises: draft?.exercises ?? exerciseSet(unit, state.target, state.source), index: draft?.index ?? 0, answers: draft?.answers ?? [], elapsed: draft?.elapsed ?? 0, tick: Date.now(), chosen: [], selected: '', typed: '', feedback: null, usedHint: false };
  if (session.index >= session.exercises.length) finishSession(); else renderExercise();
  dialog.showModal();
}

function startReview(items) {
  if (!items.length) { location.hash = 'review'; render(); return; }
  session = { mode: 'review', exercises: items.map(item => ({ id: item.id, kind: 'type' })), index: 0, answers: [], elapsed: 0, tick: Date.now(), chosen: [], selected: '', typed: '', feedback: null, usedHint: false };
  renderExercise(); dialog.showModal();
}

function renderExercise() {
  const exercise = session.exercises[session.index];
  const item = findConcept(exercise.id);
  const language = currentLanguage();
  const isChoice = exercise.kind === 'choice';
  const hint = state.showAids && (isChoice || session.usedHint) ? item.aids[state.target] : '';
  const prompt = isChoice ? 'What does this mean?' : exercise.kind === 'build' ? 'Put the phrase together.' : 'Recall the phrase.';
  const text = item.forms[isChoice ? state.target : state.source];
  const textLang = isChoice ? state.target : state.source;
  const ready = isChoice ? !!session.selected : exercise.kind === 'build' ? session.chosen.length > 0 : !!session.typed.trim();
  dialog.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="icon-button" data-action="close-lesson" aria-label="Save and close practice">${icon('close')}</button><div class="lesson-progress"><span style="width:${session.index / session.exercises.length * 100}%"></span></div><span>${session.index + 1} / ${session.exercises.length}</span></header><div class="exercise-body"><p class="eyebrow">${session.mode === 'review' ? 'SPACED REVIEW' : `${escape(session.unit.title)} · ${language.name}`}</p><h2>${prompt}</h2><p class="exercise-instruction">${isChoice ? `Choose the meaning in ${findLanguage(state.source).name}.` : exercise.kind === 'build' ? `Arrange the words in ${language.name}.` : `Write this in ${language.name}. Punctuation and capitalization won’t affect the check.`}</p><div class="prompt-box"><span lang="${textLang}" dir="${findLanguage(textLang).direction}">${escape(text)}</span>${isChoice || session.usedHint ? `<button class="icon-button" data-action="speak" data-concept="${item.id}" aria-label="Listen to the phrase">${icon('speaker')}</button>` : ''}</div>${hint ? `<p class="reading-aid">${escape(hint)}</p>` : ''}
  <form id="answer-form">${isChoice ? `<div class="answer-options">${exercise.choices.map((option, index) => `<button type="button" class="answer-option ${session.selected === option.id ? 'selected' : ''}" data-action="select-answer" data-answer="${option.id}" ${session.feedback ? 'disabled' : ''}><span>${index + 1}</span><b lang="${state.source}" dir="${findLanguage(state.source).direction}">${escape(option.text)}</b>${session.selected === option.id ? icon('check') : ''}</button>`).join('')}</div>` : exercise.kind === 'build' ? `<div class="build-answer" dir="${language.direction}" aria-label="Your arranged phrase">${session.chosen.map((tokenIndex, index) => `<button type="button" class="word-chip" data-action="unpick-word" data-index="${index}" ${session.feedback ? 'disabled' : ''}>${escape(exercise.tokens[tokenIndex])}</button>`).join('') || '<span>Tap words below to build the phrase</span>'}</div><div class="word-bank" dir="${language.direction}">${exercise.tokens.map((token, index) => `<button type="button" class="word-chip ${session.chosen.includes(index) ? 'used' : ''}" data-action="pick-word" data-index="${index}" ${session.chosen.includes(index) || session.feedback ? 'disabled' : ''}>${escape(token)}</button>`).join('')}</div>` : `<label class="sr-only" for="typed-answer">Your answer in ${language.name}</label><input id="typed-answer" class="typed-answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${state.target}" dir="${language.direction}" placeholder="Type your answer…" value="${escape(session.typed)}" ${session.feedback ? 'disabled' : ''}><p class="keyboard-note">Use your ${language.name} keyboard${language.id === 'zh' ? ' / input method' : ''}. Need a hand? Reveal the phrase below.</p><button type="button" class="text-link" data-action="hint" ${session.feedback ? 'disabled' : ''}>${session.usedHint ? 'Phrase revealed' : 'Show a hint'}</button>${session.usedHint ? `<p class="hint-text" lang="${language.id}" dir="${language.direction}">${escape(item.forms[state.target])}</p>` : ''}`}
  <div class="lesson-bottom ${session.feedback ? session.feedback.correct ? 'correct' : 'incorrect' : ''}"><div role="status" aria-live="polite">${session.feedback ? `<strong>${session.feedback.correct ? 'You’ve got it.' : session.feedback.matched && session.usedHint ? 'Right phrase, with a little help.' : 'A little more practice will help.'}</strong><p>${session.feedback.correct ? 'Keep that phrase in your collection.' : `Expected: ${escape(item.forms[state.target])}`}</p>` : '<span>Take your time. This is practice.</span>'}</div><button class="button primary" ${session.feedback ? 'type="button" data-action="next-exercise"' : 'type="submit"'} ${!session.feedback && !ready ? 'disabled' : ''}>${session.feedback ? 'Continue' : 'Check answer'} ${icon(session.feedback ? 'arrow' : 'check')}</button></div></form></div></div>`;
  if (session.feedback) dialog.querySelector('[data-action="next-exercise"]').focus();
  else if (exercise.kind === 'type') dialog.querySelector('#typed-answer').focus();
}

function checkAnswer() {
  if (!session || session.feedback || session.finished) return;
  const exercise = session.exercises[session.index];
  const item = findConcept(exercise.id);
  tick();
  let matched;
  if (exercise.kind === 'choice') { if (!session.selected) return; matched = session.selected === item.id; }
  else if (exercise.kind === 'build') { if (!session.chosen.length) return; matched = matchesAnswer(session.chosen.map(index => exercise.tokens[index]).join(state.target === 'zh' ? '' : ' '), item.forms[state.target], state.target); }
  else { if (!session.typed.trim()) return; matched = matchesAnswer(session.typed, item.forms[state.target], state.target); }
  const correct = matched && !session.usedHint;
  session.answers.push({ id: item.id, correct });
  session.feedback = { correct, matched };
  saveDraft(); renderExercise();
}

function nextExercise() {
  if (!session?.feedback) return;
  session.index++;
  session.feedback = null; session.selected = ''; session.typed = ''; session.chosen = []; session.usedHint = false;
  if (session.index >= session.exercises.length) finishSession();
  else { saveDraft(); renderExercise(); }
}

function finishSession() {
  tick(); session.finished = true;
  const score = Math.round(session.answers.filter(answer => answer.correct).length / Math.max(1, session.answers.length) * 100);
  if (session.mode === 'lesson') {
    state = completeLesson(state, session.unit.id, session.answers, session.elapsed);
    delete state.drafts[session.key];
  } else {
    for (const answer of session.answers) {
      const key = `${state.target}:${answer.id}`;
      state.reviews[key] = scheduleReview(state.reviews[key], answer.correct);
    }
    addActivity(state, session.elapsed, session.answers.length);
  }
  save(); render();
  dialog.innerHTML = `<div class="lesson-shell summary-shell"><button class="icon-button summary-close" data-action="close-lesson" aria-label="Close summary">${icon('close')}</button><span class="summary-illustration">${icon('leaf')}</span><p class="eyebrow">ONE SMALL STEP, WELL TAKEN</p><h2>${session.mode === 'lesson' ? 'A little closer to the world.' : 'Your words are growing.'}</h2><p>You made space for ${currentLanguage().name} today.<br>${session.mode === 'lesson' ? escape(session.unit.goal) : 'Thanks for giving these phrases another look.'}</p><div class="summary-stats"><div><strong>${session.answers.length}</strong><span>answers practiced</span></div><div><strong>${score}%</strong><span>without a hint</span></div><div><strong>${session.elapsed >= 60 ? Math.round(session.elapsed / 60) : Math.round(session.elapsed)}</strong><span>${session.elapsed >= 60 ? 'minutes' : 'seconds'} this session</span></div></div>${session.unit ? `<div class="summary-note"><strong>A note to take with you</strong><p>${escape(session.unit.note)}</p></div>` : ''}<p class="field-help">Incorrect and hinted phrases return in about 10 minutes. Stronger phrases return after a longer interval.</p><button class="button primary" data-action="close-lesson">Back to my learning ${icon('arrow')}</button></div>`;
  dialog.querySelector('.button.primary').focus();
}

function closeLesson() {
  saveDraft();
  if (session?.mode === 'review' && !session.finished && session.answers.length) {
    tick();
    for (const answer of session.answers) {
      const key = `${state.target}:${answer.id}`;
      state.reviews[key] = scheduleReview(state.reviews[key], answer.correct);
    }
    addActivity(state, session.elapsed, session.answers.length); save();
  }
  session = null; speechSynthesisSafeCancel(); dialog.close(); render();
}

function speechSynthesisSafeCancel() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
function speak(conceptId) {
  if (!('speechSynthesis' in window)) { toast('This browser does not support audio. Read the phrase and use its pronunciation guide.'); return; }
  const item = findConcept(conceptId); if (!item) return;
  const language = currentLanguage();
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.toLowerCase() === language.locale.toLowerCase()) ?? voices.find(v => v.lang.toLowerCase().startsWith(language.id));
  if (!voice) { toast(`No ${language.name} voice is available on this device. You can add a voice in your device settings or use the text guide.`); return; }
  speechSynthesisSafeCancel();
  const utterance = new SpeechSynthesisUtterance(item.forms[state.target]);
  utterance.lang = language.locale; utterance.voice = voice; utterance.rate = 0.8;
  utterance.onerror = () => toast('Audio could not play. This voice may need a connection. You can continue with the text.');
  window.speechSynthesis.speak(utterance);
}

function confirmAction(title, description, actionLabel, callback) {
  confirmation.innerHTML = `<div class="confirm-content"><h2 id="confirm-title">${escape(title)}</h2><p>${escape(description)}</p><div class="confirm-actions"><button class="button secondary" id="cancel-confirm">Cancel</button><button class="button primary" id="accept-confirm">${escape(actionLabel)}</button></div></div>`;
  confirmation.querySelector('#cancel-confirm').onclick = () => confirmation.close();
  confirmation.querySelector('#accept-confirm').onclick = () => { confirmation.close(); callback(); };
  confirmation.showModal();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `freelingo-progress-${dayKey()}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Progress exported. Keep the file for your next device.');
}

document.addEventListener('click', async event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); document.querySelector('#main').focus(); return; }
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'lesson') startLesson(button.dataset.unit);
  else if (action === 'choose-language') { setTarget(button.dataset.language); location.hash = 'home'; render(); document.querySelector('#main').focus(); }
  else if (action === 'review') { location.hash = 'review'; render(); }
  else if (action === 'start-review') startReview(dueReviews(state));
  else if (action === 'practice-all') startReview(Object.keys(state.reviews).filter(key => key.startsWith(`${state.target}:`)).map(key => findConcept(key.split(':')[1])));
  else if (action === 'single-review') startReview([findConcept(button.dataset.concept)]);
  else if (action === 'close-lesson') closeLesson();
  else if (action === 'select-answer') { session.selected = button.dataset.answer; renderExercise(); }
  else if (action === 'pick-word') { session.chosen.push(Number(button.dataset.index)); renderExercise(); }
  else if (action === 'unpick-word') { session.chosen.splice(Number(button.dataset.index), 1); renderExercise(); }
  else if (action === 'next-exercise') nextExercise();
  else if (action === 'hint') { session.usedHint = true; renderExercise(); }
  else if (action === 'speak') speak(button.dataset.concept);
  else if (action === 'export') exportProgress();
  else if (action === 'reset') confirmAction('Start with a fresh page?', 'This erases all FreeLingo progress on this device. Export a backup first if you want to keep it.', 'Erase progress', () => { state = defaultState(); save(); render(); toast('Progress erased. Your next adventure is ready.'); });
  else if (action === 'install') {
    if (installPrompt) { await installPrompt.prompt(); installPrompt = null; }
    else toast('Open your browser menu and choose “Install app” or “Add to Home Screen.” In Safari on iPhone, use Share → Add to Home Screen.');
  }
});

document.addEventListener('submit', event => { if (event.target.id === 'answer-form') { event.preventDefault(); checkAnswer(); } });
document.addEventListener('input', event => {
  if (event.target.id === 'typed-answer' && session) { session.typed = event.target.value; dialog.querySelector('button[type="submit"]').disabled = !session.typed.trim(); }
});
document.addEventListener('change', async event => {
  const { id, value } = event.target;
  if (id === 'target-header' || id === 'target-settings') setTarget(value);
  else if (id === 'source-settings' && findLanguage(value) && value !== state.target) { state.source = value; save(); render(); }
  else if (id === 'daily-goal') { state.goal = Number(value); save(); render(); }
  else if (id === 'show-aids') { state.showAids = event.target.checked; save(); }
  else if (id === 'import-file') {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('This backup is too large. Choose a FreeLingo JSON backup under 1 MB.');
      const imported = validateState(JSON.parse(await file.text()));
      confirmAction('Replace this device’s progress?', 'Importing replaces your current progress and settings. Export a backup first if you want to keep them.', 'Import progress', () => { state = imported; save(); render(); toast('Your progress is here. Welcome back.'); });
    } catch (error) { toast(error.message === 'This is not a supported FreeLingo backup.' || error.message.includes('too large') ? error.message : 'This file could not be read. Choose a valid FreeLingo JSON backup.'); }
    event.target.value = '';
  }
});

dialog.addEventListener('cancel', event => { event.preventDefault(); closeLesson(); });
window.addEventListener('hashchange', () => { render(); document.querySelector('#main').focus(); });
window.addEventListener('beforeunload', () => saveDraft());
document.addEventListener('visibilitychange', () => { if (session) { if (document.hidden) saveDraft(); session.tick = Date.now(); } });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('offline', () => toast('You’re offline. Lessons and progress still work; some browser voices may be unavailable.'));
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && !session) { state = load(); render(); toast('Progress updated from another tab.'); }
  else if (event.key === STORAGE_KEY && session) toast('Another tab changed progress. Finish this session before using multiple tabs.');
});

render();
if (storageNotice) toast(storageNotice);
if (!storageAvailable) toast('Browser storage is unavailable. Export your progress before leaving.');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => toast('Offline caching is unavailable in this browser. Online practice still works.'));
