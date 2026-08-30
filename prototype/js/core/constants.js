/** @typedef {'rock' | 'paper' | 'scissors'} Move */

/** @enum {Move} */
export const MOVE = {
  ROCK: 'rock',
  PAPER: 'paper',
  SCISSORS: 'scissors',
};

/** @enum {string} */
export const PHASE = {
  /** 타이틀/메뉴 — 매치 SELECT와 구분 (부트 스케줄 재발 방지) */
  MENU: 'MENU',
  SELECT: 'SELECT',
  REVEAL: 'REVEAL',
  ADJUST: 'ADJUST',
  RESOLVE: 'RESOLVE',
  TIE_LOOT: 'TIE_LOOT',
  TURN_END: 'TURN_END',
  MATCH_END: 'MATCH_END',
};

/** @enum {string} */
export const SCENE = {
  MENU: 'menu',
  MATCH: 'match',
  CELL: 'cell',
  GAMEOVER: 'gameover',
};

export const PHASE_LABEL = {
  MENU: '메뉴',
  SELECT: '패 선택',
  REVEAL: '상황 공개',
  ADJUST: '수정 페이즈',
  RESOLVE: '결과 공개',
  TIE_LOOT: '아이템',
  TURN_END: '턴 종료',
  MATCH_END: '매치 종료',
};
