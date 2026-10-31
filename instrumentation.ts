export async function register() {
  // Only in the long-running Node.js server, not during `next build`
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;

  const { startTrendCollector } = await import("./lib/stryktips/trend-collector");
  startTrendCollector();
}
