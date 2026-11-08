/**
 * Shared Aetherius Hive client.
 *
 * Any agent or script can use this module, the CLI, the MCP server or plain
 * HTTP. The bus is localhost-only and stores no credentials.
 */

export const HIVE_URL = (process.env.HIVE_URL || "http://127.0.0.1:7317").replace(/\/$/, "");

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${HIVE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.HIVE_TIMEOUT_MS || 15_000)),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`hive returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`hive ${method} ${path} failed (${response.status}): ${payload?.error || text.slice(0, 200)}`);
  }
  return payload;
}

export const hive = {
  url: HIVE_URL,
  health: () => request("/health"),
  status: () => request("/status"),
  register: (agent) => request("/agents/register", { method: "POST", body: agent }),
  heartbeat: (id, extra = {}) => request("/agents/heartbeat", { method: "POST", body: { id, ...extra } }),
  agents: () => request("/agents"),
  send: (message) => request("/messages", { method: "POST", body: message }),
  messages: ({ since = 0, to, topic, limit = 50 } = {}) => {
    const query = new URLSearchParams();
    query.set("since", String(since));
    query.set("limit", String(limit));
    if (to) query.set("to", to);
    if (topic) query.set("topic", topic);
    return request(`/messages?${query}`);
  },
  tasks: ({ status, assignee, limit = 100 } = {}) => {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (status) query.set("status", status);
    if (assignee) query.set("assignee", assignee);
    return request(`/tasks?${query}`);
  },
  task: (id) => request(`/tasks/${encodeURIComponent(id)}`),
  createTask: (task) => request("/tasks", { method: "POST", body: task }),
  claimTask: (id, agent) => request(`/tasks/${encodeURIComponent(id)}/claim`, { method: "POST", body: { agent } }),
  updateTask: (id, update) => request(`/tasks/${encodeURIComponent(id)}/update`, { method: "POST", body: update }),
  memoryGet: (key) => request(`/memory/${encodeURIComponent(key)}`),
  memorySet: (key, value, owner = "unknown", tags = []) =>
    request(`/memory/${encodeURIComponent(key)}`, { method: "PUT", body: { value, owner, tags } }),
  work: ({ agent, status, task_id, since = 0, limit = 100 } = {}) => {
    const query = new URLSearchParams();
    query.set("since", String(since));
    query.set("limit", String(limit));
    if (agent) query.set("agent", agent);
    if (status) query.set("status", status);
    if (task_id) query.set("task_id", task_id);
    return request(`/work?${query}`);
  },
  recordWork: (entry) => request("/work", { method: "POST", body: entry }),
  workSummary: () => request("/work/summary"),
  leases: () => request("/leases"),
  lease: (key) => request(`/leases/${encodeURIComponent(key)}`),
  acquireLease: (input) => request("/leases/acquire", { method: "POST", body: input }),
  releaseLease: (input) => request("/leases/release", { method: "POST", body: input }),
};

export default hive;
