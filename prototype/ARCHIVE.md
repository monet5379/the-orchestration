# Prototype Archive — 버전 · 테스트 이력

프로토타입 **과거 버전 변경점**과 **수동 테스트 체크리스트**를 모은다.  
현재 상태만 보려면 [`README.md`](./README.md).  
공유 패치노트 → [`../docs/patch-note/external/0.1.30.md`](../docs/patch-note/external/0.1.30.md) ·  
내부(프로그래머) → [`../docs/patch-note/internal/0.1.30.md`](../docs/patch-note/internal/0.1.30.md)

제품 버전은 **0.1.x** (구 1.x / 2.0 표기는 0.1.x로 소급 재번호).

---

## 버전 타임라인

| 버전 | Step | 요약 |
|---|---|---|
| **0.1.30** | 6 | SELECT 60초 · ADJUST 15초 · 한 번 확정 · 버튼 안내 · 런처 (구 0.1.28~0.1.30 통합) |
| 0.1.27 | 6 | ADJUST: 내 수정·페이크 무연출 · 상대 페이크만 SFX+플래시 |
| 0.1.26 | 6 | 새 게임/이어하기 · POV HUD · ×본능형 힌트 · 개발자 모드 · ADJUST 현재패 비활성 |
| 0.1.25 | 6 | 독방·가면·VHS·localStorage · 문서/버전 체계 정리 |
| 0.1.24 | 5 | 본능 ADJUST 중 표시, 감지 중 상태 |
| 0.1.23 | 5 | 본능 UI 한글·페이크 감지, 승리 초록색 |
| 0.1.22 | 4~5 | TIE_LOOT·아이템 문구·페이즈 한글화 |
| 0.1.21 | 4 | 페널티 안내, ADJUST 게이지, TIE_LOOT UX |
| 0.1.2 | 3~4 | overlay·페널티 확정, 문서 정리 |
| 0.1.1 | 3 | HP → 페널티 3회 누적 |
| 0.1.0 | 0~4 | 스캐폴드 + 턴 루프 + 블러핑·아이템 초안 |

### Step ↔ 버전

| Step | 목표 | 대략 버전 |
|---|---|---|
| 0 | 스캐폴드, `run.bat`, ES Module | ~0.1.0 |
| 1 | SELECT → REVEAL → RESOLVE | ~0.1.0 |
| 2 | ADJUST 5초 + CPU | ~0.1.0 |
| 3 | 페널티 3회, menu/gameover | ~0.1.1 |
| 4 | 페이크, TIE_LOOT, 아이템 3종 | ~0.1.2 |
| 5 | POV, SFX, 천장·패널 연출 | ~0.1.24 |
| 6 | cell, masks, VHS, storage | **0.1.25+** |

---

## 변경 로그

### 0.1.30 (2026-08-30) — SELECT/ADJUST 타이머 · 한 번 확정 · 버튼 안내 · 런처

*(배포 단위: 구 0.1.28~0.1.30 통합. 직전 공유 빌드는 0.1.27)*

- **SELECT** 60초 카운트다운 UI · 시간 초과 시 자동 확정(미선택 시 무작위)
- **ADJUST** 5초 → **15초** (시간 팽창 +2s → 17초)
- 유지·변경·페이크 **한 번이면 끝** (`playerAdjusted`: kept / changed / bluffed)
- 확정 후 전부 잠금 · 유효 패에 **노란 테두리** · 양측 완료 시 **즉시 `ADVANCE_TO_RESOLVE`**
- `opponentButtonHint`: 기본 유지/바꾸기 · 페이크는 바꾸기 위장 · 본능/×가면은 페이크까지 정확
- CPU `planCpuAdjustAction`: 유지|바꾸기|페이크 **한 번에 결정** 후 커밋
- 타이틀 새 게임: 인라인 확인 · 메뉴 `phase: null` · SELECT 부트 보장
- `serve.py` (no-store) · `run.ps1` · `run.bat` 위임 · import `?v=`

### 0.1.27 (2026-08-28) — ADJUST 연출

- 플레이어 `ADJUST_CHANGE` / `ADJUST_BLUFF`: 금속·페이크 SFX 및 POV 플래시 제거
- `CPU_BLUFF`: 페이크음 + 빨간 렌즈 플래시 유지 (정보 비대칭)
- SELECT 패 선택 시 금속음·플래시는 유지

### 0.1.26 (2026-08-28) — UX · 세이브 · 디버그

