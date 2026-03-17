# Architecture & Context

## 아키텍처 개요

React SPA로 4단계 상태 흐름을 가진 받아쓰기 학습 앱.

```
gradeSelection → levelSelection → playing → results
```

## 상태 관리

`App.jsx`에서 `useState`로 관리하는 4개 상태:
- `gameState`: 현재 화면 단계
- `selectedGrade`: 선택된 학년 키 (grade1, grade2)
- `selectedLevel`: 선택된 급수 객체
- `gameResults`: {correct, incorrect} 점수

## 데이터 구조

- `gradeData.js`: 학년별 메타(label, emoji, description) + levels 배열 참조
- `dictationData.js` / `dictationData2.js`: 각 학년별 문제 배열
- 각 문제: `{id, correct, incorrect[3]}`
- `Question.jsx`에서 오답 3개 중 1개를 랜덤 선택 → 정답과 섞어 2지선다

## TTS

Web Speech API (`SpeechSynthesisUtterance`) 사용. 한국어(ko-KR), 속도 0.9배.
문제 로드 시 자동 재생 + "다시 듣기" 버튼.
