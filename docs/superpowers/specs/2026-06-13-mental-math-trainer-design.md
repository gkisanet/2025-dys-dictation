# 암산 학습 앱 (Mental Math Trainer) — 설계 명세

작성일: 2026-06-13

## 1. 개요와 목표

기존 "한글 받아쓰기 챌린지" 앱을 **전면 폐기**하고, 같은 저장소에서 **수학 암산 학습 앱**을 새로 만든다.

핵심 가치: 덧셈·뺄셈·곱셈을 **머릿속으로 어떻게 계산하는지**를, 세로셈이 한 단계씩 그려지는 **애니메이션**으로 가르친다. 단순히 절차를 보여주는 것을 넘어, **"왜 그렇게 하는가"를 설명하는 내레이션**(예: "24는 20과 4가 합쳐진 수라 나눠서 곱한다", "20은 ×10이라 0이 일의 자리에 먼저 온다")을 단계마다 제시하고, 진행 중간중간 **주관식 퀴즈 체크포인트**로 능동적 암산을 훈련시킨다.

## 2. 범위 (Scope)

**이번 명세 포함:**
- 덧셈, 뺄셈, 곱셈 (2자리 중심)
- 단계별 애니메이션 엔진 + 단계별 내레이션
- 주관식 퀴즈 체크포인트 (정답 입력해야 진행, 단계적 힌트)
- 레벨/커리큘럼 (문제 난이도 축 + 상세도 축)
- SQLite(WASM/OPFS) 영속화 + 진행도/통계
- TanStack Router 기반 라우팅
- **반응형·모바일 컴팩트** UI

**이번 명세 제외 (확장 지점으로만 설계):**
- 나눗셈, 분수
- 계정/백엔드 동기화(로그인)
- 사운드/햅틱

## 3. 기술 스택

- **Vite + React 19 + TypeScript**
- **Tailwind CSS + shadcn/ui** (구조적 레이아웃·컴포넌트), **lucide-react** (아이콘)
- **TanStack Router** (라우팅 적극 활용), **TanStack Query** (SQLite 비동기 데이터 계층 래핑)
- **Framer Motion** (`motion`) — 애니메이션. **커스텀 스텝 타임라인**(reducer/상태머신)이 재생을 제어
- **wa-sqlite** (SQLite WASM) + **OPFS** 영구 저장, **Drizzle ORM** 으로 타입 스키마/쿼리
- **Vitest + React Testing Library** 테스트
- 기존 받아쓰기 코드(`components/*`, `data/dictationData.js`, 상태머신형 `App.jsx`)는 제거

## 4. 핵심 도메인 모델 — 애니메이션 엔진 (앱의 심장)

연산 종류와 무관한 **공용 엔진**과, 연산별 **단계 생성기(strategy)** 로 분리한다. 이렇게 해야 나중에 나눗셈·분수를 단계 생성기 추가만으로 확장할 수 있다.

### 4.1 순수 컴파일: `buildSteps(problem, level) → Step[]`
문제 하나를 레벨에 맞춰 **선언적 단계 배열**로 컴파일하는 순수 함수.

- `Problem`: `{ operation: 'add'|'sub'|'mul', operands: [a, b] }`
- `Step`:
  - `id`
  - `kind`: `'setup' | 'decompose' | 'digit-op' | 'carry' | 'borrow' | 'place-zero' | 'partial' | 'gather' | 'sum' | 'result'` 등
  - `narration`: 그 단계의 "왜/무엇" 설명 텍스트
  - `board`: 이 단계 직후의 **워크시트 상태**(`BoardState`)
  - `quiz?`: `{ prompt, answer:number, hints: string[] }` (있을 때만, 체크포인트)
- `BoardState`: 워크시트를 그리기 위한 선언적 묘사. 셀 목록 = `{ value, place(일/십/백…), role('operand'|'partial'|'carry'|'result'|'zero-placeholder'), region, highlight, visible }`. 곱셈 트리를 위해 **다중 영역**(top / leftBranch / rightBranch / merge)을 가질 수 있다.

### 4.2 렌더러: `WorksheetRenderer`
`BoardState`를 받아 그린다. 이전 BoardState와의 **차이(diff)** 를 Framer Motion으로 애니메이션한다. 애니메이션 프리미티브:
- `reveal` — 숫자가 위에서 떨어지듯 등장
- `carryFly` — 올림 숫자가 위로 날아가 **윗첨자처럼 해당 자리 위에 계속 남음**
- `decomposeSplit` — 한 수가 두 수로 갈라짐 (예: 24 → 20 + 4)
- `placeZero` — ×10 자리수 0을 일의 자리에 강조하며 배치 (주황 강조 + "한 칸 밀림" 태그)
- `gatherGlide` — 양쪽 부분결과가 가운데로 모여 위아래로 쌓임 (곱셈 병합)
- `highlightFlash` — 지금 쓰는 숫자 반짝
- `drawLine` / `connector` — 가로줄·분기선 그리기
- `prefers-reduced-motion` 존중: 모션 대신 즉시 표시 폴백

