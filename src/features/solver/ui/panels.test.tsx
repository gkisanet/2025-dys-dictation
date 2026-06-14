import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrationPanel } from './NarrationPanel';
import { QuizPanel } from './QuizPanel';
import { Controls } from './Controls';
import type { Quiz } from '../steps/types';

const quiz: Quiz = { prompt: '8 + 4 = ?', answer: 12, hints: ['h1', 'h2'] };

describe('NarrationPanel', () => {
  it('renders the narration text', () => {
    render(<NarrationPanel text="일의 자리를 더해요" />);
    expect(screen.getByText('일의 자리를 더해요')).toBeInTheDocument();
  });
});

describe('QuizPanel', () => {
  it('submits the typed number via keypad', async () => {
    const onSubmit = vi.fn();
    render(
      <QuizPanel
        quiz={quiz}
        feedback="none"
        hint={null}
        revealedAnswer={null}
        onSubmit={onSubmit}
        narration="일의 자리를 더해요"
        canAdvance={false}
        onNext={() => {}}
      />
    );
    // Enter "12" using the on-screen numeric keypad
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onSubmit).toHaveBeenCalledWith(12);
  });

  it('shows hint on wrong and the revealed answer when given', () => {
    const { rerender } = render(
      <QuizPanel
        quiz={quiz}
        feedback="wrong"
        hint="h1"
        revealedAnswer={null}
        onSubmit={() => {}}
        narration="일의 자리를 더해요"
        canAdvance={false}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText('h1')).toBeInTheDocument();
    rerender(
      <QuizPanel
        quiz={quiz}
        feedback="wrong"
        hint="h2"
        revealedAnswer={12}
        onSubmit={() => {}}
        narration="일의 자리를 더해요"
        canAdvance={false}
        onNext={() => {}}
      />
    );
    expect(screen.getByText(/정답: 12/)).toBeInTheDocument();
  });
});

describe('Controls', () => {
  it('disables Next when cannot advance, calls onNext when enabled', async () => {
    const onNext = vi.fn();
    const { rerender } = render(<Controls canAdvance={false} isDone={false} onNext={onNext} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    rerender(<Controls canAdvance={true} isDone={false} onNext={onNext} onReset={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onNext).toHaveBeenCalled();
  });

  it('renders nothing when done (다시 풀기 is now in the completion card)', () => {
    const { container } = render(<Controls canAdvance={false} isDone={true} onNext={() => {}} onReset={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
