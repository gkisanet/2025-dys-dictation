import { dictationLevels } from './dictationData';
import { dictationLevels2 } from './dictationData2';

// 학년별 데이터를 통합 관리하는 객체
// 새 학년 추가 시 여기에 항목만 추가하면 자동으로 UI에 반영됨
export const gradeData = {
  grade1: {
    label: '1학년',
    emoji: '🌱',
    description: '기초 받아쓰기',
    levels: dictationLevels,
  },
  grade2: {
    label: '2학년',
    emoji: '🌳',
    description: '심화 받아쓰기',
    levels: dictationLevels2,
  },
};
