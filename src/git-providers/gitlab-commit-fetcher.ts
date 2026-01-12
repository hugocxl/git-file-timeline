import { Base64 } from "js-base64";
import type { Commit } from "../types";

interface FetcherParams {
  repo: string;
  sha: string;
  path: string;
  token?: string;
  last?: number;
}

interface CachedCommit extends Commit {
  content: string;
}

const cache: Record<string, CachedCommit[]> = {};

async function getCommits({
  repo,
  sha,
  path,
  token,
  last = 15,
}: FetcherParams): Promise<Commit[]> {
  if (!cache[path]) {
    const headers: HeadersInit = token
      ? { Authorization: `bearer ${token}` }
      : {};

    const commitsResponse = await fetch(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(
        repo
      )}/repository/commits?path=${encodeURIComponent(path)}&ref_name=${sha}`,
      { headers }
    );

    const commitsJson = await commitsResponse.json();

    if (!commitsResponse.ok) {
      throw { status: commitsResponse.status, body: commitsJson };
    }

    cache[path] = commitsJson.map(
      (commit: {
        id: string;
        authored_date: string;
        author_name: string;
        title: string;
      }) => ({
        sha: commit.id,
        date: new Date(commit.authored_date),
        author: { login: commit.author_name },
        message: commit.title,
        content: "",
      })
    );
  }

  const commits = cache[path].slice(0, last);

  await Promise.all(
    commits.map(async (commit) => {
      if (!commit.content) {
        const info = await getContent(repo, commit.sha!, path, token);
        commit.content = info.content;
      }
    })
  );

  return commits;
}

async function getContent(
  repo: string,
  sha: string,
  path: string,
  token?: string
): Promise<{ content: string }> {
  const headers: HeadersInit = token
    ? { Authorization: `bearer ${token}` }
    : {};

  const contentResponse = await fetch(
    `https://gitlab.com/api/v4/projects/${encodeURIComponent(
      repo
    )}/repository/files/${encodeURIComponent(path)}?ref=${sha}`,
    { headers }
  );

  if (contentResponse.status === 404) {
    return { content: "" };
  }

  const contentJson = await contentResponse.json();

  if (!contentResponse.ok) {
    throw { status: contentResponse.status, body: contentJson };
  }

  const content = Base64.decode(contentJson.content);
  return { content };
}

export default { getCommits };
