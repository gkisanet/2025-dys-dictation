import React from 'react';

function LevelSelector({ levels, onSelect }) {
  return (
    <div className="level-selector">
      <h2>도전할 급수를 선택하세요!</h2>
      <div className="level-grid">
        {levels.map((level) => (
          <button
            key={level.level}
            onClick={() => onSelect(level)}
            className="level-button"
          >
            <strong>{level.level}급</strong>
            <span>{level.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LevelSelector;
