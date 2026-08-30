# 버전업 규칙 · 체크리스트

제품 버전(`0.1.x`)을 올릴 때 **어디를 고칠지** 빠뜨리지 않기 위한 문서입니다.

정책 요약(내부는 잘게 / 외부는 배포 때 한 장): [`internal/README.md`](./internal/README.md)  
커밋 메시지: [`../COMMIT.md`](../COMMIT.md) — 제목에 `v0.1.xx:` 접두 **금지**

---

## 어떤 경우인가

| 경우 | 언제 | 제품 표시(타이틀 등) |
|------|------|----------------------|
| **A. 내부만** | 의미 있는 코드·규칙 변경마다 | 맞추지 않아도 됨 (이전 공유 번호 유지 가능) |
| **B. 외부 배포** | Discord·Pages 등 **공유할 때** | 외부 노트 번호와 **동일**하게 맞춤 |

한 외부 릴리스에 내부 버전·커밋이 여러 개여도 됩니다.

---

## A. 내부만 올릴 때

다음 내부 번호 예: `0.1.43`

- [ ] `docs/patch-note/internal/0.1.xx.md` **새 파일** 작성 (과거 스냅샷 덮어쓰기 금지)
- [ ] 노트에 「외부 후보」또는 「외부 후보: 없음」
- [ ] 노트에 「제품 표시」— 아직 이전 공유 번호일 수 있음 / 배포 시 맞춤
- [ ] `docs/patch-note/internal/README.md` → `작업 중:` 을 새 파일로
- [ ] 고친 모듈만 `prototype/js/main.js` 의 `import …?v=` 캐시 버스트 (선택·해당 시)

---

## B. 외부 배포할 때

배포 번호 예: `0.1.42` (= 그 배포에 묶인 내부 최신)

### 1. 제품 표시 (필수)

- [ ] `prototype/index.html` — 타이틀  
  `죽음을 관리하는 자 — HTML Prototype v0.1.xx`
- [ ] `prototype/index.html` — `js/main.js?v=0.1.xx`
- [ ] `prototype/js/main.js` — `console.log('[Orchestration] v0.1.xx …')`

### 2. 패치노트 (필수)

- [ ] `docs/patch-note/external/0.1.xx.md` **새 파일**  
  - 본문: **직전 외부 공유본** 대비 플레이어 체감  
  - 하단: [`external/README.md`](./external/README.md)의 **Discord 붙여넣기용** 규칙
- [ ] `docs/patch-note/external/README.md` — `현재 공유본` · 「다음 배포는 … 대비」예시
- [ ] `docs/patch-note/internal/README.md` — `현재 공유본` · `작업 중` 정리
- [ ] 이번 배포에 넣은 내부 노트 — 「반영됨 — `../external/0.1.xx.md`」

### 3. README · 안내 링크 (권장)

- [ ] `README.md` — `현재 빌드` · `패치노트` 링크
- [ ] `prototype/README.md` — `현재 버전` · 외부/내부 패치노트 링크
- [ ] `prototype/ARCHIVE.md` — 상단 패치노트 링크 (이력 표·체크리스트는 필요 시)

### 4. 설계 문서 (배포 때 맞추면 좋음)

- [ ] `docs/Proposal_vs_Prototype.md` — 상단 현재 버전 · 변경 이력 행
- [ ] `docs/HTML_Prototype_Structure.md` — 상단 버전 · 본문 필요 시

### 5. 배포 후

- [ ] `main` push → GitHub Pages 반영 확인  
  (`https://monet5379.github.io/the-orchestration/`)
- [ ] 외부 노트 Discord 블록 복사 · 붙여넣기 (2000자·표 없음)

---

## 건드리지 않는 것

| 대상 | 이유 |
|------|------|
| 과거 `internal/0.1.*.md` · `external/0.1.*.md` 스냅샷 | 이력. 덮어쓰지 않음 |
| `balance.json` / 시트 `meta.version` | **밸런스 세트** 버전 (제품 `0.1.x`와 별개) |
| `.github/workflows/deploy-prototype.yml` | 버전 문자열 없음 |
| 커밋 제목의 `v0.1.xx:` | [`COMMIT.md`](../COMMIT.md)에서 금지 |

미공유 초안 외부 노트를 쓴 적 없다면, 실제로 공유한 파일만 남깁니다 ([`external/README.md`](./external/README.md)).

---

## 빠른 검색

제품·문서에 남은 옛 번호를 찾을 때:

```text
HTML Prototype v
main.js?v=
[Orchestration] v
현재 빌드
현재 버전
현재 공유본
```

모듈 `?v=`는 `prototype/js/main.js` 상단 import도 확인합니다.