- 타이틀: **[이어하기]** / **[새 게임]** (`hasSaveProgress` · `clearSave` · 세이브 요약)
- 푸터 HUD → `#pov-hud` (POV 가장자리: 페널티·턴·수정·페이크·가면)
- 독방: 장착 가면 설명 · VHS 안내 (합니다체)
- × 가면: 1턴 ADJUST, 본능과 동일 문구·타이밍 (`감지 중…` → 변경/유지)
- ADJUST: 현재 패 버튼 비활성
- 매치: **개발자 모드** 토글 → 강제 승리/패배 (페널티 3/3, `sessionStorage`)
- `ui/dev-mode.js` 추가

### 0.1.25 (2026-08-28) — Step 6

- 승리 시 `SCENE.CELL` (독방), 패배만 `gameover`
- `replay.js` 구조화 로그 + `#vhs-player` 타임라인 UI
- 가면 3종 수집·장착 1개·패시브 (`masks.js`)
- `save-schema` + `localStorage` (가면, stats, matchHistory 최대 5)
- `run.bat`: 서버 기동 후 `main.js` 헬스체크 뒤 브라우저 오픈
- `boot`: UI 핸들러를 `preloadAudio`보다 먼저 등록
- 제품 표시를 **0.1.x**로 통일

**알려진 이슈 / 수정**

| 증상 | 원인 | 조치 |
|---|---|---|
| [매치 시작] 눌리는데 화면 안 넘어감 | `await preloadAudio` 뒤 핸들러 등록 | boot 순서 변경 |
| 동일 증상 (서버 직후) | 브라우저가 서버보다 먼저 열림 | `run.bat` 헬스체크 |
| `pickOpponentMask` export 없음 | 구버전 `opponent.js` 캐시 (304) | Ctrl+Shift+R |

### 0.1.24 — Step 5 polish

- 본능 힌트 ADJUST 중 표시 (CPU 행동 후 대응 가능)
- 「감지 중…」 상태

### 0.1.23

- 본능 UI 유지/변경 한글, 페이크 감지 문구
- 승리 결과 초록색

### 0.1.22

- TIE_LOOT 중복 문구 정리
- 아이템 설명 합니다체·페이즈 한글화
- 타이틀에서 무승부 규칙 문구 정리

### 0.1.21

- 페널티 안내, ADJUST 게이지
- TIE_LOOT 선택 → [획득]
- 무승부 아이템 규칙 UI

### 0.1.2

- overlay·페널티 규칙 문서/UI 확정
- 전 문서 최신화

### 0.1.1

- HP 감소 방식 폐기 → 페널티 0→3 누적

### 0.1.0

- 폴더 구조, `run.bat`, constants
- 4페이즈 루프 + CPU + 페이크·TIE 아이템 초안

---

## 수동 테스트 체크리스트

새 버전 올릴 때 **현재 버전 섹션을 먼저** 돌리고, 회귀로 아래 구버전 항목을 샘플링한다.

### v0.1.30 — 현재 *(구 0.1.28~0.1.30 통합)*

- [ ] `run.bat` → 브라우저 자동 오픈 · Console에 `v0.1.30` ready 로그
- [ ] 런처: Ctrl+C 또는 아무 키 → `Stopping` / `Done` 후 창 종료
- [ ] SELECT: **60초** 타이머 · 시간 초과 시 자동 진행 · 패 선택 시 금속음·플래시
- [ ] ADJUST: **15초** 타이머 (시간 팽창 **17초**) · 미결정 시 만료 후 RESOLVE
- [ ] ADJUST: 유지 → 전부 잠금 · 유효 패 + 유지 버튼 노란 테두리
- [ ] ADJUST: 페이크 → 전부 잠금 · 유효 패 + 페이크 버튼 노란 테두리 · 패 불변
- [ ] ADJUST: 변경 → 전부 잠금 · **새 패만** 노란 테두리 · 추가 변경 불가
- [ ] 나·상대 모두 결정 완료 → 타이머 끊고 **즉시 RESOLVE**
- [ ] 본능·가면 없음: CPU 유지 → `유지 버튼` / 변경·페이크 → `바꾸기 버튼` (안내 **1회·불변**)
- [ ] 본능 또는 ×가면: 페이크 시 `페이크 버튼을 눌렀습니다` 정확 표시
- [ ] 세이브 없음 → 이어하기 비활성 · 새 게임으로 매치 · SELECT 타이머 표시
- [ ] 세이브 있음 → 새 게임 인라인 확인(삭제하고 시작) 후 매치
- [ ] ADJUST: 내가 수정·페이크 → 무연출 · 상대 페이크/변경 → SFX+플래시
- [ ] POV HUD · ×가면 1턴 힌트 · 개발자 모드 · 승리→독방 · 패배→gameover · F5 세이브

### v0.1.27