### 4.3 솔브 엔진: `useSolveEngine` (useReducer 상태머신)
- 상태: `stepIndex`, 서브상태 `idle → animating → (awaitingQuiz → quizFeedback) → advancing → done`
- 추적: `attempts`, `hintLevel`, `score(correct/total)`
- 퀴즈가 있는 단계에서 **정답을 맞힐 때까지 멈춤**. 오답 → 힌트 단계 상승 → 재시도. 2~3회 오답 → 정답 공개 후 다음 단계.
- 내레이션만 있는 단계는 "다음 ▶" 버튼(또는 설정된 딜레이)으로 진행 → **사용자 페이스**.

## 5. 연산별 단계 모델

- **덧셈**: 자리별 더하기. 올림(받아올림)은 **윗첨자로 해당 자리 위에 계속 남음**. 자리마다 내레이션.
- **뺄셈**: 받아내림(빌림) 과정을 시각화. 윗자리에서 10을 빌려오는 표시 + 내레이션.
- **곱셈 (분배 트리)**: 이번 프로젝트의 시그니처. `18 × 24` 예:
  1. 세로 정렬
  2. **분해**: `24 = 20 + 4` → 두 갈래로 분기 (분기선 애니메이션)
  3. **왼쪽 가지**: `18 × 4` 를 따로 계산 (8×4=32 → 2, 올림 3 윗첨자; 1×4+3=7 → 72)
  4. **오른쪽 가지**: `18 × 20` 을 따로 계산 — **자리수 0 강조**: 20=2×10이라 일의 자리에 0을 먼저 두고(주황 강조 + 태그), 그 앞에 18×2=36 → **360** ("36이 아니라 360인 이유")
  5. **병합**: 72·360 이 **가운데로 모여** 위아래로 쌓이고(360이 아래), 더해서 **432**. 덧셈 올림 1도 윗첨자로 남음.

## 6. 레벨 / 커리큘럼

레벨은 **두 축**으로 구성한다.

**A. 문제 패턴(난이도 축)** — 연산별 단계적 상승. 곱셈 예:
- `M1`: 1자리 × 1자리 (구구단 기반)
- `M2`: 2자리 × 1자리
- `M3`: 2자리 × (10의 배수: 20·30·40…) — **자리수 0 밀림 연습 (중간 단계 레벨)**
- `M4`: 2자리 × 2자리 (풀 분배 트리)

덧셈/뺄셈도 유사: 받아올림/내림 없음 → 있음, 자릿수 증가.

**B. 상세도(verbosity 축)** — 과정 생략 정도:
- `V1 전체`: 모든 미세 단계 애니메이션 + 매 단계 퀴즈
- `V2 부분생략`: 핵심 단계만 보여주고 부분곱·올림 등만 질문
- `V3 답만`: 애니메이션 없이 최종 답만 입력

**커리큘럼** = (패턴 × 상세도) 조합을 순서지은 스테이지 목록. 숙련도(mastery) 게이팅으로 다음 스테이지 잠금 해제. 진행도는 SQLite에 저장.

## 7. 퀴즈 동작

- **블로킹**: 체크포인트에서 애니메이션이 멈추고, 정답을 입력해야 다음 단계가 그려짐.
- **오답 처리**: 힌트 → 재시도, 2~3회 오답 시 정답 공개 후 진행.
- 주관식(숫자 입력). 세션 점수 = 맞은 퀴즈 / 전체 퀴즈.

## 8. UI / 레이아웃 (반응형 · 모바일 컴팩트 우선)

**솔브 화면** — 워크시트/애니메이션이 주인공.
- **데스크탑**: 레이아웃 B — 워크시트(좌) + 단계 안내·내레이션·퀴즈 패널(우).
- **모바일/컴팩트**: 세로 스택. 워크시트가 화면 폭에 맞게 **축소(scale-to-fit)**, 내레이션+퀴즈는 **바텀시트/카드**로. 곱셈 트리 분기는 좁은 폭에서 **reflow**(축소 또는 세로 스택). 셀 크기·여백을 작게.
- 컨트롤: 다음 ▶ / 다시 재생 / 속도.

