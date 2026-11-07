import React, { useEffect, useMemo, useRef, useState } from "react";
import { CloudIcon, ArrowPathIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from "../Icons";
import {
  BrowserSyncStore,
  HttpSyncTransport,
  SyncEngine,
  getOrCreateDeviceId,
  type SyncStatus,
} from "../../apps/aetherius-sync/src/index";
import { setSyncSession } from "./syncSession";

/**
 * Cloud & Sync settings.
 *
 * Connects the shell to the free-tier Cloudflare sync worker (D1 backend).
 * The token is session-only: it lives in component state and is never
 * written to localStorage, so it disappears when the tab closes. The
 * endpoint is persisted because it is not a secret.
 */

const ENDPOINT_KEY = "aetherius.sync.endpoint.v1";
const DEFAULT_ENDPOINT = "https://aetherius-sync.jprophit-87b.workers.dev";

function loadEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_KEY) || DEFAULT_ENDPOINT;
  } catch {
    return DEFAULT_ENDPOINT;
  }
}

function saveEndpoint(value: string): void {
  try {
    localStorage.setItem(ENDPOINT_KEY, value);
  } catch {
    // Storage may be unavailable in private browsing; the panel still works.
  }
}

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-100";

const buttonPrimary =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50";

const buttonSecondary =
  "rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50";

export const CloudSyncSettings: React.FC<{ title: string }> = ({ title }) => {
  const [endpoint, setEndpoint] = useState(loadEndpoint);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [health, setHealth] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ appId: string; collection: string; key: string; detectedAt: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"info" | "error" | "success">("info");
  const storeRef = useRef<BrowserSyncStore | null>(null);
  const deviceId = useMemo(() => {
    try {
      return getOrCreateDeviceId(window.localStorage);
    } catch {
      return "device-ephemeral";
    }
  }, []);

  const engine = useMemo(() => {
    const store = new BrowserSyncStore();
    storeRef.current = store;
    const transport = new HttpSyncTransport({ baseUrl: endpoint || DEFAULT_ENDPOINT, token: token || undefined });
    return new SyncEngine({ store, transport, deviceId });
    // Rebuilt deliberately when endpoint or token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, token, deviceId]);

  // Publish to the shared session so apps (Notes etc.) can sync without a
  // second token entry. Still never persisted: page reload clears it.
  useEffect(() => {
    setSyncSession(endpoint, token);
  }, [endpoint, token]);

  const refresh = () => {
    setStatus(engine.status());
    setConflicts(
      storeRef.current?.listConflicts().map((conflict) => ({
        appId: conflict.appId,
        collection: conflict.collection,
        key: conflict.key,
        detectedAt: conflict.detectedAt,
      })) ?? [],
    );
  };

  useEffect(refresh, [engine]);

  const say = (text: string, kind: "info" | "error" | "success") => {
    setMessage(text);
    setMessageKind(kind);
  };

  const testConnection = async () => {
    setBusy(true);
    const result = await engine.testConnection();
    setBusy(false);
    if (result.ok) {
      setHealth(
        `${result.data.service} v${result.data.version} — auth ${result.data.auth}`,
      );
      say("Connection succeeded.", "success");
    } else {
      setHealth(null);
      say(`${result.code}: ${result.error}`, "error");
    }
  };

  const syncNow = async () => {
    setBusy(true);
    const report = await engine.sync();
    setBusy(false);
    refresh();
    if (report.ok) {
      say(
        `Sync complete — pushed ${report.pushed}, pulled ${report.pulled}, conflicts ${report.conflicts}.`,
        "success",
      );
    } else {
      say(`${report.code ?? "SYNC_FAILED"}: ${report.error ?? "unknown error"}`, "error");
    }
  };

  const clearLocal = () => {
    storeRef.current?.reset();
    refresh();
    say("Local replica and outbox cleared. The cloud copy is untouched.", "info");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <CloudIcon className="h-8 w-8 text-blue-500" />
        {title}
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Sync endpoint</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Free-tier Cloudflare Worker backed by D1. Local-first: the shell keeps
          working offline and sends its outbox when the worker answers.
        </p>
        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Endpoint URL
          <input
            className={inputClass}
            value={endpoint}
            onChange={(event) => {
              setEndpoint(event.target.value);
              saveEndpoint(event.target.value);
            }}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Bearer token (session only)
          <input
            className={inputClass}
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste the SYNC_TOKEN secret"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          The token is never saved. It is sent only as an Authorization header
          and is lost when you close the tab.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className={buttonPrimary} onClick={testConnection} disabled={busy}>
            Test connection
          </button>
          <button className={buttonSecondary} onClick={syncNow} disabled={busy}>
            <ArrowPathIcon className="mr-2 inline h-4 w-4" />
            Sync now
          </button>
          <button className={buttonSecondary} onClick={clearLocal} disabled={busy}>
            <TrashIcon className="mr-2 inline h-4 w-4" />
            Clear local replica
          </button>
        </div>
        {health && (
          <p className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5" /> {health}
          </p>
        )}
        {message && (
          <p
            className={
              messageKind === "error"
                ? "mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                : messageKind === "success"
                  ? "mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                  : "mt-3 text-sm text-gray-600 dark:text-gray-300"
            }
          >
            {messageKind === "error" && <ExclamationTriangleIcon className="h-5 w-5" />}
            {message}
          </p>
        )}
      </div>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Status</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Device</dt>
              <dd className="font-mono text-xs">{status.deviceId}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Local records</dt>
              <dd>{status.records}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Pending outbox</dt>
              <dd>{status.pending}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Server cursor</dt>
              <dd>{status.cursor}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Last sync</dt>
              <dd>{status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : "never"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Last error</dt>
              <dd>{status.lastError ?? "none"}</dd>
            </div>
          </dl>
          {storeRef.current && !storeRef.current.persistent && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Browser storage is unavailable, so the local replica will not survive a reload.
            </p>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/20">
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">
            Conflicts need your attention ({conflicts.length})
          </h2>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Two devices changed the same record. The deterministic winner is
            live; the losing value is preserved below.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {conflicts.map((conflict, index) => (
              <li key={index} className="font-mono text-xs">
                {conflict.appId} / {conflict.collection} / {conflict.key} —{" "}
                {new Date(conflict.detectedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
