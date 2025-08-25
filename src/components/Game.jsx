import React, { useState, useEffect } from 'react';
import Question from './Question';

function Game({ levelData, onFinish }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const handleNext = () => {
    const nextIndex = currentProblemIndex + 1;
    if (nextIndex < levelData.problems.length) {
      setCurrentProblemIndex(nextIndex);
    } else {
      // Game over
      onFinish(score);
    }
  };

  const currentProblem = levelData.problems[currentProblemIndex];

  return (
    <div className="game-area">
      <h2>
        {levelData.level}급: {levelData.title}
      </h2>
      <div className="progress-bar">
        문제 {currentProblemIndex + 1} / {levelData.problems.length}
      </div>
      <Question
        key={currentProblem.id} // key를 변경하여 매번 Question 컴포넌트를 리렌더링
        problem={currentProblem}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
      <div className="score-board">
        <p>
          맞은 개수: <span className="correct-score">{score.correct}</span>
        </p>
        <p>
          틀린 개수: <span className="incorrect-score">{score.incorrect}</span>
        </p>
      </div>
    </div>
  );
}

export default Game;
