import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';

function renderAt(path: string) {
  const testRouter = createRouter({
    routeTree: router.routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // `as never` works around TanStack Router's registered-router narrowing in tests; runtime behavior is identical.
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={testRouter as never} />
    </QueryClientProvider>,
  );
}

describe('router', () => {
  it('renders Home at /', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: '암산 학습' })).toBeInTheDocument();
  });

  it('renders Solve stage with the operation and stageId params', async () => {
    renderAt('/solve/add/add-1');
    expect(await screen.findByRole('heading', { name: '받아올림 없는 덧셈' })).toBeInTheDocument();
  });

  it('renders Progress page at /progress', async () => {
    renderAt('/progress');
    expect(await screen.findByRole('heading', { name: '학습 진도' })).toBeInTheDocument();
  });
});
