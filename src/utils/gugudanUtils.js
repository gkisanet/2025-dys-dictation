/**
 * 구구단 풀이 앱용 비즈니스 로직 및 수학적 오답 생성 알고리즘 유틸리티
 */

/**
 * 정답 A * B = C 에 대해 학습자가 헷갈리기 쉬운 오답(Distractors)을 수학적으로 생성합니다.
 * 시니어 멘토 노트: 단순 무작위 난수가 아닌 학습자의 인지적 오개념 유형(인접 곱, 연산자 혼동, 자릿수 전치)을 모델링합니다.
 * 
 * @param {number} a 피승수 (단수)
 * @param {number} b 승수
 * @returns {number[]} 정답을 포함하여 무작위로 섞인 4개의 고유 선택지 배열
 */
export function generateMultipleChoices(a, b) {
  const correctAnswer = a * b;
  const candidates = new Set();

  // 1. 인접 곱셈 오류 (Multiplication Adjacency Error)
  // 구구단을 외우다 앞뒤 단계를 혼동하는 현상 반영
  candidates.add((a - 1) * b);
  candidates.add((a + 1) * b);
  candidates.add(a * (b - 1));
  candidates.add(a * (b + 1));
  candidates.add((a - 1) * (b - 1));
  candidates.add((a + 1) * (b + 1));

  // 2. 사칙 연산 혼동 오류 (Operator Confusion)
  // 곱하기와 더하기를 헷갈리거나 순간적으로 잘못 암산하는 현상 반영
  candidates.add(a + b);
  candidates.add(correctAnswer - a);
  candidates.add(correctAnswer + a);
  candidates.add(correctAnswer - b);
  candidates.add(correctAnswer + b);

  // 3. 자릿수 역전 오류 (Digit Transposition Error)
  // 두 자릿수일 때 두 숫자가 다르고, 일의 자리가 0이 아니면 앞뒤 자리를 바꿈 (예: 54 -> 45)
  if (correctAnswer >= 10 && correctAnswer < 100) {
    const tens = Math.floor(correctAnswer / 10);
    const ones = correctAnswer % 10;
    if (tens !== ones && ones !== 0) {
      candidates.add(ones * 10 + tens);
    }
  }

  // 4. 산술 인접 오류 (Arithmetic Proximity)
  // 미세한 덧셈/뺄셈 연산 실수
  candidates.add(correctAnswer - 1);
  candidates.add(correctAnswer + 1);
  candidates.add(correctAnswer - 2);
  candidates.add(correctAnswer + 2);
  if (correctAnswer > 10) {
    candidates.add(correctAnswer - 10);
    candidates.add(correctAnswer + 10);
  }

  // 필터링: 양의 정수이면서 정답과 같지 않은 후보군만 정제
  const filteredCandidates = Array.from(candidates).filter(
    (val) => val > 0 && val !== correctAnswer && !isNaN(val)
  );

  // 오답 후보 셔플
  const shuffledCandidates = shuffleArray([...filteredCandidates]);

  // 최종 오답 3개 추출
  const distractors = shuffledCandidates.slice(0, 3);

  // 만약 후보군이 부족할 경우(예: 2 * 1 = 2 처럼 너무 작은 연산일 때) 보정
  while (distractors.length < 3) {
    let offset = distractors.length + 1;
    let fallback = correctAnswer + offset;
    if (!distractors.includes(fallback) && fallback !== correctAnswer) {
      distractors.push(fallback);
    } else {
      distractors.push(correctAnswer + offset + 5);
    }
  }

  // 정답을 포함한 4지선다 보기 배열 구성
  const finalChoices = [correctAnswer, ...distractors];

  // 전체 배열을 셔플하여 정답의 위치가 무작위가 되도록 처리
  return shuffleArray(finalChoices);
}

/**
 * 피셔-예이츠(Fisher-Yates) 알고리즘을 사용한 배열 무작위 셔플
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 선택된 단들과 문제 수에 맞추어 무작위 구구단 문제 세트를 생성합니다.
 * 
 * @param {number[]} selectedDans 선택된 단 목록 (예: [2, 3, 7])
 * @param {number} count 생성할 문제 수
 * @returns {Array<{id: number, a: number, b: number, correctAnswer: number}>} 문제 목록
 */
export function generateQuestions(selectedDans, count) {
  if (!selectedDans || selectedDans.length === 0) return [];
  
  const pool = [];
  
  // 선택된 각 단에 대해 1부터 15까지의 승수를 곱하는 전체 문제 풀(Pool) 생성
  // 시니어 멘토 아키텍처 노하우: 전체 조합을 생성한 뒤 무작위로 추출하여 중복 방지
  selectedDans.forEach((dan) => {
    for (let b = 1; b <= 15; b++) {
      pool.push({
        a: dan,
        b: b,
        correctAnswer: dan * b
      });
    }
  });

  // 전체 풀 셔플
  const shuffledPool = shuffleArray(pool);

  // 요청된 문제 수만큼 추출하여 고유 ID 부여
  return shuffledPool.slice(0, count).map((item, index) => ({
    id: index + 1,
    ...item
  }));
}
