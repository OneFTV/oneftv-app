"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FeedKind = "status" | "error" | "task" | "action" | "note";

interface LiveFeedItem {
  id: string;
  author: string;
  kind: FeedKind;
  message: string;
  details?: string;
  actionRequired: boolean;
  actionOwner?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedSummary {
  total: number;
  open: number;
  errors: number;
  actionRequired: number;
}

const REFRESH_MS = 4000;

export default function LiveFeedPage() {
  const [items, setItems] = useState<LiveFeedItem[]>([]);
  const [summary, setSummary] = useState<FeedSummary>({
    total: 0,
    open: 0,
    errors: 0,
    actionRequired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [author, setAuthor] = useState("codex");
  const [kind, setKind] = useState<FeedKind>("status");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState("");
  const [actionRequired, setActionRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const response = await fetch("/api/live-feed", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load feed");
      }
      const data = await response.json();
      setItems(data.items || []);
      setSummary(data.summary || { total: 0, open: 0, errors: 0, actionRequired: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const timer = setInterval(fetchFeed, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchFeed]);

  const actionableItems = useMemo(
    () => items.filter((item) => item.actionRequired && !item.resolved),
    [items]
  );

  const visibleItems = useMemo(
    () => (filter === "open" ? items.filter((item) => !item.resolved) : items),
    [items, filter]
  );

  async function submitEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/live-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author,
          kind,
          message,
          details,
          actionRequired,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create feed item");
      }

      setMessage("");
      setDetails("");
      setActionRequired(false);
      await fetchFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateItem(id: string, action: "resolve" | "reopen" | "claim" | "unclaim") {
    const actor = author.trim();
    const response = await fetch(`/api/live-feed/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actor }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update item");
    }

    await fetchFeed();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Collaboration Feed</h1>
          <p className="text-gray-600 mt-2">
            Shared board for Codex, Claude, and humans to post status, blockers, and actions.
          </p>
        </div>
        <div className="text-sm text-gray-500">Auto-refresh: {REFRESH_MS / 1000}s</div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <StatCard label="Open Items" value={summary.open} />
        <StatCard label="Open Errors" value={summary.errors} />
        <StatCard label="Action Required" value={summary.actionRequired} />
        <StatCard label="Total Posts" value={summary.total} />
      </div>

      {actionableItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="font-semibold text-amber-900">Action Queue</h2>
          <div className="mt-2 space-y-2">
            {actionableItems.map((item) => (
              <div key={item.id} className="text-sm text-amber-800">
                <span className="font-semibold">{item.kind.toUpperCase()}:</span> {item.message}
                {item.actionOwner && <span> (owner: {item.actionOwner})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submitEntry} className="bg-white rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Post Update</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">
            <div className="text-gray-700 mb-1">Author</div>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="codex / claude / your-name"
              required
            />
          </label>
          <label className="text-sm">
            <div className="text-gray-700 mb-1">Type</div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FeedKind)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="status">status</option>
              <option value="task">task</option>
              <option value="error">error</option>
              <option value="action">action</option>
              <option value="note">note</option>
            </select>
          </label>
          <label className="text-sm flex items-end">
            <span className="inline-flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={actionRequired}
                onChange={(e) => setActionRequired(e.target.checked)}
              />
              Action required
            </span>
          </label>
        </div>

        <label className="text-sm block">
          <div className="text-gray-700 mb-1">Message</div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="What are you working on, blocked by, or asking for?"
            required
          />
        </label>

        <label className="text-sm block">
          <div className="text-gray-700 mb-1">Details (optional)</div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full rounded border px-3 py-2 min-h-20"
            placeholder="Extra context, paths, stack traces, next steps..."
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          {submitting ? "Posting..." : "Post to Feed"}
        </button>
      </form>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Feed</h2>
          <div className="inline-flex rounded border overflow-hidden text-sm">
            <button
              onClick={() => setFilter("open")}
              className={`px-3 py-1 ${filter === "open" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 ${filter === "all" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              All
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading feed...</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-gray-500">No feed entries yet.</p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className={`rounded border p-3 ${
                  item.resolved ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{item.author}</span>
                  <Badge>{item.kind}</Badge>
                  {item.actionRequired && <Badge tone="warn">action required</Badge>}
                  {item.resolved && <Badge tone="ok">resolved</Badge>}
                  {item.actionOwner && <Badge tone="info">owner: {item.actionOwner}</Badge>}
                  <span className="text-gray-500 ml-auto">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="mt-2 text-gray-900">{item.message}</p>
                {item.details && <p className="mt-1 text-sm text-gray-600">{item.details}</p>}

                <div className="mt-3 flex gap-2">
                  {!item.actionOwner && (
                    <button
                      onClick={() => updateItem(item.id, "claim").catch((err) => setError(err.message))}
                      className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                    >
                      Claim
                    </button>
                  )}
                  {item.actionOwner && (
                    <button
                      onClick={() => updateItem(item.id, "unclaim").catch((err) => setError(err.message))}
                      className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                    >
                      Unclaim
                    </button>
                  )}
                  {!item.resolved ? (
                    <button
                      onClick={() => updateItem(item.id, "resolve").catch((err) => setError(err.message))}
                      className="text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => updateItem(item.id, "reopen").catch((err) => setError(err.message))}
                      className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4">
        <h2 className="font-semibold">API usage for agents</h2>
        <pre className="text-xs mt-2 overflow-x-auto">
{`POST /api/live-feed
{
  "author": "codex",
  "kind": "status",
  "message": "Working on tournaments endpoint cleanup",
  "details": "Investigating /src/app/api/tournaments/route.ts",
  "actionRequired": false
}

PATCH /api/live-feed/:id
{ "action": "claim", "actor": "claude" }
{ "action": "resolve", "actor": "codex" }`}
        </pre>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "ok" | "info";
}) {
  const classes =
    tone === "warn"
      ? "bg-amber-100 text-amber-800"
      : tone === "ok"
      ? "bg-green-100 text-green-800"
      : tone === "info"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-700";

  return <span className={`px-2 py-0.5 rounded text-xs ${classes}`}>{children}</span>;
}
