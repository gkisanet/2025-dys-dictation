import { describe, it, expect } from 'vitest';
import { STAGES, stagesFor, getStage } from './curriculum';

describe('curriculum — STAGES', () => {
  it('every stage id is unique', () => {
    const ids = STAGES.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every stage id is URL-safe (alphanumeric + hyphens only)', () => {
    for (const s of STAGES) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('every stage has non-empty title and subtitle', () => {
    for (const s of STAGES) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('every stage pattern prefix matches its operation', () => {
    for (const s of STAGES) {
      expect(s.pattern.startsWith(s.operation)).toBe(true);
    }
  });
});

describe('stagesFor', () => {
  it('returns the 5 mul stages in order', () => {
    const mulStages = stagesFor('mul');
    expect(mulStages.length).toBe(5);
    expect(mulStages.map((s) => s.id)).toEqual(['mul-1', 'mul-2', 'mul-3', 'mul-4', 'mul-5']);
  });

  it('returns 5 add stages', () => {
    const addStages = stagesFor('add');
    expect(addStages.length).toBe(5);
    expect(addStages.every((s) => s.operation === 'add')).toBe(true);
  });

  it('returns 5 sub stages', () => {
    const subStages = stagesFor('sub');
    expect(subStages.length).toBe(5);
    expect(subStages.every((s) => s.operation === 'sub')).toBe(true);
  });
});

describe('getStage', () => {
  it('getStage("add-3")?.verbosity === "partial"', () => {
    expect(getStage('add-3')?.verbosity).toBe('partial');
  });

  it('getStage("mul-1")?.pattern === "mul-2x1"', () => {
    expect(getStage('mul-1')?.pattern).toBe('mul-2x1');
  });

  it('getStage("sub-5")?.verbosity === "answer"', () => {
    expect(getStage('sub-5')?.verbosity).toBe('answer');
  });

  it('getStage with unknown id returns undefined', () => {
    expect(getStage('not-a-stage')).toBeUndefined();
  });
});
