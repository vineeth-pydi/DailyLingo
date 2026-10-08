// Run synchronously before the stylesheet so saved/system themes apply before paint.
(() => {
  const key = 'dailylingo-theme-v1';
  const root = document.documentElement;
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark' ? value : null;
  let preference = null;
  let current;
  try { preference = valid(localStorage.getItem(key)); } catch { /* Keep a session preference when storage is unavailable. */ }
  const systemTheme = () => system?.matches ? 'dark' : 'light';

  function apply(theme) {
    current = theme;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17211d' : '#f8f7f3');
    window.dispatchEvent(new CustomEvent('dailylingo:themechange', { detail: { theme } }));
  }

  window.dailyLingoTheme = {
    get current() { return current; },
    toggle() {
      preference = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Apply the choice for this tab even without persistence. */ }
      apply(preference);
    }
  };
  apply(preference ?? systemTheme());

  const followSystem = () => { if (!preference) apply(systemTheme()); };
  if (system?.addEventListener) system.addEventListener('change', followSystem);
  else system?.addListener?.(followSystem);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = event.key === null ? null : valid(event.newValue);
    apply(preference ?? systemTheme());
  });
})();
