# The Orchestration — HTML 프로토타입 구조

> **목적:** 핵심 게임 루프(1:1 턴제 심리전 + 5초 블러핑)와 로그라이크 메타(독방·가면·VHS)를 검증하기 위한 바닐라 HTML/JS 프로토타입  
> **프로토타입 버전:** **v0.1.32** (Step 0~6 완료 · 밸런스 `loadBalance` + 로컬 JSON)  
> **직전 공유:** v0.1.30  

> **관련 기획:** [The_Orchestration_Game_Proposal.pptx.txt](./The_Orchestration_Game_Proposal.pptx.txt)  
> **기획 vs 프로토타입:** [Proposal_vs_Prototype.md](./Proposal_vs_Prototype.md)

---

## 1. 기술 스택 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 마크업/스타일 | HTML + CSS | 즉시 실행, 공유 용이 |
| 로직 | Vanilla JS (ES Modules) | 턴 FSM·타이머에 프레임워크 불필요 |
| 빌드 | 없음 | 정적 서버로 실행 (`run.bat` 권장) |
| 저장 | localStorage (`save-schema` v1) | 가면 수집·전적·replay 히스토리 |
| 테스트 | Playwright (선택) | `tests/smoke-menu.mjs` 초안 |

React/Vite 등은 UI 복잡도 대비 초기 속도가 느리므로, **룰 검증 단계에서는 사용하지 않는다.**  
Godot 전환 시 `game/` 계층의 로직을 그대로 포팅할 수 있도록 DOM과 분리한다.

---

## 2. 폴더 구조

레포 루트는 **문서**와 **실행 가능한 프로토타입**을 분리한다.  
공유·배포·정적 호스팅 시 `prototype/` 폴더만 넘기면 된다.

```
the-orchestration/
├── docs/                      # 기획·아키텍처 문서
│   ├── HTML_Prototype_Structure.md
│   ├── Proposal_vs_Prototype.md
│   └── The_Orchestration_Game_Proposal.pptx.txt
│
└── prototype/                 # ★ HTML 프로토타입 (공유 단위)
    ├── README.md              # 현재 상태만
    ├── ARCHIVE.md             # 버전·테스트 이력
    ├── run.bat                # Windows: run.ps1 위임
    ├── run.ps1                # 숨김 서버 + 브라우저 + Ctrl+C/키 종료
    ├── serve.py               # 정적 서버 (JS/CSS/HTML no-store)
    ├── index.html             # overlay + game-root + cell-root
    ├── data/
    │   └── balance.json       # 기획 수치 로드 소스 (시트 URL로 교체 예정)
    ├── css/
    │   ├── tokens.css
    │   ├── layout.css
    │   ├── components.css
    │   ├── ceiling.css
    │   ├── panel.css
    │   ├── pov.css
    │   ├── cell.css           # 독방·가면 진열
    │   └── vhs.css            # VHS 패널
    ├── js/
    │   ├── main.js            # dispatch, 타이머, boot, save I/O
    │   ├── core/
    │   │   ├── balance.js     # ★ BALANCE_DEFAULTS · getBalance · loadBalance
    │   │   ├── constants.js   # MOVE / PHASE / SCENE / PHASE_LABEL
    │   │   ├── timing.js      # 연출 딜레이 (REVEAL/RESOLVE/COMMIT)
    │   │   ├── event-bus.js   # stub
    │   │   ├── save-schema.js # 메타 세이브 스키마
    │   │   └── storage.js     # localStorage load/persist/clear · 세이브 요약
    │   ├── game/
    │   │   ├── state.js
    │   │   ├── phases.js      # ★ FSM reducePhase (+ FORCE_WIN/LOSE)
    │   │   ├── rps.js
    │   │   ├── penalties.js
    │   │   ├── resources.js
    │   │   ├── items.js       # TIE 아이템 (1턴)
    │   │   ├── masks.js       # 가면 패시브 (매치)
    │   │   └── replay.js      # 구조화 replay / VHS용
    │   ├── ai/
    │   │   └── opponent.js    # + pickOpponentMask
    │   ├── scenes/
    │   │   ├── menu.js
    │   │   ├── match.js
    │   │   └── cell.js        # persistVictory, equipMask, next match
    │   └── ui/
    │       ├── renderer.js
    │       ├── overlay.js     # menu(새게임/이어하기) / gameover / cell
    │       ├── button-panel.js
    │       ├── tie-loot-panel.js
    │       ├── ceiling-screen.js
    │       ├── countdown.js
    │       ├── hud.js         # → #pov-hud
    │       ├── audio.js
    │       ├── pov-viewport.js
    │       ├── dev-mode.js    # 강제 승리·패배 토글
    │       ├── cell-scene.js
    │       ├── cell-wall.js
    │       └── vhs-player.js
    ├── assets/
    │   ├── sfx/
    │   └── masks/
    └── tests/
        ├── match-loop.spec.js
        └── smoke-menu.mjs
```

