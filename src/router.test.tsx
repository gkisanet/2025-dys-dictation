import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { router } from './router';

function renderAt(path: string) {
  const testRouter = createRouter({
    routeTree: router.routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  // `as never` works around TanStack Router's registered-router narrowing in tests; runtime behavior is identical.
  render(<RouterProvider router={testRouter as never} />);
}

describe('router', () => {
  it('renders Home at /', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: '암산 학습' })).toBeInTheDocument();
  });

  it('renders Solve with the operation param', async () => {
    renderAt('/solve/add');
    expect(await screen.findByRole('heading', { name: '덧셈' })).toBeInTheDocument();
  });
});
