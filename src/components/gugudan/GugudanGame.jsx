import React, { useState, useEffect } from 'react';
import { generateQuestions, generateMultipleChoices } from '../../utils/gugudanUtils';
import './Gugudan.css';

function GugudanGame({ levelData, onFinish, onBackToSetup }) {
  const { dans, mode, count } = levelData;

  // 1. 게임 진행 데이터 상태 정의
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(''); // 주관식 입력값
  const [selectedChoice, setSelectedChoice] = useState(null); // 객관식 선택값
  const [currentChoices, setCurrentChoices] = useState([]); // 현재 문제의 객관식 보기 캐시
  
  // 점수 및 피드백 상태
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'incorrect' | null
  const [isCorrecting, setIsCorrecting] = useState(false); // 문제 전환 딜레이용 Lock

  // 타이머 및 시간 측정
  const [gameStartTime] = useState(Date.now());

  // 2. 컴포넌트 마운트 시 문제 목록 생성
  useEffect(() => {
    const generated = generateQuestions(dans, count);
    setQuestions(generated);
    setCurrentIndex(0);
  }, [dans, count]);

  // 3. 문제 전환 시 객관식 보기 미리 생성 및 상태 리셋
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      const { a, b } = questions[currentIndex];
      // 매번 재렌더링 시 보기가 재생성되어 셔플되는 것을 막기 위한 캐싱 처리 (시니어 멘토 패턴)
      setCurrentChoices(generateMultipleChoices(a, b));
      setUserAnswer('');
      setSelectedChoice(null);
      setFeedbackState(null);
      setIsCorrecting(false);
    }
  }, [questions, currentIndex]);

  // 키보드 키패드 입력 연동 지원 (주관식 편의성)
  useEffect(() => {
    if (mode !== 'short' || isCorrecting) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyPress('delete');
      } else if (e.key === 'Escape') {
        handleKeyPress('clear');
      } else if (e.key === 'Enter') {
        handleKeyPress('submit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, mode, isCorrecting]);

  if (questions.length === 0) {
    return <div className="gugudan-container">문제를 생성하고 있습니다...</div>;
  }

  const currentQuestion = questions[currentIndex];
  const { a, b, correctAnswer } = currentQuestion;

  // ==========================================
  // 정오답 판정 및 다음 문제 전환 핸들러
  // ==========================================
  const submitAnswer = (submittedVal) => {
    if (isCorrecting) return; // 락 상태 시 중복 제출 방지
    setIsCorrecting(true);

    const isAnswerCorrect = Number(submittedVal) === correctAnswer;

    if (isAnswerCorrect) {
      setScore((prev) => prev + 1);
      setFeedbackState('correct');
    } else {
      setFeedbackState('incorrect');
      setWrongAnswers((prev) => [
        ...prev,
        {
          formula: `${a} × ${b}`,
          userAnswer: submittedVal === '' ? '미입력' : submittedVal,
          correctAnswer: correctAnswer,
        },
      ]);
    }

    // 0.8초의 피드백 노출 후 다음 문제로 전이 (사용자 인지 속도 배려)
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 게임 완료 핸들러 호출
        const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
        onFinish({
          score: isAnswerCorrect ? score + 1 : score,
          total: questions.length,
          wrongAnswers: isAnswerCorrect
            ? wrongAnswers
            : [
                ...wrongAnswers,
                {
                  formula: `${a} × ${b}`,
                  userAnswer: submittedVal === '' ? '미입력' : submittedVal,
                  correctAnswer: correctAnswer,
                },
              ].filter((v, i, self) => self.findIndex(t => t.formula === v.formula) === i), // 중복 제거 안전장치
          timeSpent,
        });
      }
    }, 850);
  };

  // 객관식 선택지 클릭 핸들러
  const handleChoiceClick = (choice) => {
    if (isCorrecting) return;
    setSelectedChoice(choice);
    submitAnswer(choice);
  };

  // 주관식 가상 키패드 버튼 터치 핸들러
  const handleKeyPress = (key) => {
    if (isCorrecting) return;

    if (key === 'clear') {
      setUserAnswer('');
    } else if (key === 'delete') {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else if (key === 'submit') {
      submitAnswer(userAnswer);
    } else {
      // 세 자릿수 이상 입력 방지 (구구단 15단 최대값은 15 * 15 = 225이므로 3자리 제한이 적절)
      if (userAnswer.length >= 3) return;
      setUserAnswer((prev) => prev + key);
    }
  };

  // 진행률 백분율 계산
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="gugudan-container">
      {/* HUD 영역 */}
      <div className="game-hud">
        <button className="gugudan-back-home" onClick={onBackToSetup}>
          ← 나가기
        </button>
        <span className="hud-item">
          문제 <strong>{currentIndex + 1}</strong> / {questions.length}
        </span>
        <span className="hud-item">
          맞힌 개수: <strong style={{ color: '#10b981' }}>{score}</strong>
        </span>
      </div>

      {/* 실시간 진행 표시 바 */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* 문제 출제 카드 */}
      <div className="question-display-card">
        <div className="math-formula">
          <span>{a}</span>
          <span className="math-op">×</span>
          <span>{b}</span>
          <span className="math-equal">=</span>
          {mode === 'choice' ? (
            <span className="math-input-placeholder">?</span>
          ) : (
            <span className="math-input-placeholder">
              {userAnswer || ''}
            </span>
          )}
        </div>
      </div>

      {/* 4지선다 객관식 뷰 포트 */}
      {mode === 'choice' && (
        <div className="choices-grid">
          {currentChoices.map((choice, idx) => {
            let btnClass = '';
            if (isCorrecting) {
              if (choice === correctAnswer) {
                btnClass = 'correct';
              } else if (selectedChoice === choice && choice !== correctAnswer) {
                btnClass = 'incorrect';
              }
            }

            return (
              <button
                key={idx}
                className={`choice-button ${btnClass}`}
                onClick={() => handleChoiceClick(choice)}
                disabled={isCorrecting}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {/* 가상 키패드 주관식 뷰 포트 */}
      {mode === 'short' && (
        <div className="answer-input-container">
          <div className="input-feedback-area">
            <span
              className={`input-feedback ${
                feedbackState === 'correct' ? 'correct' : feedbackState === 'incorrect' ? 'incorrect' : ''
              }`}
            >
              {feedbackState === 'correct' && '🎉 정답입니다!'}
              {feedbackState === 'incorrect' && `😢 아쉬워요! 정답은 ${correctAnswer}입니다.`}
            </span>
          </div>

          {/* 가상 키패드 레이아웃 */}
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                className="keypad-btn"
                onClick={() => handleKeyPress(num)}
                disabled={isCorrecting}
              >
                {num}
              </button>
            ))}
            <button
              className="keypad-btn action-btn"
              onClick={() => handleKeyPress('clear')}
              disabled={isCorrecting}
            >
              C
            </button>
            <button
              className="keypad-btn"
              onClick={() => handleKeyPress('0')}
              disabled={isCorrecting}
            >
              0
            </button>
            <button
              className="keypad-btn action-btn"
              onClick={() => handleKeyPress('delete')}
              disabled={isCorrecting}
            >
              ⌫
            </button>
            <button
              className="keypad-btn submit-btn"
              style={{ gridColumn: 'span 3' }}
              onClick={() => handleKeyPress('submit')}
              disabled={isCorrecting || userAnswer === ''}
            >
              확인 ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GugudanGame;
