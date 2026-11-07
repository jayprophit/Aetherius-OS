import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const python = process.env.PYTHON ?? "python";

const results = [];

function run(name, command, args, cwd) {
  const started = Date.now();
  const proc = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: 180_000,
  });
  const result = {
    name,
    command: [command, ...args].join(" "),
    exitCode: proc.status,
    passed: proc.status === 0,
    durationMs: Date.now() - started,
    stdout: (proc.stdout ?? "").trim(),
    stderr: (proc.stderr ?? "").trim(),
  };
  results.push(result);
  return result;
}

const pytest = run("python-tests", python, ["-m", "pytest", "-q"], here);
const caps = run("capabilities", python, ["-m", "aetherius_kernel", "capabilities"], here);

let capabilities = null;
if (caps.passed) {
  try {
    capabilities = JSON.parse(caps.stdout);
  } catch {
    caps.passed = false;
    caps.stderr = `${caps.stderr}\nCould not parse capability JSON`;
  }
}

const nativeCandidates = [
  join(repoRoot, "native", "kernel", "build", "host", "test_kernel.exe"),
  join(repoRoot, "native", "kernel", "build", "host", "test_kernel"),
];
const native = nativeCandidates.find((path) => existsSync(path));
if (native) {
  run("native-kernel-host-tests", native, [], dirname(native));
} else {
  results.push({
    name: "native-kernel-host-tests",
    command: nativeCandidates[0],
    exitCode: null,
    passed: false,
    durationMs: 0,
    stdout: "",
    stderr: "native kernel host test binary not found",
  });
}

const manifestPath = join(here, "manifest.json");
let manifest = null;
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
}

// The manifest must not drift into a hardware or bootable-OS claim. This is a
// real check, not a comment: a future edit that flips a claim fails verify.
const honestyIssues = [];
if (!capabilities) {
  honestyIssues.push("capability report is missing or unparsable");
} else {
  const claims = capabilities.claims ?? {};
  if (claims.ternary_hardware !== false) honestyIssues.push("ternary_hardware must be false");
  if (claims.quantum_hardware !== false) honestyIssues.push("quantum_hardware must be false");
  if (claims.bootable_general_purpose_os !== false) {
    honestyIssues.push("bootable_general_purpose_os must be false");
  }
  const remote = (capabilities.backends ?? []).find(
    (backend) => backend.backend_id === "aetherius.quantum.remote-qpu",
  );
  if (!remote || remote.execution_class !== "BLOCKED_DEPENDENCY" || remote.available !== false) {
    honestyIssues.push("remote QPU must remain BLOCKED_DEPENDENCY and unavailable");
  }
}
if (manifest) {
  const claims = manifest.claims ?? {};
  if (claims.ternary_hardware !== false) honestyIssues.push("manifest ternary_hardware must be false");
  if (claims.quantum_hardware !== false) honestyIssues.push("manifest quantum_hardware must be false");
  if (claims.bootable_general_purpose_os !== false) {
    honestyIssues.push("manifest bootable_general_purpose_os must be false");
  }
  if (manifest.status !== "PARTIAL_COMPLETE") {
    honestyIssues.push("manifest status must stay PARTIAL_COMPLETE until boot/hardware evidence exists");
  }
} else {
  honestyIssues.push("manifest.json is missing");
}

results.push({
  name: "claim-honesty",
  command: "manifest + capability report cross-check",
  exitCode: honestyIssues.length === 0 ? 0 : 1,
  passed: honestyIssues.length === 0,
  durationMs: 0,
  stdout: honestyIssues.length === 0 ? "claims match evidence" : "",
  stderr: honestyIssues.join("; "),
});

const passed = results.every((r) => r.passed);
console.log(
  JSON.stringify(
    {
      schema_version: "1.0.0",
      component: "aetherius-compute-kernel",
      verdict: passed ? "PASS" : "FAIL",
      results,
      capabilities,
      manifest,
    },
    null,
    2,
  ),
);
process.exitCode = passed ? 0 : 1;
