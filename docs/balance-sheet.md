# 밸런스 시트 가이드

기획자가 git 없이 [구글 스프레드시트](https://docs.google.com/spreadsheets)만 수정해 프로토타입 수치를 바꿀 때 쓴다.

런타임·파서 계약은 [`patch-note/internal/0.1.33.md`](patch-note/internal/0.1.33.md).  
코드: `prototype/js/core/balance.js`.

---

## 열 구성

| 열 | 필수 | 설명 |
|----|------|------|
| `key` | 예 | flat 키 (아래 목록) |
| `value` | 예 | 숫자만 |
| `#desc` | 아니오 | 설명. 헤더가 `#`로 시작하면 **로드 시 무시** |

다른 `#…` 열을 추가해도 파서가 읽지 않는다. `key`가 `#`로 시작하는 행도 무시(주석 행).

### 단위

| 종류 | 시트 | 게임 런타임 |
|------|------|-------------|
| 시간 (`*Sec`) | **초** (예: 60, 1.5) | ms로 변환 (`×1000`) |
| 확률 (`*Chance`) | 0~1 | 그대로 |
| 개수·버전 | 숫자 | 그대로 |

로컬 fallback `prototype/data/balance.json`은 **이미 ms**인 nested JSON이다. 시트와 스키마를 섞지 말 것.

---

## 키 목록 (복사·붙여넣기용)

헤더 + 기본값 예시:

```
key	value	#desc
meta.version	1	밸런스 세트 버전. 기획이 수치 바꿀 때 올린다. 타이틀에 balance vN으로 표시
timers.selectSec	60	패 선택 제한 시간(초). 가위·바위·보를 고르는 턴
timers.adjustSec	15	수정 페이즈 기본 제한 시간(초)
match.maxPenalties	3	페널티 상한. 이 수에 도달하면 해당 플레이어 패배 등으로 처리
match.startChanges	2	매치 시작 시 플레이어가 가진 바꾸기 횟수
match.startBluffs	1	매치 시작 시 플레이어가 가진 페이크 횟수
ai.adjustChanceOnDraw	0.25	무승부일 때 AI가 수정 페이즈에서 바꾸기를 시도할 확률 (0~1)
ai.adjustChanceWhenWinner	0.55	AI가 이기고 있을 때 수정 페이즈에서 바꾸기를 시도할 확률 (0~1)
ai.bluffChance	0.45	AI가 페이크를 쓸 확률 (0~1)
ai.adjustDelayMinSec	1	AI가 수정 페이즈에서 행동하기 전 최소 대기(초)
ai.adjustDelayMaxSec	4	AI가 수정 페이즈에서 행동하기 전 최대 대기(초)
ai.bluffDelayMinSec	0.3	AI가 페이크하기 전 최소 대기(초)
ai.bluffDelayMaxSec	1.1	AI가 페이크하기 전 최대 대기(초)
```

필수 키가 빠지거나 숫자가 아니면 시트 로드가 실패하고 로컬 JSON(또는 defaults)을 쓴다.

---

## 웹에 게시 (CSV)

1. 스프레드시트에서 **파일 → 공유 → 웹에 게시**
2. 해당 시트(또는 범위) · 형식 **CSV** · 게시
3. 나온 URL을 프로토타입 `BALANCE_URL`에 넣는다 (또는 아래 예시 URL 유지)

**예시 (공개 게시 CSV):**  
https://docs.google.com/spreadsheets/d/e/2PACX-1vSDLFmfN09iJUUNMn08J0vQqqYal3qHWFayxAk7BnbjLICy6dJebAvdWakdApwTpGl9ZoXA4NKkHDsF/pub?output=csv

- 이 URL은 **읽기 전용 공개**이다. 편집 권한·API 키·비공개 시트 ID는 레포에 커밋하지 말 것.
- 게시 후 수정 반영까지 Google 쪽에서 수 초~수분이 걸릴 수 있다.
- 프로토타입은 `cache: 'no-store'`로 fetch한다. 확인은 **로컬 HTTP 서버**로 (`file://`는 CORS로 막힐 수 있음).

---

## 로드 우선순위

1. `BALANCE_URL` (기본: 위 시트 CSV) → 성공 시 타이틀 `balance vN · sheet`
2. 실패 시 `./data/balance.json` → `· json`
3. 그래도 실패 → 직전 값 또는 코드 기본값 → `· defaults`

매치 도중에는 다시 읽지 않는다. 부팅·타이틀 복귀 시에만 로드한다.
