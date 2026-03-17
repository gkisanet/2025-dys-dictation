import React, { useState } from 'react';
import GradeSelector from './components/GradeSelector';
import LevelSelector from './components/LevelSelector';
import Game from './components/Game';
import Results from './components/Results';
import { gradeData } from './data/gradeData';
import './App.css';

// 앱 상태 흐름: gradeSelection → levelSelection → playing → results
const INITIAL_STATE = 'gradeSelection';

function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [gameResults, setGameResults] = useState({ correct: 0, incorrect: 0 });

  // 학년 선택 핸들러
  const handleGradeSelect = (gradeKey) => {
    setSelectedGrade(gradeKey);
    setGameState('levelSelection');
  };

  // 급수 선택 핸들러
  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setGameState('playing');
  };

  // 게임 종료 핸들러
  const handleGameFinish = (results) => {
    setGameResults(results);
    setGameState('results');
  };

  // 처음부터 다시하기 (학년 선택 화면으로 복귀)
  const handleRestart = () => {
    setGameState(INITIAL_STATE);
    setSelectedGrade(null);
    setSelectedLevel(null);
    setGameResults({ correct: 0, incorrect: 0 });
  };

  // 급수 선택 화면으로 돌아가기
  const handleBackToLevels = () => {
    setGameState('levelSelection');
    setSelectedLevel(null);
    setGameResults({ correct: 0, incorrect: 0 });
  };

  // 현재 학년의 레이블 (헤더 표시용)
  const currentGradeLabel = selectedGrade ? gradeData[selectedGrade].label : '';

  return (
    <div className="app-container">
      <h1>한글 받아쓰기 챌린지 📝</h1>

      {gameState === 'gradeSelection' && (
        <GradeSelector grades={gradeData} onSelect={handleGradeSelect} />
      )}

      {gameState === 'levelSelection' && selectedGrade && (
        <>
          <button className="back-button" onClick={handleRestart}>
            ← 학년 선택으로
          </button>
          <LevelSelector
            levels={gradeData[selectedGrade].levels}
            onSelect={handleLevelSelect}
          />
        </>
      )}

      {gameState === 'playing' && (
        <Game levelData={selectedLevel} onFinish={handleGameFinish} />
      )}

      {gameState === 'results' && (
        <Results
          results={gameResults}
          onRestart={handleRestart}
          onBackToLevels={handleBackToLevels}
        />
      )}
    </div>
  );
}

export default App;
