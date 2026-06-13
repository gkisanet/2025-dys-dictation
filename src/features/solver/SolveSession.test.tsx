import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolveSession } from './SolveSession';

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
