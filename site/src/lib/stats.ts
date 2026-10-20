import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "./utils";

const OWNER_REPO = "SurajsinghBayas/wakekeeper";
const API = "https://api.github.com";
const CACHE_KEY = "wk-stats";
const CACHE_MS = 15 * 60_000; // GitHub allows 60 unauthenticated requests an hour per visitor

export type Stats = {
  /** Every installer and zip download across all releases. */
  downloads: number;
  /** Issues ever opened on GitHub (bug reports and support questions). */
  requests: number;
  resolved: number;
  stars: number;
};

async function json<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function fetchStats(): Promise<Stats> {
  const issues = (q: string) => json<{ total_count: number }>(`/search/issues?q=${encodeURIComponent(`repo:${OWNER_REPO} type:issue ${q}`)}&per_page=1`);
  const [releases, repo, all, closed] = await Promise.all([
    json<{ assets: { download_count: number }[] }[]>(`/repos/${OWNER_REPO}/releases?per_page=100`),
    json<{ stargazers_count: number }>(`/repos/${OWNER_REPO}`),
    issues(""),
    issues("state:closed"),
  ]);
  return {
    downloads: releases.reduce((sum, r) => sum + r.assets.reduce((s, a) => s + a.download_count, 0), 0),
    requests: all.total_count,
    resolved: closed.total_count,
    stars: repo.stargazers_count,
  };
}

/** Public numbers read live from GitHub, cached briefly per visitor. Null until loaded or if GitHub is unreachable. */
export function useStats(): Stats | null {
  // Starts empty on every render so the prerendered HTML and the first browser render match.
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const cached = readStorage<{ at: number; stats: Stats } | null>(CACHE_KEY, null);
    if (cached) setStats(cached.stats);
    if (cached && Date.now() - cached.at < CACHE_MS) return;
    let cancelled = false;
    fetchStats()
      .then((s) => {
        if (cancelled) return;
        setStats(s);
        writeStorage(CACHE_KEY, { at: Date.now(), stats: s });
      })
      .catch(() => {
        // Rate-limited or offline: keep whatever is cached.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
