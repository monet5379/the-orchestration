/** @typedef {'rock' | 'paper' | 'scissors'} Move */

/** @enum {Move} */
export const MOVE = {
  ROCK: 'rock',
  PAPER: 'paper',
  SCISSORS: 'scissors',
};

/** @enum {string} */
export const PHASE = {
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

export const ADJUST_DURATION_MS = 15000;
export const SELECT_DURATION_MS = 60000;
/** 패배 누적 3회 시 매치 종료 (기획서 형벌) */
export const MAX_PENALTIES = 3;
export const TIME_WARP_BONUS_MS = 2000;

export const PHASE_LABEL = {
  SELECT: '패 선택',
  REVEAL: '상황 공개',
  ADJUST: '수정 페이즈',
  RESOLVE: '결과 공개',
  TIE_LOOT: '아이템',
  TURN_END: '턴 종료',
  MATCH_END: '매치 종료',
};
