import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Home } from './routes/Home';
import { LearnStages } from './routes/LearnStages';
import { Solve } from './routes/Solve';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn/$operation',
  component: LearnStages,
});

const solveStageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solve/$operation/$stageId',
  component: Solve,
});

const routeTree = rootRoute.addChildren([indexRoute, learnRoute, solveStageRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
