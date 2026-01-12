// Core type definitions for Git History

export interface Token {
  type: string;
  color: string;
  content: string;
  fontStyle?: number;
}

export interface Line {
  content: string;
  tokens: Token[];
  left: boolean;
  middle: boolean;
  right: boolean;
  key: number;
}

export interface Change {
  start: number;
  end: number;
}

export interface CommitAuthor {
  login: string;
  avatar?: string;
}

export interface Commit {
  sha?: string;
  hash?: string;
  date: Date;
  author: CommitAuthor;
  message: string;
  content: string;
  commitUrl?: string;
  fileUrl?: string;
}

export interface Version {
  commit: Commit;
  lines: Line[];
  changes: Change[];
}

export interface LineStyle {
  transform?: string;
  height?: number;
  opacity?: number;
}

// Git provider types
export enum SOURCE {
  GITHUB = "github",
  GITLAB = "gitlab",
  BITBUCKET = "bitbucket",
  CLI = "cli",
  VSCODE = "vscode",
}

export interface GitProvider {
  showLanding: () => boolean;
  getPath: () => string | null;
  getVersions: (last: number) => Promise<Version[]>;
  isLoggedIn?: () => boolean;
  logIn?: () => void;
  LogInButton?: React.ComponentType;
}

// Theme types
export interface ThemeStyle {
  color?: string;
  fontStyle?: string;
  fontWeight?: string;
}

export interface Theme {
  plain: {
    color: string;
    backgroundColor: string;
  };
  styles: Array<{
    types: string[];
    style: ThemeStyle;
  }>;
}

// Worker message types
export interface WorkerRequest {
  id: number;
  method: string;
  args: unknown[];
}

export interface WorkerResponse {
  id: number;
  result?: unknown;
  error?: string;
}
