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
  last = 15,
  token,
}: FetcherParams): Promise<Commit[]> {
  if (!cache[path]) {
    const fields =
      "values.path,values.commit.date,values.commit.message,values.commit.hash,values.commit.author.*,values.commit.links.html, values.commit.author.user.nickname, values.commit.author.user.links.avatar.href, values.commit.links.html.href";

    const headers: HeadersInit = token
      ? { Authorization: `bearer ${token}` }
      : {};

    const commitsResponse = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${repo}/filehistory/${sha}/${path}?fields=${fields}`,
      { headers }
    );

    if (!commitsResponse.ok) {
      const body = await commitsResponse.json();
      throw {
        status: commitsResponse.status === 403 ? 404 : commitsResponse.status,
        body,
      };
    }

    const commitsJson = await commitsResponse.json();

    cache[path] = commitsJson.values.map(
      ({
        commit,
      }: {
        commit: {
          hash: string;
          date: string;
          author: {
            raw: string;
            user?: { nickname: string; links: { avatar: { href: string } } };
          };
          links: { html: { href: string } };
          message: string;
        };
      }) => ({
        sha: commit.hash,
        date: new Date(commit.date),
        author: {
          login: commit.author.user
            ? commit.author.user.nickname
            : commit.author.raw,
          avatar: commit.author.user?.links.avatar.href,
        },
        commitUrl: commit.links.html.href,
        message: commit.message,
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
    `https://api.bitbucket.org/2.0/repositories/${repo}/src/${sha}/${path}`,
    { headers }
  );

  if (contentResponse.status === 404) {
    return { content: "" };
  }

  if (!contentResponse.ok) {
    throw {
      status: contentResponse.status,
      body: await contentResponse.json(),
    };
  }

  const content = await contentResponse.text();
  return { content };
}

export default { getCommits };
