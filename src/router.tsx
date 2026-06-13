import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Home } from './routes/Home';
import { Solve } from './routes/Solve';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const solveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solve/$operation',
  component: Solve,
});

const routeTree = rootRoute.addChildren([indexRoute, solveRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
