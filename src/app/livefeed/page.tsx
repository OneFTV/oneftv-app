'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface ActiveTask {
  agent: string;
  task: string;
  started: string;
}

interface FeedData {
  entries: string[];
  activeTasks: ActiveTask[];
  lastUpdated: string;
}

function parseEntry(line: string) {
  const match = line.match(
    /^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/
  );
  if (!match) return null;
  return {
    timestamp: match[1],
    agent: match[2],
    type: match[3],
    message: match[4],
  };
}

function getTypeBadge(type: string) {
  const styles: Record<string, string> = {
    STATUS: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    ERROR: 'bg-red-500/20 text-red-300 border-red-400/30',
    QUESTION: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    DONE: 'bg-green-500/20 text-green-300 border-green-400/30',
    BLOCKER: 'bg-red-500/30 text-red-200 border-red-400/50',
    REQUEST: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    NOTE: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
    SYSTEM: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  };
  return styles[type] || styles.NOTE;
}

function getAgentColor(agent: string) {
  const a = agent.toUpperCase();
  if (a === 'CLAUDE' || a === 'CLAUDE CODE') return 'text-cyan-400';
  if (a === 'CODEX') return 'text-green-400';
  if (a === 'SYSTEM') return 'text-slate-400';
  return 'text-purple-400';
}

export default function LiveFeedPage() {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [postAgent, setPostAgent] = useState('');
  const [postType, setPostType] = useState('STATUS');
  const [postMessage, setPostMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/livefeed');
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      setFeed(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchFeed, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postAgent || !postMessage) return;
    setPosting(true);
    try {
      await fetch('/api/livefeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: postAgent,
          type: postType,
          message: postMessage,
        }),
      });
      setPostMessage('');
      await fetchFeed();
    } catch (err) {
      setError(String(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white">Agent Live Feed</h1>
            <p className="text-slate-400 mt-1">
              Real-time coordination between Claude Code &amp; Codex
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchFeed}
              className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-500/20 border border-green-400/30 text-green-300'
                  : 'bg-slate-800 border border-slate-600 text-slate-400'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Active Tasks</h2>
          {feed?.activeTasks && feed.activeTasks.length > 0 ? (
            <div className="space-y-3">
              {feed.activeTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-slate-800/50 rounded-lg px-4 py-3"
                >
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                        task.agent.toUpperCase().includes('CLAUDE')
                          ? 'bg-cyan-400'
                          : 'bg-green-400'
                      }`}
                    />
                  </div>
                  <span className={`font-semibold text-sm ${getAgentColor(task.agent)}`}>
                    {task.agent}
                  </span>
                  <span className="text-white text-sm flex-1">{task.task}</span>
                  <span className="text-slate-500 text-xs">{task.started}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No active tasks</p>
          )}
        </div>

        {/* Post Form */}
        <div className="mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Post to Feed</h2>
          <form onSubmit={handlePost} className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Agent name"
              value={postAgent}
              onChange={e => setPostAgent(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm w-32 placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
            <select
              value={postType}
              onChange={e => setPostType(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="STATUS">STATUS</option>
              <option value="ERROR">ERROR</option>
              <option value="QUESTION">QUESTION</option>
              <option value="DONE">DONE</option>
              <option value="BLOCKER">BLOCKER</option>
              <option value="REQUEST">REQUEST</option>
              <option value="NOTE">NOTE</option>
            </select>
            <input
              type="text"
              placeholder="Message..."
              value={postMessage}
              onChange={e => setPostMessage(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={posting || !postAgent || !postMessage}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>

        {/* Feed Entries */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Feed</h2>
            {feed?.lastUpdated && (
              <span className="text-slate-500 text-xs">
                Last updated: {new Date(feed.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-cyan-300 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading feed...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          ) : feed?.entries && feed.entries.length > 0 ? (
            <div className="space-y-2">
              {feed.entries.map((line, i) => {
                const parsed = parseEntry(line);
                if (!parsed) return null;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-slate-800/30 rounded-lg px-4 py-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-slate-500 text-xs font-mono whitespace-nowrap pt-0.5">
                      {parsed.timestamp.slice(11) || parsed.timestamp}
                    </span>
                    <span
                      className={`font-semibold text-xs whitespace-nowrap pt-0.5 ${getAgentColor(
                        parsed.agent
                      )}`}
                    >
                      {parsed.agent}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getTypeBadge(
                        parsed.type
                      )}`}
                    >
                      {parsed.type}
                    </span>
                    <span className="text-slate-200 text-sm flex-1">
                      {parsed.message}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              No feed entries yet. Agents will post updates here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
