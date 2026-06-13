import type { Operation, Verbosity } from '@/features/solver/steps/types';
import type { Pattern } from '@/features/problems/generateProblem';

export interface Stage {
  id: string;       // unique, URL-safe
  operation: Operation;
  pattern: Pattern;
  verbosity: Verbosity;
  title: string;
  subtitle: string;
}

export const STAGES: Stage[] = [
  // 덧셈
  { id: 'add-1', operation: 'add', pattern: 'add-nocarry', verbosity: 'full',    title: '받아올림 없는 덧셈',   subtitle: '두 자리 · 모든 단계' },
  { id: 'add-2', operation: 'add', pattern: 'add-carry',   verbosity: 'full',    title: '받아올림 덧셈',       subtitle: '두 자리 · 모든 단계' },
  { id: 'add-3', operation: 'add', pattern: 'add-carry',   verbosity: 'partial', title: '받아올림 덧셈 (부분)', subtitle: '핵심만 질문' },
  { id: 'add-4', operation: 'add', pattern: 'add-3digit',  verbosity: 'full',    title: '세 자리 덧셈',        subtitle: '세 자리 · 모든 단계' },
  { id: 'add-5', operation: 'add', pattern: 'add-carry',   verbosity: 'answer',  title: '덧셈 암산',           subtitle: '답만 입력' },
  // 뺄셈
  { id: 'sub-1', operation: 'sub', pattern: 'sub-noborrow', verbosity: 'full',    title: '받아내림 없는 뺄셈', subtitle: '두 자리 · 모든 단계' },
  { id: 'sub-2', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'full',    title: '받아내림 뺄셈',     subtitle: '두 자리 · 모든 단계' },
  { id: 'sub-3', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'partial', title: '받아내림 뺄셈 (부분)', subtitle: '핵심만 질문' },
  { id: 'sub-4', operation: 'sub', pattern: 'sub-3digit',   verbosity: 'full',    title: '세 자리 뺄셈',       subtitle: '세 자리 · 모든 단계' },
  { id: 'sub-5', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'answer',  title: '뺄셈 암산',          subtitle: '답만 입력' },
  // 곱셈
  { id: 'mul-1', operation: 'mul', pattern: 'mul-2x1',   verbosity: 'full',    title: '두 자리 × 한 자리',    subtitle: '자릿수별로 풀기 · 모든 단계' },
  { id: 'mul-2', operation: 'mul', pattern: 'mul-byten', verbosity: 'full',    title: '몇십 곱하기',          subtitle: '× 20·30·40 · 자리수 0' },
  { id: 'mul-3', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'full',    title: '두 자리 곱셈',         subtitle: '분배해서 풀기 · 모든 단계' },
  { id: 'mul-4', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'partial', title: '두 자리 곱셈 (부분)',  subtitle: '핵심만 질문' },
  { id: 'mul-5', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'answer',  title: '곱셈 암산',            subtitle: '답만 입력' },
];

export const stagesFor = (op: Operation): Stage[] => STAGES.filter((s) => s.operation === op);
export const getStage = (id: string): Stage | undefined => STAGES.find((s) => s.id === id);
