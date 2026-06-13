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

describe('SolveSession (18 × 24) multiplication', () => {
  it('walks to left-ask, submits wrong then 72, continues to sum-ask, submits 432, sees result and restart', async () => {
    renderWithQuery(<SolveSession problem={{ operation: 'mul', operands: [18, 24] }} />);

    // setup step: narration shown, no quiz, can advance
    expect(screen.getByText(/세로로/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // decompose step: quiz for 24 = 20 + ?
    expect(screen.getByText('24 = 20 + ?')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('spinbutton'), '4');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-ask: 18 × 4 = ?
    expect(screen.getByText('18 × 4 = ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // submit wrong answer first
    await userEvent.type(screen.getByRole('spinbutton'), '70');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/힌트:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    // submit correct answer 72
    await userEvent.clear(screen.getByRole('spinbutton'));
    await userEvent.type(screen.getByRole('spinbutton'), '72');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // left-write: no quiz, advance through it
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-zero: no quiz, advance
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-ask: 18 × 2 = ?
    expect(screen.getByText('18 × 2 = ?')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('spinbutton'), '36');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // right-write: no quiz
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // gather: no quiz
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // sum-ask: 72 + 360 = ? (appears in quiz prompt)
    expect(screen.getAllByText('72 + 360 = ?').length).toBeGreaterThanOrEqual(1);
    await userEvent.type(screen.getByRole('spinbutton'), '432');
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
    for (let i = 0; i < 20; i++) {
      const isDone = screen.queryByRole('button', { name: '다시 풀기' });
      if (isDone) break;

      const spinbutton = screen.queryByRole('spinbutton');
      if (spinbutton) {
        quizCount++;
        // Find the correct answer from the prompt and submit
        const promptEl = screen.getByRole('spinbutton');
        await userEvent.clear(promptEl);
        await userEvent.type(promptEl, '12'); // won't always be right; just advance
        await userEvent.click(screen.getByRole('button', { name: '확인' }));
        // If wrong, reveal answer and continue
        if (screen.queryByRole('button', { name: '다음' }) && !screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')) {
          await userEvent.click(screen.getByRole('button', { name: '다음' }));
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

    // Submit correct answer
    await userEvent.type(screen.getByRole('spinbutton'), '42');
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

    await userEvent.type(screen.getByRole('spinbutton'), '7');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/힌트:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    await userEvent.clear(screen.getByRole('spinbutton'));
    await userEvent.type(screen.getByRole('spinbutton'), '12');
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

    // Step 2 (final-ask): submit correct answer 42
    await userEvent.type(screen.getByRole('spinbutton'), '42');
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
    await userEvent.type(screen.getByRole('spinbutton'), '42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalledTimes(1));

    // Reset → second run
    await userEvent.click(screen.getByRole('button', { name: '다시 풀기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await userEvent.type(screen.getByRole('spinbutton'), '42');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalledTimes(2));

    vi.restoreAllMocks();
    _resetProgressStore();
  });
});
