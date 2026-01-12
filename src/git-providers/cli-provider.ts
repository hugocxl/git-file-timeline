import versioner from "./versioner";
import { SOURCE } from "./sources";
import type { GitProvider, Version } from "../types";

function getPath(): string | null {
  return new URLSearchParams(window.location.search).get("path");
}

function showLanding(): boolean {
  return false;
}

async function getVersions(last: number): Promise<Version[]> {
  const path = getPath();
  if (!path) throw new Error("No path provided");
  const params = { path, last };
  return await versioner.getVersions(SOURCE.CLI, params);
}

const provider: GitProvider = {
  showLanding,
  getVersions,
  getPath,
};

export default provider;
