import { Base64 } from "js-base64";
import type { Commit } from "../types";

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    author: {
      date: string;
      name: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubContentResponse {
  content: string;
  html_url: string;
}

interface FetcherParams {
  repo: string;
  sha: string;
  path: string;
  token?: string;
  last?: number;
}

interface CachedCommit extends Commit {
  content: string;
  fileUrl?: string;
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
      `https://api.github.com/repos/${repo}/commits?sha=${sha}&path=${path}`,
      { headers }
    );

    if (!commitsResponse.ok) {
      const body = await commitsResponse.json();
      throw { status: commitsResponse.status, body };
    }

    const commitsJson: GitHubCommitResponse[] = await commitsResponse.json();

    cache[path] = commitsJson.map((commit) => ({
      sha: commit.sha,
      date: new Date(commit.commit.author.date),
      author: {
        login: commit.author ? commit.author.login : commit.commit.author.name,
        avatar: commit.author
          ? commit.author.avatar_url
          : "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      },
      commitUrl: commit.html_url,
      message: commit.commit.message,
      content: "",
    }));
  }

  const commits = cache[path].slice(0, last);

  await Promise.all(
    commits.map(async (commit) => {
      if (!commit.content) {
        const info = await getContent(repo, commit.sha!, path, token);
        commit.content = info.content;
        commit.fileUrl = info.url;
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
): Promise<{ content: string; url?: string }> {
  const headers: HeadersInit = token
    ? { Authorization: `bearer ${token}` }
    : {};

  const contentResponse = await fetch(
    `https://api.github.com/repos/${repo}/contents${path}?ref=${sha}`,
    { headers }
  );

  if (contentResponse.status === 404) {
    return { content: "" };
  }

  const contentJson: GitHubContentResponse = await contentResponse.json();

  if (!contentResponse.ok) {
    throw { status: contentResponse.status, body: contentJson };
  }

  const content = Base64.decode(contentJson.content);
  return { content, url: contentJson.html_url };
}

export default { getCommits };
