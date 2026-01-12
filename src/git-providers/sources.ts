export const SOURCE = {
  GITHUB: "github",
  GITLAB: "gitlab",
  BITBUCKET: "bitbucket",
  CLI: "cli",
  VSCODE: "vscode",
} as const;

export type SourceType = (typeof SOURCE)[keyof typeof SOURCE];

const WEB_SOURCES = [SOURCE.GITLAB, SOURCE.GITHUB, SOURCE.BITBUCKET] as const;

export function getSource(): SourceType {
  const envProvider = import.meta.env.VITE_GIT_PROVIDER;
  if (envProvider) return envProvider as SourceType;

  const [cloud] = window.location.host.split(".");
  if ((WEB_SOURCES as readonly string[]).includes(cloud)) {
    return cloud as SourceType;
  }
  const source = new URLSearchParams(window.location.search).get("source");
  return (source as SourceType) || SOURCE.GITHUB;
}
