# The Orchestration — HTML Prototype

1:1 턴제 심리 스릴러 로그라이크 HTML 프로토타입.  
**현재 버전: v0.1.30** (Step 0~6 완료)

버전별 변경·수동 테스트 이력 → [`ARCHIVE.md`](./ARCHIVE.md)  
공유용 패치노트 → [`../docs/patch-note/external/0.1.42.md`](../docs/patch-note/external/0.1.42.md)  
내부(프로그래머) → [`../docs/patch-note/internal/0.1.42.md`](../docs/patch-note/internal/0.1.42.md)

---

## 지금 할 수 있는 것

- 가위·바위·보 + **60초** 패 선택 · **15초** **ADJUST**(유지 / 바꾸기 / 페이크 · **한 번 확정**)
- ADJUST 결정 후 **전부 잠금** · 유효 패에 **노란 테두리** · 나와 상대가 모두 끝내면 **즉시 RESOLVE**
- 상대 버튼 안내: 기본 **유지/바꾸기**(페이크는 바꾸기 위장) · **본능/×가면**은 페이크까지 정확
- 천장에 「승자 있음 / 무승부」만 공개, 페널티 **3회**로 승패
- 무승부 시 아이템 1개 획득 (본능 · 규칙 파괴)
- 마스크 POV · **POV 안 HUD**(턴·페널티·바꾸기·페이크·가면) · SFX(상대 페이크·바꾸기·SELECT)
- **승리 → 독방** (가면 수집·장착·설명, VHS 복기, 다음 상대)
- **패배 → 게임오버** (다시 하기 = 세이브 유지)
- 타이틀 **새 게임 / 이어하기**(세이브 시 인라인 확인) · `localStorage`
- 매치 **개발자 모드** 토글 → 강제 승리·패배 (페널티 3/3)

---

## 실행

### Windows

`run.bat` 더블클릭 → `run.ps1`이 `serve.py`를 띄우고 브라우저를 엽니다 (`http://127.0.0.1:8080/`).  
종료: 런처 창에서 **Ctrl+C** 또는 **아무 키**.

### 터미널

```bash
cd prototype
python serve.py --port 8080
# 또는 (캐시 주의)
npx serve .
python -m http.server 8080
```

정적 서버를 권장합니다 (`file://`는 ES Module·SFX가 깨질 수 있음).  
개발 중 named export 오류가 보이면 **런처 재시작** + **Ctrl+Shift+R** (`serve.py`는 JS에 no-store).

---

## 화면

| 화면 | 진입 | 주요 UI |
|---|---|---|
| 메뉴 | 시작 / 타이틀 | [이어하기] · [새 게임] · 세이브 요약 · 새 게임 확인 |
| 매치 | 이어하기·새 게임·다음 상대·다시 하기 | POV(+HUD), 천장, 버튼, event-log · 개발자 모드 |
| 독방 | **승리** | 가면 진열·장착 설명, VHS·안내, [다음 상대] / [타이틀] |
| 게임오버 | **패배** | [다시 하기] |

매치·독방 중 `#overlay`는 숨겨집니다.

---

## 규칙 요약

| 항목 | 내용 |
|---|---|
| 버튼 순서 | 가위 → 바위 → 보 |
| ADJUST | 최대 **15초** · `[유지]` / 다른 패로 바꾸기 / `[페이크]` · **한 번이면 끝** |
| ADJUST 표시 | 확정 후 전부 잠금 · 유효 패·유지/페이크에 노란 테두리 |
| ADJUST 안내 | 기본 유지/바꾸기 · 본능·가면은 페이크 구분 · CPU 최종 행동 **1회** |
| CPU 바꾸기 | 무승부 → **카운터 고정** · 승자 있음 → 다른 패 랜덤 |
| ADJUST 종료 | 양측 결정 완료 시 **즉시** / 아니면 타이머 만료 |
| ADJUST 연출 | 내 바꾸기·페이크는 무음 · **상대 페이크·바꾸기**는 소리+빨간 플래시 |
| 페널티 | 패배 시 +1 · **3/3**이면 매치 종료 |
| 무승부 아이템 | 테이블 2종 중 나 1 + CPU 1 |
| 가면 (장착 1개) | ☺ 바꾸기+1 · ? 페이크+1 · × 첫 ADJUST 본능형 힌트 · ◑ 동전 후공 |

---

## 폴더 (요약)

```
prototype/
├── index.html · run.bat · run.ps1 · serve.py · README.md · ARCHIVE.md
├── css/          # layout, ceiling, pov, panel, cell, vhs …
├── js/
│   ├── main.js
│   ├── core/     # constants, event-bus, storage, timing …
│   ├── game/     # state, phases, rps, items, masks, replay …
│   ├── ai/       # opponent
│   ├── ui/       # renderer, overlay, panel, pov, cell, vhs …
│   └── scenes/   # menu, match, cell
└── assets/sfx/
```
