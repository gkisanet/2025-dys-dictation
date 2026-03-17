import React from 'react';

function Results({ results, onRestart, onBackToLevels }) {
  return (
    <div className="results-container">
      <h2>🎉 게임 결과 🎉</h2>
      <div className="final-score">
        <p>
          <strong>맞은 개수:</strong> {results.correct}개
        </p>
        <p>
          <strong>틀린 개수:</strong> {results.incorrect}개
        </p>
      </div>
      <div className="results-buttons">
        {onBackToLevels && (
          <button onClick={onBackToLevels} className="restart-button secondary">
            다른 급수 도전하기
          </button>
        )}
        <button onClick={onRestart} className="restart-button">
          처음부터 다시하기
        </button>
      </div>
    </div>
  );
}

export default Results;