### 핵심 원칙

- **`game/`** — DOM을 모름. 순수 함수와 상태 전이만 담당.
- **`ui/`** — 게임 룰을 모름. 입력 수집과 렌더링만 담당.
- **`scenes/`** — 화면 단위 조합. `match`, `cell` 등.
- **`main.js`** — `dispatch(action)` → `reducePhase` → `render`. 타이머·오디오·세이브 orchestration.
- **`core/event-bus.js`** — 설계상 연결점. 현재는 stub.

---

## 3. 아키텍처 (3층)

```
┌─────────────────────────────────────────┐
│  ui/ + scenes/                          │
│  Button · Ceiling · HUD · Cell · VHS    │
└─────────────────┬───────────────────────┘
                  │ player input / state + save snapshot
┌─────────────────▼───────────────────────┐
│  game/ + ai/                            │
│  Phase FSM · RPS · Items · Masks · AI   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  core/                                  │
│  Balance · Constants · Timing · Storage │
└─────────────────────────────────────────┘
```

타이머·페널티·시작 자원·AI 확률은 `getBalance()` (`balance.js`).  
부팅·타이틀 복귀 시 `loadBalance()`가 `data/balance.json`을 읽어 `current`를 교체(실패 시 defaults 유지). 매치 중에는 다시 읽지 않는다.  
`constants.js`는 enum·라벨, `timing.js`는 연출용 딜레이만 담당.

---

## 4. 씬(Scene) vs 페이즈(Phase)

### 4.1 씬 — 화면 단위

| 씬 | 역할 | 상태 |
|---|---|---|
| `menu` | 타이틀, [이어하기] / [새 게임] | ✅ |
| `match` | 1:1 심문실 전투 | ✅ |
| `cell` | 가면 진열, VHS 복기, [다음 상대] | ✅ (승리 시) |
| `gameover` | 패배 화면, [다시 하기] | ✅ (패배 시) |

**매치 종료 분기**

```
match ──패배──→ gameover ──[다시 하기]──→ match
     └──승리──→ cell ──[다음 상대]──→ match
                    └──[타이틀]──→ menu
```

### 4.2 페이즈 — 1턴 내부 상태 머신

```
SELECT ──→ REVEAL ──→ ADJUST ──→ RESOLVE
  ↑                                  │
  │         (무승부) → TIE_LOOT ──────┘
  │                                  │
  └──────────── (매치 계속) ──────────┘
                                     ↓
                              MATCH_END
                         패배 → gameover / 승리 → cell
```

| 페이즈 | 기획서 단계 | 플레이어 입력 | CPU 동작 |
|---|---|---|---|
| `SELECT` | 1. 동시 패 선택 | R/P/S (0.5s debounce 후 확정) | 초기 선택 |
| `REVEAL` | 2. 상황 정보 노출 | 없음 | — |
| `ADJUST` | 3. 수정 & 블러핑 (최대 **15s**) | `[유지]` / R/P/S / `[페이크]` · **한 번 확정** | 최종 행동 1회 · 양측 완료 시 즉시 종료 |
| `RESOLVE` | 4. 결과 공개 및 페널티 | 없음 | — |
| `TIE_LOOT` | 무승부 아이템 | 선택 후 [획득] · 나 1 + CPU 1 | `pickTieItem` |

---

## 5. 게임 상태 모델

