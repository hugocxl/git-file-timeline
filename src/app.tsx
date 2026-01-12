import { useState, useEffect } from "react";
import History from "./history";
import Landing from "./landing";
import { useDocumentTitle, Loading, Error } from "./app-helpers";
import getGitProvider from "./git-providers/providers";
import type { GitProvider, Version } from "./types";

export default function App() {
  const [provider, setProvider] = useState<GitProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGitProvider().then((p) => {
      setProvider(p);
      setLoading(false);
    });
  }, []);

  if (loading || !provider) {
    return <Loading path="" />;
  }

  if (provider.showLanding()) {
    return <Landing />;
  }

  return (
    <>
      <InnerApp gitProvider={provider} />
      <footer>
        <a href="https://github.com/pomber/git-history">Git History</a>
        <br />
        by
        <a href="https://twitter.com/pomber">@pomber</a>
      </footer>
    </>
  );
}

interface InnerAppProps {
  gitProvider: GitProvider;
}

function InnerApp({ gitProvider }: InnerAppProps) {
  const path = gitProvider.getPath() || "";
  const fileName = path.split("/").pop() || "";

  useDocumentTitle(`Git History - ${fileName}`);

  const [versions, loading, error, loadMore] = useVersionsLoader(gitProvider);

  if (error) {
    return <Error error={error} gitProvider={gitProvider} />;
  }

  if (!versions && loading) {
    return <Loading path={path} />;
  }

  if (!versions || versions.length === 0) {
    return <Error error={{ status: 404 }} gitProvider={gitProvider} />;
  }

  return <History versions={versions} loadMore={loadMore} />;
}

interface LoaderState {
  data: Version[] | null;
  loading: boolean;
  error: unknown;
  last: number;
  noMore: boolean;
}

function useVersionsLoader(
  gitProvider: GitProvider
): [Version[] | null, boolean, unknown, () => void] {
  const [state, setState] = useState<LoaderState>({
    data: null,
    loading: true,
    error: null,
    last: 10,
    noMore: false,
  });

  const loadMore = () => {
    setState((old) => {
      const shouldFetchMore = !old.loading && !old.noMore;
      return shouldFetchMore
        ? { ...old, last: old.last + 10, loading: true }
        : old;
    });
  };

  useEffect(() => {
    gitProvider
      .getVersions(state.last)
      .then((data) => {
        setState((old) => ({
          data,
          loading: false,
          error: null,
          last: old.last,
          noMore: data.length < old.last,
        }));
      })
      .catch((error) => {
        setState((old) => ({
          ...old,
          loading: false,
          error: error.message || error,
        }));
      });
  }, [state.last, gitProvider]);

  return [state.data, state.loading, state.error, loadMore];
}
