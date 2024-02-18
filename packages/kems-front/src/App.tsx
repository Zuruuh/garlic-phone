import './App.css';
import { lazy, type Component } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { persistQueryClient } from '@tanstack/solid-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
});

const localStoragePersister = createSyncStoragePersister({
  storage: localStorage,
});

persistQueryClient({ queryClient, persister: localStoragePersister });

const HomePage = lazy(() => import('./pages/HomePage'));
const JoinRoomPage = lazy(() => import('./pages/JoinRoomPage'));

const App: Component = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={HomePage} />
        <Route path="/join-room" component={JoinRoomPage} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
