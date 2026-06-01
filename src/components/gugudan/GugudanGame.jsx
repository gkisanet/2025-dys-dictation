import React, { useState, useEffect, useRef } from 'react';
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
  
  // 누적 상태값 추적
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'incorrect' | null
  const [isCorrecting, setIsCorrecting] = useState(false); // 문제 전환 딜레이용 Lock

  // 타이머 및 시간 측정
  const [gameStartTime] = useState(Date.now());
  const inputRef = useRef(null);

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

      // 주관식일 경우 자동으로 인풋 필드에 포커싱
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [questions, currentIndex]);

  if (questions.length === 0) {
    return <div className="gugudan-container">문제를 생성하고 있습니다...</div>;
  }

  const currentQuestion = questions[currentIndex];
  const { a, b, correctAnswer } = currentQuestion;

  // ==========================================
  // 정오답 판정 및 다음 문제 전환 핸들러 (React 비동기 상태 레이스 프리 설계)
  // ==========================================
  const submitAnswer = (submittedVal) => {
    if (isCorrecting) return; // 중복 제출 방지 락
    setIsCorrecting(true);

    const isAnswerCorrect = Number(submittedVal) === correctAnswer;
    
    // 비동기 갱신 지연을 우회하기 위해 로컬 변수로 즉시 누적값 계산 (시니어 아키텍트 패턴)
    const nextScore = isAnswerCorrect ? score + 1 : score;
    let nextWrongAnswers = [...wrongAnswers];

    if (isAnswerCorrect) {
      setScore(nextScore);
      setFeedbackState('correct');
    } else {
      setFeedbackState('incorrect');
      const newWrongItem = {
        formula: `${a} × ${b}`,
        userAnswer: submittedVal === '' ? '미입력' : submittedVal,
        correctAnswer: correctAnswer,
      };
      nextWrongAnswers.push(newWrongItem);
      setWrongAnswers(nextWrongAnswers);
    }

    // 0.85초의 피드백 노출 후 다음 문제로 전이
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 게임 완료 핸들러 호출 - 최신 스냅샷 로컬 변수(nextScore, nextWrongAnswers) 전달로 정합성 100% 보장
        const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
        onFinish({
          score: nextScore,
          total: questions.length,
          wrongAnswers: nextWrongAnswers,
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
      if (inputRef.current) inputRef.current.focus();
    } else if (key === 'delete') {
      setUserAnswer((prev) => prev.slice(0, -1));
      if (inputRef.current) inputRef.current.focus();
    } else if (key === 'submit') {
      if (userAnswer !== '') {
        submitAnswer(userAnswer);
      }
    } else {
      // 세 자릿수 이상 입력 방지
      if (userAnswer.length >= 3) return;
      setUserAnswer((prev) => prev + key);
      if (inputRef.current) inputRef.current.focus();
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
            <input
              ref={inputRef}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              className="manual-input"
              value={userAnswer}
              onChange={(e) => {
                // 숫자 이외의 문자 필터링 및 최대 3자리 제한
                const filtered = e.target.value.replace(/[^0-9]/g, '');
                if (filtered.length <= 3) {
                  setUserAnswer(filtered);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userAnswer !== '') {
                  submitAnswer(userAnswer);
                }
              }}
              placeholder="?"
              disabled={isCorrecting}
              autoFocus
            />
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
                type="button"
                key={num}
                className="keypad-btn"
                onClick={() => handleKeyPress(num)}
                disabled={isCorrecting}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="keypad-btn action-btn"
              onClick={() => handleKeyPress('clear')}
              disabled={isCorrecting}
            >
              C
            </button>
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeyPress('0')}
              disabled={isCorrecting}
            >
              0
            </button>
            <button
              type="button"
              className="keypad-btn action-btn"
              onClick={() => handleKeyPress('delete')}
              disabled={isCorrecting}
            >
              ⌫
            </button>
            <button
              type="button"
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
