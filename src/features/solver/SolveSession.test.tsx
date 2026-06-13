import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolveSession } from './SolveSession';

describe('SolveSession (18 × 24) multiplication', () => {
  it('walks to left-ask, submits wrong then 72, continues to sum-ask, submits 432, sees result and restart', async () => {
    render(<SolveSession problem={{ operation: 'mul', operands: [18, 24] }} />);

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

describe('SolveSession (18 + 24)', () => {
  it('walks setup -> ones quiz (blocks) -> correct -> reveals result', async () => {
    render(<SolveSession problem={{ operation: 'add', operands: [18, 24] }} />);

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