```javascript
// game/state.js — 개념 (매치 중 예시)
{
  scene: 'match',           // menu | match | cell | gameover
  phase: 'ADJUST',          // 메뉴 씬에서는 PHASE.MENU (SELECT와 분리)
  turn: 3,
  winner: null,             // 'player' | 'opponent'

  player: {
    choice: 'rock',
    finalChoice: 'rock',
    resources: { changes: 2, bluffs: 1 }, // 가면 패시브로 가산 가능
    penalties: 1,
    activeItem: 'time_warp', // TIE 아이템 (1턴)
    items: [],
  },

  opponent: { /* 동일 구조, choice/finalChoice는 UI 비노출 */ },

  partialResult: 'winner_exists',
  lastResolve: { outcome, playerMove, opponentMove },
  cpuAdjusted: false,
  playerAdjusted: false,  // false | 'kept' | 'changed' | 'bluffed'
  cpuBluffedThisTurn: false,
  opponentButtonHint: null, // null | 'kept' | 'changed' | 'bluffed' (진실값; UI는 본능/가면 여부로 위장)
  adjustTimerMs: 15000,

  matchLog: [],             // 문자열 (디버그 #event-log)
  replay: { events: [], matchStartMs },  // VHS용 구조화 로그
  opponentMaskId: 'doodle_smile',
  equippedMaskId: null,
  pendingCell: null,        // 승리 시 cell 진입 payload
}
```

### 메타 세이브 (`localStorage` · `orchestration-save`)

```javascript
{
  version: 1,               // SAVE_VERSION (스키마, 제품 버전과 별개)
  masks: { unlocked: [], equipped: null },  // 장착 1개
  matchHistory: [],         // 최근 5매치 (replay 이벤트 포함)
  stats: { wins: 0, losses: 0 },
}
```

### 비대칭 정보

- `REVEAL`: `partialResult`만 UI 노출.
- `opponent.choice` / `finalChoice`는 기본 비노출 (`rule_break` 예외).
- ADJUST 안내: 기본은 유지/바꾸기만(페이크→바꾸기 위장). 본능·×가면은 페이크까지 정확.
- replay의 CPU 이벤트는 `hidden: true` → VHS에 `(hidden)` 표시.

---

## 6. UI 레이아웃 (`index.html`)

```
┌─────────────────────────────────────┐
│  #overlay (menu | gameover)         │  ← match/cell 아닐 때
│    menu: [이어하기] [새 게임]         │
├─────────────────────────────────────┤
│  #match-nav (match)                 │
│    개발자 모드 · (치트) · 타이틀로     │
├─────────────────────────────────────┤
│  #game-root (match)                 │
│    #ceiling-screen  높이 100px 고정   │
│    #pov-viewport    높이 300px 고정   │
│      (+ #pov-hud 상태 칩)             │
│    #player-display / #button-panel  │
│    #tie-loot-panel / #event-log     │
├─────────────────────────────────────┤
│  #cell-root (승리 후 독방)            │
│    #cell-wall · 장착/VHS 설명         │
│    #vhs-player · 액션                 │
└─────────────────────────────────────┘
```

`#app` 최대 폭 640px. 전광판·POV **세로 크기는 CSS 토큰으로 고정**, 가로는 부모 폭에 맞춤.

### 씬 전환 (`ui/overlay.js`)

- `menu` → `#menu-screen` (세이브 있으면 이어하기·요약)
- `match` → `#overlay` hidden, `#game-root` 표시
- `cell` → `#overlay` / `#game-root` hidden, `#cell-root` 표시
- `gameover` → `#gameover-screen` (패배 전용)

---

## 7. 입력·상태 전이

`main.js`에서 `dispatch` → `reducePhase` → `render(state, save)`.

**ADJUST 연출 (v0.1.27+):** `CPU_BLUFF` / `CPU_ADJUST`(변경) 시 SFX + POV 플래시.  
플레이어 `ADJUST_CHANGE` / `ADJUST_BLUFF`는 무음·무플래시. SELECT 패 선택은 금속음·플래시 유지.

**ADJUST 확정 · 안내 (v0.1.30):** 유지·변경·페이크는 턴당 **한 번**. 확정 후 버튼 전부 잠금 · 유효 패에 노란 테두리.  
`playerAdjusted` + `cpuAdjusted`이면 `main.js`가 타이머를 끊고 즉시 `ADVANCE_TO_RESOLVE`.  
`opponentButtonHint`로 상대 버튼 종류 표시. CPU는 `planCpuAdjustAction`으로 최종 행동 1회 커밋. 기본 UI는 페이크→바꾸기 위장.

