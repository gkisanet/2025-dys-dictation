import React, { useState } from 'react';
import LevelSelector from './components/LevelSelector';
import Game from './components/Game';
import Results from './components/Results';
import { dictationLevels } from './data/dictationData';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('levelSelection'); // levelSelection, playing, results
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [gameResults, setGameResults] = useState({ correct: 0, incorrect: 0 });

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setGameState('playing');
  };

  const handleGameFinish = (results) => {
    setGameResults(results);
    setGameState('results');
  };

  const handleRestart = () => {
    setGameState('levelSelection');
    setSelectedLevel(null);
    setGameResults({ correct: 0, incorrect: 0 });
  };

  return (
    <div className="app-container">
      <h1>한글 받아쓰기 챌린지 📝</h1>
      {gameState === 'levelSelection' && (
        <LevelSelector levels={dictationLevels} onSelect={handleLevelSelect} />
      )}
      {gameState === 'playing' && (
        <Game levelData={selectedLevel} onFinish={handleGameFinish} />
      )}
      {gameState === 'results' && (
        <Results results={gameResults} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;
