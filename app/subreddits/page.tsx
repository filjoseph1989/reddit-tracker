import Link from "next/link";
import { ActionForm, ConfirmSubmitButton, SubmitButton } from "@/components/client";
import { requireUser } from "@/lib/auth";
import { NO_CLIENT, filterByClient } from "@/lib/clients";
import { db } from "@/lib/db";
import {
  addClient,
  deleteClient,
  deleteSubreddit,
  linkSubreddits,
  setSubredditClient,
  unlinkSubreddits,
} from "../actions";

export const instant = false;

type Client = { id: string; name: string };

export default async function SubredditsPage({ searchParams }: PageProps<"/subreddits">) {
  const user = await requireUser();
  const { client: clientParam } = await searchParams;

  const [subreddits, clients] = await Promise.all([
    db.subreddit.findMany({
      where: { userId: user.id },
      include: {
        crosspostLinks: {
          include: { crosspost: true },
          orderBy: { createdAt: "desc" },
        },
        mainLinks: {
          include: { main: true },
          orderBy: { createdAt: "desc" },
        },
        posts: true,
      },
      orderBy: { name: "asc" },
    }),
    db.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Ignore a stale ?client= (e.g. a deleted client) rather than showing an empty page.
  const filter = clientParam === NO_CLIENT || clients.some((c) => c.id === clientParam) ? String(clientParam) : undefined;
  // Subreddits you've only commented in have nothing to classify. Shown under every filter,
  // since a subreddit gets its client once it's classified.
  const unclassified = subreddits.filter((s) => !s.kind && s.posts.length > 0);
  // The full lists feed the link pickers, since a crosspost can be shared across clients.
  const mainSubreddits = subreddits.filter((s) => s.kind === "MAIN");
  const crosspostSubreddits = subreddits.filter((s) => s.kind === "CROSSPOST");
  const shownMain = filterByClient(mainSubreddits, filter);
  const shownCrosspost = filterByClient(crosspostSubreddits, filter);

  // Chip counts cover the classified subreddits, the ones listed below.
  const classified = [...mainSubreddits, ...crosspostSubreddits];
  const counts = new Map<string | null, number>();
  for (const s of classified) counts.set(s.clientId, (counts.get(s.clientId) ?? 0) + 1);
  const countFor = (clientId: string | null) => counts.get(clientId) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Subreddit Relationships & Distribution
        </h1>
        <p className="muted text-sm mt-1">
          Manage your main original content subreddits, see where posts get crossposted, and keep communities organized.
        </p>
      </div>

      {/* Clients */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-base font-semibold">Clients</h2>
          <p className="muted text-xs">
            Group subreddits by the client whose tasks you post there, then filter this page to one client.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href="/subreddits" active={!filter} label="All" count={classified.length} />
          {clients.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1">
              <FilterChip
                href={`/subreddits?client=${c.id}`}
                active={filter === c.id}
                label={c.name}
                count={countFor(c.id)}
              />
              <form action={deleteClient.bind(null, c.id)}>
                <ConfirmSubmitButton
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold leading-none cursor-pointer"
                  confirmMessage={`Delete client ${c.name}? Its subreddits stay in the tracker, just without a client.`}
                  title={`Delete client ${c.name}`}
                >
                  ×
                </ConfirmSubmitButton>
              </form>
            </span>
          ))}
          {clients.length > 0 && (
            <FilterChip
              href={`/subreddits?client=${NO_CLIENT}`}
              active={filter === NO_CLIENT}
              label="No client"
              count={countFor(null)}
            />
          )}
        </div>

        <ActionForm action={addClient} className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            className="input py-1 text-xs flex-1 min-w-48"
            placeholder="Client name"
            required
            aria-label="Client name"
          />
          <SubmitButton className="btn-secondary text-xs py-1">Add client</SubmitButton>
        </ActionForm>
      </div>

      {/* Unclassified Notice */}
      {unclassified.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800/60 dark:bg-amber-950/40">
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Action Needed: {unclassified.length} {unclassified.length === 1 ? "subreddit needs" : "subreddits need"} classification
          </h2>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
            Specify whether each subreddit is a <strong>Main</strong> community for original content or a <strong>Crosspost</strong> community.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {unclassified.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm border border-amber-200 dark:bg-zinc-900 dark:border-amber-800"
              >
                <span className="font-semibold text-xs">r/{sub.displayName}</span>
                <Link
                  href={`/subreddits/${sub.id}/classify`}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                >
                  Classify →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Subreddits & Their Crosspost Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Main Subreddits (Original Posts)</h2>
            <p className="muted text-xs">
              Communities where you publish original posts, with the crosspost subreddits they feed into.
            </p>
          </div>
          <span className="pill bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {shownMain.length} Main
          </span>
        </div>

        {shownMain.length === 0 ? (
          <div className="card text-center py-8 text-sm text-zinc-500">
            {filter
              ? "No main subreddits for this client."
              : "No main subreddits classified yet. Subreddits are automatically added when you log posts."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shownMain.map((main) => {
              const linkedIds = new Set(main.crosspostLinks.map((l) => l.crosspostId));
              const availableToLink = crosspostSubreddits.filter((cp) => !linkedIds.has(cp.id));

              return (
                <div key={main.id} className="card flex flex-col justify-between border-zinc-200 dark:border-zinc-800">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                      <div>
                        <a
                          href={`https://www.reddit.com/r/${main.displayName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-base hover:text-orange-600 transition"
                        >
                          r/{main.displayName}
                        </a>
                        <p className="muted text-xs mt-0.5">
                          {main.posts.length} {main.posts.length === 1 ? "post" : "posts"} logged
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/subreddits/${main.id}/classify`}
                          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
                        >
                          Change type
                        </Link>
                        <form action={deleteSubreddit.bind(null, main.id)}>
                          <ConfirmSubmitButton
                            className="btn-danger text-xs"
                            confirmMessage={`Delete r/${main.displayName} from tracker?`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>

                    <ClientPicker subredditId={main.id} clientId={main.clientId} clients={clients} />

                    {/* Linked Crosspost Subreddits */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                        Linked Crosspost Channels ({main.crosspostLinks.length}):
                      </p>

                      {main.crosspostLinks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">
                          No crosspost subreddits linked yet. When you crosspost within 24h of an original post, it links automatically.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {main.crosspostLinks.map((link) => (
                            <span
                              key={link.crosspostId}
                              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-900 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                            >
                              <span>r/{link.crosspost.displayName}</span>
                              <form action={unlinkSubreddits.bind(null, main.id, link.crosspostId)}>
                                <button
                                  type="submit"
                                  className="text-purple-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold leading-none cursor-pointer"
                                  title="Unlink crosspost subreddit"
                                >
                                  ×
                                </button>
                              </form>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Link Form */}
                  {availableToLink.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                      <ActionForm action={linkSubreddits} className="flex items-center gap-2">
                        <input type="hidden" name="mainId" value={main.id} />
                        <select
                          name="crosspostId"
                          className="input py-1 text-xs flex-1"
                          required
                          aria-label={`Link crosspost to r/${main.displayName}`}
                        >
                          <option value="">+ Link a crosspost subreddit...</option>
                          {availableToLink.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              r/{cp.displayName}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className="btn-secondary text-xs py-1">Link</SubmitButton>
                      </ActionForm>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Crosspost Subreddits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Crosspost Subreddits</h2>
            <p className="muted text-xs">
              Communities used exclusively for amplifying content originally posted in main subreddits.
            </p>
          </div>
          <span className="pill bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            {shownCrosspost.length} Crosspost
          </span>
        </div>

        {shownCrosspost.length === 0 ? (
          <div className="card text-center py-8 text-sm text-zinc-500">
            {filter ? "No crosspost subreddits for this client." : "No crosspost subreddits classified yet."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shownCrosspost.map((cp) => (
              <div key={cp.id} className="card flex flex-col justify-between border-zinc-200 dark:border-zinc-800">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                    <div>
                      <a
                        href={`https://www.reddit.com/r/${cp.displayName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-base hover:text-orange-600 transition"
                      >
                        r/{cp.displayName}
                      </a>
                      <p className="muted text-xs mt-0.5">
                        {cp.posts.length} {cp.posts.length === 1 ? "post" : "posts"} logged
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subreddits/${cp.id}/classify`}
                        className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
                      >
                        Change type
                      </Link>
                      <form action={deleteSubreddit.bind(null, cp.id)}>
                        <ConfirmSubmitButton
                          className="btn-danger text-xs"
                          confirmMessage={`Delete r/${cp.displayName} from tracker?`}
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>

                  <ClientPicker subredditId={cp.id} clientId={cp.clientId} clients={clients} />

                  {/* Connected Main Subreddits */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      Receives Crossposts From ({cp.mainLinks.length}):
                    </p>

                    {cp.mainLinks.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">
                        Not linked to any main subreddit yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cp.mainLinks.map((link) => (
                          <span
                            key={link.mainId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                          >
                            <span>r/{link.main.displayName}</span>
                            <form action={unlinkSubreddits.bind(null, link.mainId, cp.id)}>
                              <button
                                type="submit"
                                className="text-blue-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold leading-none cursor-pointer"
                                title="Unlink"
                              >
                                ×
                              </button>
                            </form>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Linker Card */}
      {mainSubreddits.length > 0 && crosspostSubreddits.length > 0 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-semibold">Link Main & Crosspost Subreddits</h2>
            <p className="muted text-xs">
              Connect a main original content subreddit to a crosspost target community.
            </p>
          </div>

          <ActionForm action={linkSubreddits} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium muted mb-1">Main Subreddit (Source)</label>
              <select name="mainId" className="input w-full" required>
                <option value="">Select main subreddit...</option>
                {mainSubreddits.map((m) => (
                  <option key={m.id} value={m.id}>
                    r/{m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium muted mb-1">Crosspost Subreddit (Target)</label>
              <select name="crosspostId" className="input w-full" required>
                <option value="">Select crosspost subreddit...</option>
                {crosspostSubreddits.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    r/{cp.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="self-end">
              <SubmitButton className="btn-primary">Connect Subreddits</SubmitButton>
            </div>
          </ActionForm>
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  const tone = active
    ? "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  return (
    <Link href={href} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
      <span className="muted">{count}</span>
    </Link>
  );
}

/** Assigns a subreddit to one of the user's clients, or to none. */
function ClientPicker({ subredditId, clientId, clients }: { subredditId: string; clientId: string | null; clients: Client[] }) {
  if (clients.length === 0) return null;
  return (
    <ActionForm action={setSubredditClient} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="subredditId" value={subredditId} />
      <label className="text-xs font-medium muted" htmlFor={`client-${subredditId}`}>
        Client
      </label>
      <select
        key={clientId ?? ""}
        id={`client-${subredditId}`}
        name="clientId"
        defaultValue={clientId ?? ""}
        className="input py-1 text-xs flex-1"
      >
        <option value="">No client</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-secondary text-xs py-1">Set</SubmitButton>
    </ActionForm>
  );
}
