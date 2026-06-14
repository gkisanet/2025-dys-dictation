import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolveSession } from './SolveSession';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

/** Click each digit in a number string on the on-screen keypad. */
async function enterDigits(digits: string) {
  for (const d of digits) {
    await userEvent.click(screen.getByRole('button', { name: d }));
  }
}

describe('SolveSession (18 × 24) multiplication', () => {
  it('walks digit-by-digit through both branches, submits sum-ask 432, sees result', async () => {
    renderWithQuery(<SolveSession problem={{ operation: 'mul', operands: [18, 24] }} />);

    // setup step: narration shown, no quiz, can advance
    expect(screen.getByText(/세로로/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // decompose step: quiz for 24 = 20 + ?
    expect(screen.getByText('24 = 20 + ?')).toBeInTheDocument();
    await enterDigits('4');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // branches step: both branch setups visible, no quiz, advance
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-ones-ask: 8 × 4 = ? → answer 32
    expect(screen.getByText('8 × 4 = ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // submit wrong answer first
    await enterDigits('30');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/힌트:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // submit correct answer 32
    await enterDigits('32');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-ones-write: no quiz, advance
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-tens-ask: 1 × 4 + 3 = ? → answer 7
    expect(screen.getByText('1 × 4 + 3 = ?')).toBeInTheDocument();
    await enterDigits('7');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-tens-write: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-zero: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-ones-ask: 8 × 2 = ? → answer 16
    expect(screen.getByText('8 × 2 = ?')).toBeInTheDocument();
    await enterDigits('16');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-ones-write: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-tens-ask: 1 × 2 + 1 = ? → answer 3
    expect(screen.getByText('1 × 2 + 1 = ?')).toBeInTheDocument();
    await enterDigits('3');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-tens-write: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // gather: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // sum-ask: 72 + 360 = ?
    expect(screen.getAllByText('72 + 360 = ?').length).toBeGreaterThanOrEqual(1);
    await enterDigits('432');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // result step: shows 432 and the restart button
    expect(screen.getByText(/432/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 풀기' })).toBeInTheDocument();
  });
});

describe('SolveSession — verbosity: partial (18 + 24)', () => {
  it('shows exactly one quiz across the full run', async () => {
    renderWithQuery(<SolveSession problem={{ operation: 'add', operands: [18, 24] }} verbosity="partial" />);

    // Count quiz appearances by advancing through all steps
    let quizCount = 0;

    // Step 1 (setup): no quiz
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Advance through all remaining steps, counting quizzes encountered
    // (A quiz panel is present when the answer display div with aria-label="답" is shown)
    for (let i = 0; i < 20; i++) {
      const isDone = screen.queryByRole('button', { name: '다시 풀기' });
      if (isDone) break;

      const answerDisplay = screen.queryByLabelText('답');
      if (answerDisplay) {
        quizCount++;
        // Submit any answer to advance (12 won't always be right; we just want to move forward)
        await enterDigits('12');
        await userEvent.click(screen.getByRole('button', { name: '확인' }));
        // If next button is now enabled, proceed
        const nextBtn = screen.queryByRole('button', { name: '다음' });
        if (nextBtn && !nextBtn.hasAttribute('disabled')) {
          await userEvent.click(nextBtn);
        }
      } else {
        const nextBtn = screen.queryByRole('button', { name: '다음' });
        if (nextBtn && !nextBtn.hasAttribute('disabled')) {
          await userEvent.click(nextBtn);
        } else {
          break;
        }
      }
    }

    expect(quizCount).toBe(1);
  });
});

describe('SolveSession — verbosity: answer (18 + 24)', () => {
  it('shows setup, then a single "18 + 24 = ?" quiz, then result', async () => {
    renderWithQuery(<SolveSession problem={{ operation: 'add', operands: [18, 24] }} verbosity="answer" />);

    // Step 1 (setup): narration visible, no quiz
    expect(screen.getByText(/세로로 써요/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Step 2 (final-ask): the combined quiz "18 + 24 = ?"
    expect(screen.getByText('18 + 24 = ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // Submit correct answer via keypad
    await enterDigits('42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Step 3 (result): shows 42 and restart button
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 풀기' })).toBeInTheDocument();
  });
});

describe('SolveSession (18 + 24)', () => {
  it('walks setup -> ones quiz (blocks) -> correct -> reveals result', async () => {
    renderWithQuery(<SolveSession problem={{ operation: 'add', operands: [18, 24] }} />);

    // Setup step: narration shown, no quiz, can advance.
    expect(screen.getByText(/세로로 써요/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Ones ask: quiz appears, Next disabled until answered.
    expect(screen.getByText('8 + 4 = ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // Submit wrong answer 7
    await enterDigits('7');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/힌트:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // Submit correct answer 12 (entry auto-cleared after previous submit)
    await enterDigits('12');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    // Write step reveals the result digit 2 (data-role result).
    expect(screen.getByText('2', { selector: '[data-role="result"]' })).toBeInTheDocument();
  });
});

describe('SolveSession — records attempt on completion', () => {
  it('records exactly one attempt when a run completes, with correct score', async () => {
    const { createMemoryStore } = await import('@/features/progress/memoryStore');
    const { _resetProgressStore } = await import('@/features/progress/store');
    const storeModule = await import('@/features/progress/store');

    // Swap the singleton to a fresh memory store for this test
    _resetProgressStore();
    const testStore = createMemoryStore();
    // Spy on recordAttempt so we can verify it was called
    const recordSpy = vi.spyOn(testStore, 'recordAttempt');

    // Override getProgressStore to return our testStore
    vi.spyOn(storeModule, 'getProgressStore').mockReturnValue(testStore);

    renderWithQuery(
      <SolveSession
        problem={{ operation: 'add', operands: [18, 24] }}
        verbosity="answer"
        stageId="add-5"
      />,
    );

    // Step 1 (setup): advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Step 2 (final-ask): submit correct answer 42 via keypad
    await enterDigits('42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Run is done
    expect(screen.getByRole('button', { name: '다시 풀기' })).toBeInTheDocument();

    // Wait for mutation to fire
    await waitFor(() => expect(recordSpy).toHaveBeenCalledTimes(1));

    const [attempt] = recordSpy.mock.calls[0];
    expect(attempt.stageId).toBe('add-5');
    expect(attempt.operation).toBe('add');
    expect(attempt.quizTotal).toBeGreaterThan(0);

    vi.restoreAllMocks();
    _resetProgressStore();
  });

  it('records a fresh attempt after reset, not double-recording the first run', async () => {
    const { createMemoryStore } = await import('@/features/progress/memoryStore');
    const { _resetProgressStore } = await import('@/features/progress/store');
    const storeModule = await import('@/features/progress/store');

    _resetProgressStore();
    const testStore = createMemoryStore();
    const recordSpy = vi.spyOn(testStore, 'recordAttempt');
    vi.spyOn(storeModule, 'getProgressStore').mockReturnValue(testStore);

    renderWithQuery(
      <SolveSession
        problem={{ operation: 'add', operands: [18, 24] }}
        verbosity="answer"
        stageId="add-5"
      />,
    );

    // First run: setup → answer → done
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await enterDigits('42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalledTimes(1));

    // Reset → second run
    await userEvent.click(screen.getByRole('button', { name: '다시 풀기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await enterDigits('42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalledTimes(2));

    vi.restoreAllMocks();
    _resetProgressStore();
  });
});
