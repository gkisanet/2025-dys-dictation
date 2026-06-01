import React, { useState } from 'react';
import GradeSelector from './components/GradeSelector';
import LevelSelector from './components/LevelSelector';
import Game from './components/Game';
import Results from './components/Results';

// 구구단 컴포넌트 동적 임포트
import GugudanSetup from './components/gugudan/GugudanSetup';
import GugudanGame from './components/gugudan/GugudanGame';
import GugudanResults from './components/gugudan/GugudanResults';

import { gradeData } from './data/gradeData';
import './App.css';

// 앱 전체 모드: null (통합 홈), 'dictation' (받아쓰기), 'gugudan' (구구단)
function App() {
  const [appMode, setAppMode] = useState(null);

  // ==========================================
  // [1] 한글 받아쓰기 앱 상태 흐름 관리
  // ==========================================
  const [dictationState, setDictationState] = useState('gradeSelection');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [dictationResults, setDictationResults] = useState({ correct: 0, incorrect: 0 });

  const handleGradeSelect = (gradeKey) => {
    setSelectedGrade(gradeKey);
    setDictationState('levelSelection');
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setDictationState('playing');
  };

  const handleDictationFinish = (results) => {
    setDictationResults(results);
    setDictationState('results');
  };

  const handleRestartDictation = () => {
    setDictationState('gradeSelection');
    setSelectedGrade(null);
    setSelectedLevel(null);
    setDictationResults({ correct: 0, incorrect: 0 });
  };

  const handleBackToDictationLevels = () => {
    setDictationState('levelSelection');
    setSelectedLevel(null);
    setDictationResults({ correct: 0, incorrect: 0 });
  };

  // ==========================================
  // [2] 구구단 15단 앱 상태 흐름 관리
  // ==========================================
  const [gugudanState, setGugudanState] = useState('setup'); // 'setup' | 'playing' | 'results'
  const [gugudanLevelData, setGugudanLevelData] = useState(null);
  const [gugudanResults, setGugudanResults] = useState({ score: 0, total: 0, wrongAnswers: [], timeSpent: 0 });

  const handleGugudanStart = (setupData) => {
    setGugudanLevelData(setupData);
    setGugudanState('playing');
  };

  const handleGugudanFinish = (results) => {
    setGugudanResults(results);
    setGugudanState('results');
  };

  const handleGugudanRetry = () => {
    // 이전 난이도/설정 그대로 재게임 시작
    setGugudanState('playing');
  };

  const handleGugudanBackToSetup = () => {
    setGugudanState('setup');
    setGugudanLevelData(null);
  };

  // 통합 홈으로 복귀 (모든 상태 완전 클리어)
  const handleGoToHome = () => {
    setAppMode(null);
    handleRestartDictation();
    setGugudanState('setup');
    setGugudanLevelData(null);
  };

  return (
    <div className="app-container">
      {/* 🚀 최상위 헤더 로고 터치 시 홈으로 이동 가능하도록 구성 */}
      <h1 className="main-app-title" onClick={handleGoToHome}>
        배움 놀이터 🌟
      </h1>

      {/* ==========================================
         [A] 통합 앱 런처 (Launcher 홈 화면)
         ========================================== */}
      {appMode === null && (
        <div className="launcher-container">
          <p className="launcher-subtitle">오늘도 재밌게 놀면서 배워볼까요?</p>
          
          <div className="launcher-cards">
            {/* 1. 받아쓰기 앱 카드 */}
            <div className="launcher-card dictation" onClick={() => setAppMode('dictation')}>
              <div className="launcher-card-icon">📝</div>
              <h2 className="launcher-card-title">한글 받아쓰기 챌린지</h2>
              <p className="launcher-card-desc">
                초등학교 1~2학년 필수 낱말과 알맞은 맞춤법을 소리를 듣고 재미있게 맞혀보세요!
              </p>
              <span className="launcher-card-btn">시작하기 ➔</span>
            </div>

            {/* 2. 구구단 풀이 앱 카드 */}
            <div className="launcher-card gugudan" onClick={() => setAppMode('gugudan')}>
              <div className="launcher-card-icon">🧮</div>
              <h2 className="launcher-card-title">구구단 15단 챌린지</h2>
              <p className="launcher-card-desc">
                2단 기본 곱셈부터 15단 심화 연산까지! 주관식과 객관식 모드로 연산력을 쑥쑥 높여보세요.
              </p>
              <span className="launcher-card-btn">시작하기 ➔</span>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
         [B] 한글 받아쓰기 서브 도메인 뷰 포트
         ========================================== */}
      {appMode === 'dictation' && (
        <div className="sub-app-section">
          {dictationState === 'gradeSelection' && (
            <>
              <button className="back-button" onClick={handleGoToHome}>
                ← 메인 홈으로
              </button>
              <GradeSelector grades={gradeData} onSelect={handleGradeSelect} />
            </>
          )}

          {dictationState === 'levelSelection' && selectedGrade && (
            <>
              <button className="back-button" onClick={handleRestartDictation}>
                ← 학년 선택으로
              </button>
              <LevelSelector
                levels={gradeData[selectedGrade].levels}
                onSelect={handleLevelSelect}
              />
            </>
          )}

          {dictationState === 'playing' && (
            <Game levelData={selectedLevel} onFinish={handleDictationFinish} />
          )}

          {dictationState === 'results' && (
            <Results
              results={dictationResults}
              onRestart={handleRestartDictation}
              onBackToLevels={handleBackToDictationLevels}
            />
          )}
        </div>
      )}

      {/* ==========================================
         [C] 구구단 15단 서브 도메인 뷰 포트
         ========================================== */}
      {appMode === 'gugudan' && (
        <div className="sub-app-section">
          {gugudanState === 'setup' && (
            <GugudanSetup
              onStart={handleGugudanStart}
              onBackHome={handleGoToHome}
            />
          )}

          {gugudanState === 'playing' && (
            <GugudanGame
              levelData={gugudanLevelData}
              onFinish={handleGugudanFinish}
              onBackToSetup={handleGugudanBackToSetup}
            />
          )}

          {gugudanState === 'results' && (
            <GugudanResults
              results={gugudanResults}
              onRetry={handleGugudanRetry}
              onHome={handleGugudanBackToSetup}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
