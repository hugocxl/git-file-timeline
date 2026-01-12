import { getLanguage } from "./language-detector";
import { getSlides, getChanges } from "./differ";
import { initHighlighter } from "./shiki-tokenizer";
import type { Commit, Version, WorkerRequest } from "../types";
import { SOURCE, type SourceType } from "./sources";

// Dynamic imports for commit fetchers to avoid bundling all providers
type CommitFetcher = {
  getCommits: (params: FetcherParams) => Promise<Commit[]>;
};

interface FetcherParams {
  path: string;
  repo?: string;
  sha?: string;
  token?: string;
  last?: number;
}

const fetcherCache: Partial<Record<SourceType, CommitFetcher>> = {};

async function getFetcher(source: SourceType): Promise<CommitFetcher> {
  if (fetcherCache[source]) {
    return fetcherCache[source]!;
  }

  let fetcher: CommitFetcher;
  switch (source) {
    case SOURCE.GITHUB:
      fetcher = (await import("./github-commit-fetcher")).default;
      break;
    case SOURCE.GITLAB:
      fetcher = (await import("./gitlab-commit-fetcher")).default;
      break;
    case SOURCE.BITBUCKET:
      fetcher = (await import("./bitbucket-commit-fetcher")).default;
      break;
    case SOURCE.CLI:
      fetcher = (await import("./cli-commit-fetcher")).default;
      break;
    default:
      throw new Error(`Unknown source: ${source}`);
  }

  fetcherCache[source] = fetcher;
  return fetcher;
}

export async function getVersions(
  source: SourceType,
  params: FetcherParams
): Promise<Version[]> {
  const { path } = params;
  const lang = getLanguage(path);

  // Initialize Shiki highlighter (no-op if already initialized)
  const highlighterPromise = initHighlighter();

  const fetcher = await getFetcher(source);
  const commits = await fetcher.getCommits(params);
  await highlighterPromise;

  const codes = commits.map((commit) => commit.content);
  const slides = await getSlides(codes, lang);
  return commits.map((commit, i) => ({
    commit,
    lines: slides[i] ?? [],
    changes: getChanges(slides[i] ?? []),
  }));
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, method, args } = e.data;

  try {
    if (method === "getVersions") {
      const [source, params] = args as [SourceType, FetcherParams];
      const result = await getVersions(source, params);
      self.postMessage({ id, result });
    } else {
      throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