- [ ] `run.bat` → Console에 `v0.1.26` ready 로그
- [ ] 세이브 없음 → 이어하기 비활성 · 새 게임으로 매치
- [ ] 세이브 있음 → 요약 표시 · 이어하기 / 새 게임(확인 후 초기화)
- [ ] POV HUD: 페널티·턴·수정·페이크·가면
- [ ] ADJUST: 현재 패 비활성, 다른 패로만 변경
- [ ] × 가면 장착 · 1턴 ADJUST → `[가면] 감지 중…` 후 변경/유지 문구
- [ ] 독방: 장착 설명 · VHS 안내 문구
- [ ] 개발자 모드 OFF → 강제 버튼 숨김 / ON → 강제 승리·패배 · 페널티 3/3
- [ ] 승리 → 독방 · 패배 → gameover · F5 세이브 유지

### v0.1.25 (Step 6)

- [ ] `run.bat` → Console에 ready 로그
- [ ] 매치 시작 → 매치 UI (`#game-root`)
- [ ] CPU 페널티 3/3 승리 → **독방** (`#cell-root`)
- [ ] 가면 획득 메시지 · `#cell-wall` 진열
- [ ] VHS ▶ / 스크럽 / ◀◀ / ▶▶ · CPU `(hidden)`
- [ ] 가면 장착 → 다음 상대 → HUD 자원 보너스
- [ ] POV doodle = `opponentMaskId` 고정
- [ ] F5 → 가면·전적 유지
- [ ] 패배 → gameover → 다시 하기

### Step 5 (연출)

- [ ] POV 눈구멍·비네팅·상대 실루엣
- [ ] REVEAL 천장 「승자 있음」/「무승부」 하강
- [ ] SELECT: R/P/S 금속 SFX + 렌즈 플래시
- [ ] ADJUST: 상대 페이크만 SFX + 렌즈 플래시 (내 수정·페이크는 무연출)  
  SFX 재생성: `node scripts/generate-sfx.mjs`

### Step 4 (심리전)

- [ ] 페이크: 패 불변, 자원 -1, log `[BLUFF]`
- [ ] 무승부 → 아이템 선택·획득
- [ ] 본능 / 시간 팽창(+2s) / 규칙 파괴(상대 초기 패)

### Step 3 (페널티)

- [ ] 패배 시 페널티 +1 (HUD `n/3`)
- [ ] 플레이어 3/3 → gameover
- [ ] 무승부 시 페널티 변화 없음

### Step 2 (ADJUST)

- [ ] 최대 **15초** 카운트다운 · 유지/변경/페이크 **한 번**
- [ ] 양측 결정 완료 시 즉시 RESOLVE
- [ ] REVEAL 문구는 초기 선택 기준(변경해도 불변)

### Step 1 (1턴)

- [ ] 선택 → 천장 partial → RESOLVE → 다음 턴
- [ ] `#event-log` 기록

---

## 테스트 결과 기록 (템플릿)

버전 올릴 때 아래에 한 블록 추가한다.

```
### YYYY-MM-DD · v0.1.xx
- 환경: Windows / Chrome · run.bat
- 결과: Pass / Fail
- 메모:
```

### 2026-08-30 · v0.1.30

- 환경: Windows / Chrome · `run.bat` / `run.ps1` · `serve.py`
- 결과: (수동 기입)
- 메모: SELECT 60s · ADJUST 15s · 한 번 확정 · 버튼 안내 · 런처 (구 28~30 통합 배포)

### 2026-08-28 · v0.1.27

- 환경: Windows / Chrome · `run.bat`
- 결과: (수동 기입)
- 메모: 내 ADJUST 수정·페이크 무연출 · 상대 페이크만 SFX+플래시

### 2026-08-28 · v0.1.26

- 환경: Windows / Chrome · `run.bat`
- 결과: (수동 기입)
- 메모: 새 게임/이어하기 · POV HUD · 개발자 모드 · ×본능형 · ADJUST 현재패 비활성

### 2026-08-28 · v0.1.25

- 환경: Windows / Chrome · `run.bat` (헬스체크 적용)
- 결과: (수동 기입)
- 메모: boot 순서·헬스체크·캐시 이슈 대응 반영. 문서 README/ARCHIVE 분리.

---

## 문서 운영

| 파일 | 역할 |
|---|---|
| `README.md` | **현재** 상태·실행·규칙만 |
| `ARCHIVE.md` | 버전 타임라인·테스트 이력 (이 파일) |
| `../docs/patch-note/external/` | 공유용 패치노트 (배포 시) |
| `../docs/patch-note/internal/` | 프로그래머용 규칙·상태·회귀 |
| `../docs/HTML_Prototype_Structure.md` | 아키텍처 |
| `../docs/Proposal_vs_Prototype.md` | 기획서 vs 프로토타입 |

버전 bump 시: `index.html` / `main.js` console / README 헤더 / 이 ARCHIVE 변경·테스트 블록 / `patch-note/internal` · 배포 시 `external`.
