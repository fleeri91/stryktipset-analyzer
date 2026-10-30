import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
  type DehydratedState,
  type QueryKey,
} from "@tanstack/react-query";

type HydratedQuery = {
  queryKey: QueryKey;
  data: unknown;
};

type HydrationOptions = {
  // Same tags as the cached data reads, so data and timestamp invalidate together
  tags: string[];
};

async function getHydrationUpdatedAt(tags: string[]) {
  "use cache";
  cacheTag(...tags);
  cacheLife("max");
  return Date.now();
}

/**
 * Prerenderable replacement for TanStack Query's `dehydrate()`, which reads
 * `Date.now()` and fails prerendering with Cache Components enabled.
 */
export async function dehydrate(
  queries: HydratedQuery[],
  options: HydrationOptions,
): Promise<DehydratedState> {
  const updatedAt = await getHydrationUpdatedAt(options.tags);

  const queryClient = new QueryClient();

  for (const query of queries) {
    queryClient.setQueryData(query.queryKey, query.data, { updatedAt });
  }

  return {
    mutations: [],
    queries: queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => defaultShouldDehydrateQuery(query))
      .map((query) => ({
        dehydratedAt: updatedAt,
        queryHash: query.queryHash,
        queryKey: query.queryKey,
        state: query.state,
        ...(query.meta ? { meta: query.meta } : {}),
      })),
  };
}
