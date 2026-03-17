# Changelog

## [2026-03-17] 기능추가 - 학년 선택 페이지 및 2학년 데이터

- 학년 선택(1학년/2학년) 화면 추가 (`GradeSelector.jsx`)
- 2학년 받아쓰기 데이터 생성 (8단원, 80문제 + 오답) (`dictationData2.js`)
- 학년별 데이터 통합 관리 모듈 추가 (`gradeData.js`)
- `App.jsx` 상태 흐름 4단계로 확장 (gradeSelection → levelSelection → playing → results)
- `Results.jsx`에 "다른 급수 도전하기" 버튼 추가
- `App.css`에 학년 선택 카드, 뒤로가기 버튼 스타일 추가
- `README.md` 전면 재작성
- `docs/` 문서 초기 생성 (CONTEXT, TASKS, CHANGELOG, HANDOVER)