| 액션 | 발생 | 결과 |
|---|---|---|
| `START_MATCH` | [이어하기] / [새 게임] / [다시 하기] | match, SELECT, turn 1 |
| `START_NEXT_MATCH` | 독방 [다음 상대] | 장착 가면 적용 + 새 CPU 가면 |
| `LEAVE_CELL` / `RETURN_TO_MENU` | [타이틀] | menu (`phase: MENU`) |
| `FORCE_WIN` / `FORCE_LOSE` | 개발자 모드 치트 | 페널티 3/3 → cell / gameover |
| `SELECT_MOVE` + `COMMIT_SELECT` | R/P/S + 0.5s | REVEAL |
| `ENTER_ADJUST` | REVEAL 후 | ADJUST |
| `ADJUST_*` / `CPU_*` | 수정·페이크 (플레이어는 한 번만) | ADJUST · 양측 완료 시 즉시 RESOLVE |
| `ADVANCE_TO_RESOLVE` | ADJUST 종료 (타이머 또는 조기) | RESOLVE |
| `COMPLETE_RESOLVE` | RESOLVE 후 | 다음 턴 / TIE_LOOT / cell / gameover |
| `TIE_PICK` | 아이템 획득 | SELECT |

승리 시 `main.js`가 `persistVictory` 1회 호출 (가면 unlock, matchHistory, stats).

### boot

UI 핸들러(`initOverlay` 등)를 **먼저** 등록한 뒤 `preloadAudio()`는 백그라운드 실행.  
`run.bat` → `run.ps1`이 `serve.py`를 띄운 뒤 브라우저를 연다 (JS/CSS/HTML no-store).

---

## 8. AI · 가면

```javascript
pickInitialChoice(state)
planCpuAdjust(state)
maybeBluff(state)
pickTieItem(remaining)
pickOpponentMask(unlockedIds)  // 미획득 가면 우선
```

| 가면 | 능력 | 효과 |
|---|---|---|
| ☺ `doodle_smile` | `extra_change` | 수정권 +1 |
| ? `doodle_question` | `extra_bluff` | 페이크 +1 |
| × `doodle_cross` | `instinct_hint` | 첫 ADJUST 본능형 힌트 (유지/바꾸기/페이크) |

TIE 아이템(`instinct` / `time_warp` / `rule_break`)은 **1턴**, 가면은 **매치 패시브**.

---

## 9. 구현 우선순위

| Step | 목표 | 상태 |
|---|---|---|
| 0 | 스캐폴드, `run.bat`, constants | ✅ |
| 1 | SELECT → REVEAL → RESOLVE | ✅ |
| 2 | ADJUST 5초 + CPU | ✅ |
| 3 | 페널티 3회, menu/gameover | ✅ |
| 4 | 페이크, TIE_LOOT, 아이템 3종 | ✅ |
| 5 | POV, SFX, visual identity | ✅ |
| 6 | cell, masks, VHS, storage | ✅ |

### 남은 과제 (선택)

- [ ] Playwright 스모크: `tests/smoke-menu.mjs` (새 게임 → SELECT 타이머)
- [ ] 독방 꾸미기 / 메타 로어 / 탈옥 엔딩
- [ ] 멀티플레이 PvP

---

## 10. 실행 방법

```bash
cd prototype
# Windows: run.bat → run.ps1 + serve.py (no-store) → 브라우저
python serve.py --port 8080
npx serve .
```

ES Module·SFX fetch를 위해 **정적 서버 사용을 권장** (`file://` 비권장).  
개발 중 named export 오류가 보이면 **런처 재시작** + **Ctrl+Shift+R** (`serve.py`는 JS no-store).

---

## 11. Godot 전환 시

| HTML 모듈 | Godot 대응 |
|---|---|
| `game/*` | GDScript autoload / Resource |
| `scenes/match.js` · `cell.js` | Match / Cell 씬 |
| `ui/*` | Control 노드 |
| `replay` | VHS 타임라인 Dictionary |
| `save-schema` | SaveResource |

---

*문서 버전: 0.1.32 · 2026-08-30 · loadBalance + 로컬 JSON · SELECT 60s · ADJUST 15s · commit-once · launcher*  
*프로토타입 이력: [`../prototype/ARCHIVE.md`](../prototype/ARCHIVE.md)*

