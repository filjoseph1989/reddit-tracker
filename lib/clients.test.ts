import { describe, expect, it } from "vitest";
import { CLIENT_NAME_MAX, NO_CLIENT, cleanClientName, filterByClient } from "./clients";

describe("cleanClientName", () => {
  it("trims and collapses whitespace", () => {
    expect(cleanClientName("  Acme   Co ")).toBe("Acme Co");
  });

  it("rejects an empty name", () => {
    expect(() => cleanClientName("   ")).toThrow("Enter a client name.");
  });

  it("rejects a name over the limit", () => {
    expect(cleanClientName("a".repeat(CLIENT_NAME_MAX))).toHaveLength(CLIENT_NAME_MAX);
    expect(() => cleanClientName("a".repeat(CLIENT_NAME_MAX + 1))).toThrow();
  });
});

describe("filterByClient", () => {
  const subs = [
    { id: "a", clientId: "acme" },
    { id: "b", clientId: "globex" },
    { id: "c", clientId: null },
    { id: "d", clientId: "acme" },
  ];
  const ids = (list: { id: string }[]) => list.map((s) => s.id);

  it("returns everything without a filter", () => {
    expect(ids(filterByClient(subs))).toEqual(["a", "b", "c", "d"]);
    expect(ids(filterByClient(subs, ""))).toEqual(["a", "b", "c", "d"]);
  });

  it("returns one client's subreddits", () => {
    expect(ids(filterByClient(subs, "acme"))).toEqual(["a", "d"]);
  });

  it("returns unassigned subreddits for NO_CLIENT", () => {
    expect(ids(filterByClient(subs, NO_CLIENT))).toEqual(["c"]);
  });

  it("returns nothing for an unknown client", () => {
    expect(filterByClient(subs, "missing")).toEqual([]);
  });
});
