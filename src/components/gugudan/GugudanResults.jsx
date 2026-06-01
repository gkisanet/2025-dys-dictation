import React from 'react';
import './Gugudan.css';

function GugudanResults({ results, onRetry, onHome }) {
  const { score, total, wrongAnswers, timeSpent } = results;

  // 정답률 계산
  const scorePercent = Math.round((score / total) * 100);

  // 학습 피드백 메시지 생성 (시니어 멘토식 칭찬과 격려)
  let feedbackMessage = '';
  if (scorePercent === 100) {
    feedbackMessage = '🏆 대단해요! 구구단의 달인으로 임명합니다! 완벽합니다.';
  } else if (scorePercent >= 80) {
    feedbackMessage = '🌟 아주 훌륭한 계산 실력입니다! 조금만 더 하면 완벽해질 수 있어요.';
  } else if (scorePercent >= 50) {
    feedbackMessage = '👍 기본 연산 감각이 좋네요! 오답 노트를 복습해 볼까요?';
  } else {
    feedbackMessage = '💪 뇌가 튼튼해지는 과정입니다! 꾸준히 도전하면 반드시 해낼 수 있어요.';
  }

  // 문제당 평균 풀이 시간 계산
  const averageTime = (timeSpent / total).toFixed(1);

  return (
    <div className="gugudan-container">
      <div className="results-card">
        <h2 className="setup-title" style={{ marginBottom: '1.5rem' }}>구구단 챌린지 결과 📊</h2>
        
        {/* 원형 점수 배지 */}
        <div className="score-badge">
          <span className="score-num">{score}</span>
          <span className="score-total">/ {total} 문제</span>
        </div>

        <p className="feedback-msg">{feedbackMessage}</p>

        {/* 통계 지표 영역 */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-val">{scorePercent}%</div>
            <div className="stat-lbl">정답률</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{timeSpent}초</div>
            <div className="stat-lbl">총 소요시간 (평균 {averageTime}초/개)</div>
          </div>
        </div>

        {/* 오답 노트 섹션 */}
        <div className="incorrect-notes">
          <h3 className="notes-title">
            <span>📝 오답 분석 노트</span>
          </h3>
          {wrongAnswers.length === 0 ? (
            <div className="notes-list" style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, padding: '1.5rem' }}>
              🎉 틀린 문제가 없습니다! 완벽하게 구구단을 마스터했네요!
            </div>
          ) : (
            <div className="notes-list">
              {wrongAnswers.map((item, index) => (
                <div key={index} className="note-item">
                  <span className="note-q">{item.formula} = ?</span>
                  <span className="note-answers">
                    내가 쓴 답: <span className="note-wrong">{item.userAnswer}</span>
                    정답: <span className="note-right">{item.correctAnswer}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="result-actions">
          <button className="btn-result retry" onClick={onRetry}>
            다시 도전하기 🔄
          </button>
          <button className="btn-result home" onClick={onHome}>
            처음으로 돌아가기 🏠
          </button>
        </div>
      </div>
    </div>
  );
}

export default GugudanResults;
