import type { Commit } from "../types";

interface FetcherParams {
  path: string;
  last?: number;
}

async function getCommits({
  path,
  last = 15,
}: FetcherParams): Promise<Commit[]> {
  const response = await fetch(
    `/api/commits?path=${encodeURIComponent(path)}&last=${last}`
  );
  const commits = await response.json();
  commits.forEach((c: Commit) => (c.date = new Date(c.date)));

  return commits;
}

export default { getCommits };
