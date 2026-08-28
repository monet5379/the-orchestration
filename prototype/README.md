# The Orchestration — HTML Prototype

1:1 턴제 심리 스릴러 로그라이크 HTML 프로토타입.  
**현재 버전: v0.1.28** (Step 0~6 완료)

버전별 변경·수동 테스트 이력 → [`ARCHIVE.md`](./ARCHIVE.md)  
공유용 패치노트 → [`../docs/patch-note/0.1.28.md`](../docs/patch-note/0.1.28.md)

---

## 지금 할 수 있는 것

- 가위·바위·보 + **60초** 패 선택 · **30초** **ADJUST**(유지 / 변경 / 페이크)
- ADJUST 중 **현재 패 버튼은 비활성** (다른 패로만 수정)
- 천장에 「승자 있음 / 무승부」만 공개, 페널티 **3회**로 승패
- 무승부 시 아이템 1개 획득 (본능 · 시간 팽창 · 규칙 파괴)
- 마스크 POV · **POV 안 HUD**(턴·페널티·수정·페이크·가면) · SFX(상대 페이크·SELECT 선택)
- **승리 → 독방** (가면 수집·장착·설명, VHS 복기, 다음 상대)
- **패배 → 게임오버** (다시 하기 = 세이브 유지)
- 타이틀 **새 게임 / 이어하기** · `localStorage` 가면·전적·최근 5매치
- 매치 **개발자 모드** 토글 → 강제 승리·패배 (페널티 3/3)

---

## 실행

### Windows

`run.bat` 더블클릭 → 서버가 `/js/main.js`에 응답하면 브라우저가 열립니다 (`http://localhost:8080`).

### 터미널

```bash
cd prototype
npx serve .
# 또는
python -m http.server 8080
```

정적 서버를 권장합니다 (`file://`는 ES Module·SFX가 깨질 수 있음).  
모듈 수정 후 import 오류가 보이면 **Ctrl+Shift+R**로 캐시를 비우세요.

---

## 화면

| 화면 | 진입 | 주요 UI |
|---|---|---|
| 메뉴 | 시작 / 타이틀 | [이어하기] · [새 게임] · 세이브 요약 |
| 매치 | 이어하기·새 게임·다음 상대·다시 하기 | POV(+HUD), 천장, 버튼, event-log · 개발자 모드 |
| 독방 | **승리** | 가면 진열·장착 설명, VHS·안내, [다음 상대] / [타이틀] |
| 게임오버 | **패배** | [다시 하기] |

매치·독방 중 `#overlay`는 숨겨집니다.

---

## 규칙 요약

| 항목 | 내용 |
|---|---|
| 버튼 순서 | 가위 → 바위 → 보 |
| ADJUST | 5초(시간 팽창 시 +2초) · `[유지]` / 다른 패로 변경 / `[페이크]` |
| ADJUST 연출 | 내 수정·페이크는 무음 · **상대 페이크**만 소리+빨간 플래시 |
| 페널티 | 패배 시 +1 · **3/3**이면 매치 종료 |
| 무승부 아이템 | 테이블 3종 중 나 1 + CPU 1 |
| 가면 (장착 1개) | ☺ 수정권+1 · ? 페이크+1 · × 첫 ADJUST 본능형 힌트 |

---

## 폴더 (요약)

```
prototype/
├── index.html · run.bat · README.md · ARCHIVE.md
├── css/          # layout, ceiling, pov, panel, cell, vhs …
├── js/
│   ├── main.js
│   ├── core/     # constants, timing, storage, save-schema
│   ├── game/     # phases, items, masks, replay …
│   ├── ai/ · scenes/ · ui/   # + dev-mode.js
├── assets/sfx/
└── tests/
```

자세한 아키텍처: [`../docs/HTML_Prototype_Structure.md`](../docs/HTML_Prototype_Structure.md)  
기획서와의 차이: [`../docs/Proposal_vs_Prototype.md`](../docs/Proposal_vs_Prototype.md)
