import React, { useState } from 'react';
import './Gugudan.css';

function GugudanSetup({ onStart, onBackHome }) {
  const [selectedDans, setSelectedDans] = useState([2, 3, 4, 5, 6, 7, 8, 9]); // 기본값은 2~9단
  const [mode, setMode] = useState('choice'); // 'choice' (객관식) 또는 'short' (주관식)
  const [questionCount, setQuestionCount] = useState(10); // 기본 10문제

  // 전체 단수 후보 (2단 ~ 15단)
  const allDans = Array.from({ length: 14 }, (_, i) => i + 2);

  // 단수 개별 토글 핸들러
  const handleDanToggle = (dan) => {
    if (selectedDans.includes(dan)) {
      // 최소 1개의 단은 남아 있어야 함
      setSelectedDans(selectedDans.filter((d) => d !== dan));
    } else {
      setSelectedDans([...selectedDans, dan].sort((a, b) => a - b));
    }
  };

  // 퀵 프리셋 설정 핸들러
  const applyPreset = (presetType) => {
    if (presetType === 'all') {
      setSelectedDans(allDans);
    } else if (presetType === 'basic') {
      setSelectedDans([2, 3, 4, 5, 6, 7, 8, 9]);
    } else if (presetType === 'advanced') {
      setSelectedDans([10, 11, 12, 13, 14, 15]);
    }
  };

  // 폼 제출(게임 시작) 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDans.length === 0) return;
    onStart({
      dans: selectedDans,
      mode: mode,
      count: questionCount,
    });
  };

  return (
    <div className="gugudan-container">
      <button className="gugudan-back-home" onClick={onBackHome}>
        ← 메인 홈으로
      </button>

      <div className="setup-card">
        <h2 className="setup-title">구구단 15단 챌린지 🧮</h2>

        <form onSubmit={handleSubmit}>
          {/* 1. 단수 선택 세션 */}
          <div className="setup-section">
            <span className="section-label">🎯 도전할 단수 선택 (중복 가능)</span>
            
            {/* 퀵 선택 프리셋 */}
            <div className="preset-buttons">
              <button
                type="button"
                className="btn-preset"
                onClick={() => applyPreset('basic')}
              >
                2 ~ 9단 (기본)
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => applyPreset('advanced')}
              >
                10 ~ 15단 (심화)
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => applyPreset('all')}
              >
                전체 선택
              </button>
            </div>

            {/* 단수 격자 스크롤뷰 */}
            <div className="dan-grid">
              {allDans.map((dan) => {
                const isChecked = selectedDans.includes(dan);
                return (
                  <div key={dan} className="dan-item">
                    <input
                      type="checkbox"
                      id={`dan-${dan}`}
                      className="dan-checkbox"
                      checked={isChecked}
                      onChange={() => handleDanToggle(dan)}
                    />
                    <label htmlFor={`dan-${dan}`} className="dan-label">
                      {dan}단
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 풀이 방식(주관식/객관식) 선택 세션 */}
          <div className="setup-section">
            <span className="section-label">🧩 풀이 방식</span>
            <div className="mode-selector">
              <div className="mode-option">
                <input
                  type="radio"
                  id="mode-choice"
                  name="gugudan-mode"
                  className="mode-radio"
                  value="choice"
                  checked={mode === 'choice'}
                  onChange={() => setMode('choice')}
                />
                <div className="mode-box">
                  <span className="mode-icon">🔘</span>
                  <span className="mode-name">객관식 4지선다</span>
                  <span className="mode-desc">매력적인 오답 중에서 정답을 골라요.</span>
                </div>
              </div>

              <div className="mode-option">
                <input
                  type="radio"
                  id="mode-short"
                  name="gugudan-mode"
                  className="mode-radio"
                  value="short"
                  checked={mode === 'short'}
                  onChange={() => setMode('short')}
                />
                <div className="mode-box">
                  <span className="mode-icon">⌨️</span>
                  <span className="mode-name">주관식 직접 입력</span>
                  <span className="mode-desc">답을 가상 키패드로 직접 입력해요.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 문항 수 선택 세션 */}
          <div className="setup-section">
            <span className="section-label">📝 문제 수</span>
            <div className="count-selector">
              {[10, 20, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`count-btn ${questionCount === num ? 'active' : ''}`}
                  onClick={() => setQuestionCount(num)}
                >
                  {num}문제
                </button>
              ))}
            </div>
          </div>

          {/* 시작 버튼 */}
          <button
            type="submit"
            className="btn-start-game"
            disabled={selectedDans.length === 0}
          >
            챌린지 시작하기 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

export default GugudanSetup;
