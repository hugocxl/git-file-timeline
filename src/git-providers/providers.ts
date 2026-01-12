import { SOURCE, getSource, type SourceType } from "./sources";
import type { GitProvider } from "../types";

// Use dynamic imports for code splitting
const providerModules: Record<
  SourceType,
  () => Promise<{ default: GitProvider }>
> = {
  [SOURCE.VSCODE]: () => import("./vscode-provider"),
  [SOURCE.CLI]: () => import("./cli-provider"),
  [SOURCE.GITLAB]: () => import("./gitlab-provider"),
  [SOURCE.GITHUB]: () => import("./github-provider"),
  [SOURCE.BITBUCKET]: () => import("./bitbucket-provider"),
};

const providerCache: Partial<Record<SourceType, GitProvider>> = {};

export default async function getGitProvider(
  source?: SourceType
): Promise<GitProvider> {
  const resolvedSource = source || getSource();

  if (providerCache[resolvedSource]) {
    return providerCache[resolvedSource]!;
  }

  const module = await providerModules[resolvedSource]();
  providerCache[resolvedSource] = module.default;
  return module.default;
}

// Synchronous version for initial render (returns a placeholder if not loaded)
export function getGitProviderSync(source?: SourceType): GitProvider | null {
  const resolvedSource = source || getSource();
  return providerCache[resolvedSource] || null;
}
