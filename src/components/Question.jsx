import React, { useState, useMemo, useEffect } from 'react';

function Question({ problem, onAnswer, onNext }) {
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // 선택지를 랜덤하게 섞어줌
  const options = useMemo(
    () => [problem.correct, problem.incorrect].sort(() => Math.random() - 0.5),
    [problem]
  );

  // TTS 기능
  const speak = (text) => {
    // Web Speech API 지원 확인
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR'; // 한국어 설정
      utterance.rate = 0.9; // 약간 느리게
      window.speechSynthesis.speak(utterance);
    } else {
      alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
    }
  };

  // 컴포넌트가 로드될 때 자동으로 문제를 읽어줌
  useEffect(() => {
    speak(problem.correct);
  }, [problem]);

  const handleSelect = (option) => {
    if (isAnswered) return; // 이미 답을 선택했다면 다시 선택 불가

    const isCorrect = option === problem.correct;
    setSelected(option);
    setIsAnswered(true);
    onAnswer(isCorrect);
  };

  const getButtonClass = (option) => {
    if (!isAnswered) return 'option-button';
    if (option === problem.correct) return 'option-button correct';
    if (option === selected && option !== problem.correct)
      return 'option-button incorrect';
    return 'option-button';
  };

  return (
    <div className="question-container">
      <button onClick={() => speak(problem.correct)} className="tts-button">
        ▶️ 다시 듣기
      </button>
      <div className="options">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            className={getButtonClass(option)}
            disabled={isAnswered}
          >
            {option}
          </button>
        ))}
      </div>
      {isAnswered && (
        <button onClick={onNext} className="next-button">
          다음 문제
        </button>
      )}
    </div>
  );
}

export default Question;
