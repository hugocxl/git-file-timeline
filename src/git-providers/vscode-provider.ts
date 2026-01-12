import { getLanguage } from "./language-detector";
import { getSlides, getChanges } from "./differ";
import { initHighlighter } from "./shiki-tokenizer";
import type { Commit, Version, GitProvider } from "../types";

declare global {
  interface Window {
    vscode: {
      postMessage: (message: unknown) => void;
    };
    _PATH: string;
  }
}

function getPath(): string {
  return window._PATH;
}

function showLanding(): boolean {
  return false;
}

function getCommits(path: string, last: number): Promise<Commit[]> {
  return new Promise((resolve) => {
    window.addEventListener(
      "message",
      (event: MessageEvent) => {
        const commits = event.data as Commit[];
        commits.forEach((c) => (c.date = new Date(c.date)));
        resolve(commits);
      },
      { once: true }
    );

    window.vscode.postMessage({
      command: "commits",
      params: { path, last },
    });
  });
}

async function getVersions(last: number): Promise<Version[]> {
  const path = getPath();
  const lang = getLanguage(path);

  const highlighterPromise = initHighlighter();
  const commits = await getCommits(path, last);
  await highlighterPromise;

  const codes = commits.map((commit) => commit.content);
  const slides = await getSlides(codes, lang);
  return commits.map((commit, i) => ({
    commit,
    lines: slides[i] ?? [],
    changes: getChanges(slides[i] ?? []),
  }));
}

const provider: GitProvider = {
  showLanding,
  getPath,
  getVersions,
};

export default provider;
