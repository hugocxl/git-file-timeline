import type { SourceType } from "./sources";
import type { Version, WorkerRequest, WorkerResponse } from "../types";

// Vite worker wrapper - provides same interface as workerize-loader
const worker = new Worker(new URL("./versioner.worker.ts", import.meta.url), {
  type: "module",
});

let messageId = 0;
const pending = new Map<
  number,
  { resolve: (value: Version[]) => void; reject: (error: Error) => void }
>();

worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
  const { id, result, error } = e.data;
  const handlers = pending.get(id);
  if (!handlers) return;

  pending.delete(id);
  if (error) {
    handlers.reject(new Error(error));
  } else {
    handlers.resolve(result as Version[]);
  }
};

export interface VersionerParams {
  path: string;
  repo?: string;
  sha?: string;
  token?: string;
  last?: number;
}

const versioner = {
  getVersions(source: SourceType, params: VersionerParams): Promise<Version[]> {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pending.set(id, { resolve, reject });
      const request: WorkerRequest = {
        id,
        method: "getVersions",
        args: [source, params],
      };
      worker.postMessage(request);
    });
  },
};

export default versioner;
