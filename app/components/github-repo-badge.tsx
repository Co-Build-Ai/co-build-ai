"use client";

import { useEffect, useState } from "react";

export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /^https?:\/\/(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s]+?)(?:\.git)?(?:[\/?#].*)?$/i
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export default function GithubRepoBadge({ repoUrl }: { repoUrl: string }) {
  const [lastCommit, setLastCommit] = useState<{
    message: string;
    date: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const repo = parseGithubRepo(repoUrl);
    if (!repo) return;

    let cancelled = false;
    fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.[0]) return;
        setLastCommit({
          message: data[0].commit.message.split("\n")[0],
          date: data[0].commit.author.date,
          url: data[0].html_url,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  return (
    <div className="mt-2 text-xs text-ink-soft">
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-coral-dark hover:underline"
      >
        GitHub Reposu →
      </a>
      {lastCommit && (
        <a
          href={lastCommit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block hover:text-ink"
        >
          <span className="font-mono text-periwinkle-dark">Son commit:</span> {lastCommit.message}
          <span className="text-ink-soft/70"> · {new Date(lastCommit.date).toLocaleDateString("tr-TR")}</span>
        </a>
      )}
    </div>
  );
}
