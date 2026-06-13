import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '../router';

function renderAt(path: string) {
  const testRouter = createRouter({
    routeTree: router.routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={testRouter as never} />
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  it('renders the header brand text "암산 학습"', async () => {
    renderAt('/');
    // The brand link in the header (there may be multiple "암산 학습" on the home page)
    const headings = await screen.findAllByText('암산 학습');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the bottom navigation with 홈 and 진도 links', async () => {
    renderAt('/');
    await screen.findAllByText('암산 학습');
    expect(screen.getAllByText('홈').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('진도')).toBeInTheDocument();
  });
});
