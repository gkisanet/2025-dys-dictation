import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { Home } from './routes/Home';
import { LearnStages } from './routes/LearnStages';
import { Solve } from './routes/Solve';
import { Progress } from './routes/Progress';

const rootRoute = createRootRoute({ component: AppShell });

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

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: Progress,
});

const routeTree = rootRoute.addChildren([indexRoute, learnRoute, solveStageRoute, progressRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
