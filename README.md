# 한글 받아쓰기 챌린지 📝

초등학교 1~2학년을 위한 받아쓰기 연습 앱입니다.  
음성으로 문제를 듣고, 올바른 맞춤법을 선택하는 퀴즈 방식입니다.

## 핵심 기능

- **학년 선택**: 1학년 / 2학년 선택
- **급수별 문제**: 학년별 8~10단원, 단원당 10문제
- **TTS 음성 재생**: Web Speech API로 문제를 읽어줌 (자동 + 다시 듣기)
- **정오답 즉시 피드백**: 시각적 강조 + 점수 실시간 표시
- **결과 화면**: 최종 점수 및 재도전 옵션

## 기술 스택

- React 19 + Vite 7
- Vanilla CSS (반응형, 모바일 최적화)
- Web Speech API (TTS)

## 디렉토리 구조

```
src/
├── App.jsx                    # 메인 앱 (상태 관리)
├── App.css                    # 전체 스타일
├── main.jsx                   # 엔트리포인트
├── index.css                  # 글로벌 CSS (리셋, 폰트)
├── components/
│   ├── GradeSelector.jsx      # 학년 선택 화면
│   ├── LevelSelector.jsx      # 급수(단원) 선택 화면
│   ├── Game.jsx               # 게임 진행 화면
│   ├── Question.jsx           # 개별 문제 (TTS + 선택지)
│   └── Results.jsx            # 결과 화면
└── data/
    ├── gradeData.js           # 학년별 데이터 통합 인덱스
    ├── dictationData.js       # 1학년 받아쓰기 데이터
    └── dictationData2.js      # 2학년 받아쓰기 데이터
```

## 앱 흐름

```
학년 선택 → 급수(단원) 선택 → 문제 풀이 → 결과 확인
```

## 실행 방법

```bash
npm install
npm run dev
```
