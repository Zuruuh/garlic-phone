import './App.css';
import { Suspense, lazy, type Component } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { persistQueryClient } from '@tanstack/solid-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
});

const localStoragePersister = createSyncStoragePersister({
  storage: localStorage,
});

const QueryDevtools = lazy(() =>
  process.env.NODE_ENV === 'development'
    ? import('@tanstack/solid-query-devtools').then((e) => ({
        default: e.SolidQueryDevtools,
      }))
    : Promise.resolve({ default: () => <></> }),
);

persistQueryClient({ queryClient, persister: localStoragePersister });

const HomePage = lazy(() => import('./pages/HomePage'));
const JoinRoomPage = lazy(() => import('./pages/JoinRoomPage'));

const App: Component = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <QueryDevtools />
      </Suspense>
      <Router>
        <Route path="/" component={HomePage} />
        <Route path="/join-room" component={JoinRoomPage} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
