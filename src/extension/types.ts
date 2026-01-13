/** Commit data from git log */
export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  content: string;
}

/** Diff viewer layout mode */
export type DiffLayout = "unified" | "split";

/** Diff viewer settings persisted across sessions */
export interface DiffSettings {
  layout: DiffLayout;
  theme: string;
  lineNumbers: boolean;
  background: boolean;
  expandUnchanged: boolean;
}

/** Messages sent from extension host to webview */
export type ToWebviewMessage =
  | { type: "init"; filePath: string; fileName: string }
  | { type: "commits"; commits: Commit[]; hasMore: boolean }
  | { type: "error"; message: string }
  | { type: "settings"; settings: DiffSettings };

/** Messages sent from webview to extension host */
export type ToExtensionMessage =
  | { type: "ready" }
  | { type: "loadMore"; before: string | null }
  | { type: "saveSettings"; settings: DiffSettings };
