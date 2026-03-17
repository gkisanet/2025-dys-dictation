import React from 'react';

// 학년별 데이터 유무에 따라 카드 활성/비활성 처리
function GradeSelector({ grades, onSelect }) {
  return (
    <div className="grade-selector">
      <h2>학년을 선택하세요! 🎒</h2>
      <div className="grade-grid">
        {Object.entries(grades).map(([gradeKey, gradeInfo]) => {
          // 데이터가 없으면 비활성화
          const isDisabled = !gradeInfo.levels || gradeInfo.levels.length === 0;

          return (
            <button
              key={gradeKey}
              className={`grade-card ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && onSelect(gradeKey)}
              disabled={isDisabled}
            >
              <span className="grade-emoji">{gradeInfo.emoji}</span>
              <strong className="grade-label">{gradeInfo.label}</strong>
              <span className="grade-desc">
                {isDisabled ? '준비 중이에요 🚧' : gradeInfo.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GradeSelector;
