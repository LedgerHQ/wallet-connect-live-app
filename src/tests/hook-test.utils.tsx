import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, createStore } from "jotai";
import { Suspense, type ReactNode } from "react";

export type TestStore = ReturnType<typeof createStore>;

export function createHookWrapper(store: TestStore) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <Suspense fallback={null}>{children}</Suspense>
        </Provider>
      </QueryClientProvider>
    );
  };
}