**라우트 (TanStack Router):**
- `/` — 홈/대시보드: 연산 선택 카드(lucide 아이콘), 진행도 요약
- `/learn/$operation` — 레벨/스테이지 선택
- `/solve/$operation/$stageId` — 풀이 세션(N문제) + 결과 요약
- `/progress` — 통계/이력
- (`/settings` — 속도/모션 등, 선택)

**디자인 원칙**: shadcn 컴포넌트로 구조 잡고 lucide 아이콘 사용, 모바일 우선의 컴팩트한 간격.

## 9. 데이터 영속화 (SQLite WASM + OPFS + Drizzle, TanStack Query 래핑)

- **DB 초기화 모듈**: wa-sqlite 로드 → OPFS 백업 DB 오픈 → 최초 로드시 Drizzle 마이그레이션 실행.
- **스키마(Drizzle):**
  - `attempts(id, operation, stage_id, operand_a, operand_b, verbosity, is_correct, quiz_correct, quiz_total, duration_ms, created_at)`
  - `progress(operation, stage_id [PK], best_score, solved_count, mastered, last_played_at)`
  - `settings(key [PK], value)`
- **Repository 계층**이 Drizzle을 감싸고, **TanStack Query**가 repository를 감싼다 (`useProgress`, `useStats` 쿼리 / `recordAttempt` 뮤테이션 → progress 무효화).

## 10. 문제 생성

- `generateProblem(operation, pattern)` — 런타임 `Math.random` 사용. 패턴별 범위 내에서 피연산자 생성, **교육적 제약** 보장(의도한 경우 받아올림/내림 발생, M3는 곱하는 수가 10의 배수 등). 테스트/재현용 옵셔널 시드.

## 11. 애니메이션 구현 상세 (Framer Motion + 커스텀 타임라인)

- 단계별 `useAnimate()` async 시퀀스. 좌표 기반 이동은 **측정한 셀 rect**로 `animate(el, { x, y })` (픽셀 델타 — 데모에서 겪은 `calc(-50% + -Npx)` 같은 CSS 버그 없음).
- 타임라인 = 솔브 엔진이 스텝 커서를 전진. 한 스텝 안에서 렌더러가 그 스텝의 애니메이션을 재생하고 완료되면 resolve → 엔진이 자동 진행(내레이션) 또는 퀴즈에서 정지.
- 올림은 윗첨자 셀로 이동 후 **유지**, 분해는 공유요소/좌표 전환, 자리수 0은 강조+태그.
- `prefers-reduced-motion` 폴백.

## 12. 디렉토리 구조

```
src/
  routes/                  TanStack Router 라우트
  features/
    solver/
      useSolveEngine.ts    상태머신
      WorksheetRenderer.tsx
      NarrationPanel.tsx  QuizPanel.tsx  StepGuide.tsx  Controls.tsx
      animations/          reveal, carryFly, gatherGlide, placeZero …
      steps/
        types.ts           Step, BoardState
        buildAddition.ts  buildSubtraction.ts  buildMultiplication.ts
    problems/              generateProblem, ranges
    curriculum/            스테이지 정의, 게이팅
    progress/              queries, 통계 컴포넌트
  db/                      sqlite 초기화, schema(drizzle), repositories
  components/ui/           shadcn
  lib/                     utils
```
제거: `components/{LevelSelector,Game,Question,Results}.jsx`, `data/dictationData.js`, 기존 `App.jsx`.

## 13. 테스트 전략

- **단위(Vitest)**: 단계 생성기가 알려진 입력에 대해 **정확한 Step[]/BoardState/quiz** 를 생성 (예: `buildMultiplication(18,24,V1)` → 분해·부분곱·병합·올림 단계). `generateProblem` 범위·제약. 퀴즈 정답의 산술 정확성.
- **컴포넌트(RTL)**: 솔브 엔진 — 퀴즈가 정답까지 블로킹, N회 후 공개, 진행. reduced-motion 경로.
- **DB**: repository CRUD (node에서 wa-sqlite 또는 인메모리), progress 무효화.

## 14. 확장 지점

- **나눗셈/분수**: 새 단계 생성기 + board kind 추가, 엔진·렌더러·퀴즈·레벨 재사용.
- **백엔드 동기화**: repository를 원격 구현으로 교체, Query 계층 유지.

## 15. 마이그레이션

같은 저장소 내 그린필드 재구축: 새 스택 스캐폴드 → 기존 받아쓰기 앱 삭제 → `index.html`/엔트리·`package.json`(deps·name) 갱신.

## 16. 미해결 / 후속

- 앱 이름(작업명: "암산 도장" / "Mental Math Trainer") — 추후 확정, 차단 요소 아님.
- 스테이지별 정확한 수 범위 — 구현 단계에서 확정.
- 사운드/햅틱 — 후속.
