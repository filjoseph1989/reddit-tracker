/** `?client=` value that shows the subreddits not assigned to any client. */
export const NO_CLIENT = "none";

/** Longest client name we accept. */
export const CLIENT_NAME_MAX = 50;

/** Trims and collapses whitespace in a client name, e.g. "  Acme   Co " -> "Acme Co". */
export function cleanClientName(input: string): string {
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Enter a client name.");
  if (name.length > CLIENT_NAME_MAX) throw new Error(`Keep the client name to ${CLIENT_NAME_MAX} characters or fewer.`);
  return name;
}

/**
 * Subreddits matching the `?client=` filter: all of them when it's empty,
 * the unassigned ones for {@link NO_CLIENT}, otherwise that client's.
 */
export function filterByClient<T extends { clientId: string | null }>(subreddits: T[], filter?: string): T[] {
  if (!filter) return subreddits;
  if (filter === NO_CLIENT) return subreddits.filter((s) => !s.clientId);
  return subreddits.filter((s) => s.clientId === filter);
}
