import React from "react";
import netlify from "netlify-auth-providers";
import versioner from "./versioner";
import { SOURCE } from "./sources";
import type { GitProvider, Version } from "../types";

const TOKEN_KEY = "bitbucket-token";

function isLoggedIn(): boolean {
  return !!window.localStorage.getItem(TOKEN_KEY);
}

function getUrlParams(): [string, string, string] | [] {
  const [, owner, reponame, , sha, ...paths] =
    window.location.pathname.split("/");

  if (!sha) {
    return [];
  }

  return [owner + "/" + reponame, sha, paths.join("/")];
}

function getPath(): string | null {
  const [, , path] = getUrlParams();
  return path || null;
}

function showLanding(): boolean {
  const [repo] = getUrlParams();
  return !repo;
}

function logIn(): void {
  const authenticator = new netlify({
    site_id: "ccf3a0e2-ac06-4f37-9b17-df1dd41fb1a6",
  });
  authenticator.authenticate(
    { provider: "bitbucket" },
    function (err: Error | null, data: { token: string }) {
      if (err) {
        console.error(err);
        return;
      }
      window.localStorage.setItem(TOKEN_KEY, data.token);
      window.location.reload();
    }
  );
}

function LogInButton(): React.ReactElement {
  return (
    <button
      onClick={logIn}
      style={{ fontWeight: 600, padding: "0.5em 0.7em", cursor: "pointer" }}
    >
      <div>Sign in with Bitbucket</div>
    </button>
  );
}

function getParams() {
  const [repo, sha, path] = getUrlParams();
  const token = window.localStorage.getItem(TOKEN_KEY);
  return { repo, sha, path, token };
}

async function getVersions(last: number): Promise<Version[]> {
  const params = { ...getParams(), last };
  return await versioner.getVersions(SOURCE.BITBUCKET, params);
}

const provider: GitProvider = {
  showLanding,
  getPath,
  getVersions,
  logIn,
  isLoggedIn,
  LogInButton,
};

export default provider;
