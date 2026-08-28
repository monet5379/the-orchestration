/** 매치 내비 — 개발자 모드(치트 버튼) 토글 */

const DEV_MODE_KEY = 'orchestration-dev-mode';

/**
 * @returns {boolean}
 */
export function isDevMode() {
  try {
    return sessionStorage.getItem(DEV_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {boolean} on
 */
export function setDevMode(on) {
  try {
    sessionStorage.setItem(DEV_MODE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  applyDevModeUi();
}

export function toggleDevMode() {
  setDevMode(!isDevMode());
}

export function applyDevModeUi() {
  const on = isDevMode();
  const cheats = document.getElementById('dev-cheat-buttons');
  const btn = document.getElementById('btn-dev-mode');

  if (cheats) {
    cheats.hidden = !on;
  }

  if (btn) {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('match-nav-btn--active', on);
    btn.textContent = on ? '개발자 모드 ON' : '개발자 모드';
  }
}
