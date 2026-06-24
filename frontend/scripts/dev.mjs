import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendDir, "..");

const currentPid = process.pid;

function normalizePath(value) {
  return path.resolve(value).replaceAll("/", "\\").toLowerCase();
}

function normalizeCommand(value) {
  return value.replaceAll("/", "\\").toLowerCase();
}

function parseJsonProcessList(output) {
  const trimmed = output.trim();
  if (!trimmed) return [];

  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function getWindowsProcesses() {
  const command = [
    "$ErrorActionPreference = 'SilentlyContinue';",
    "Get-CimInstance Win32_Process |",
    "Select-Object ProcessId,ParentProcessId,CommandLine |",
    "ConvertTo-Json -Compress -Depth 2",
  ].join(" ");

  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );

  return parseJsonProcessList(output).map((processInfo) => ({
    pid: Number(processInfo.ProcessId),
    ppid: Number(processInfo.ParentProcessId),
    command: processInfo.CommandLine ?? "",
  }));
}

function getUnixProcesses() {
  const output = execFileSync("ps", ["-eo", "pid=,ppid=,args="], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });

  return output
    .split("\n")
    .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      command: match[3],
    }));
}

function getProcesses() {
  return process.platform === "win32" ? getWindowsProcesses() : getUnixProcesses();
}

function isNextDevProcess(processInfo) {
  if (!processInfo.command || processInfo.pid === currentPid) return false;

  const command = normalizeCommand(processInfo.command);
  const nextBin = normalizePath(path.join(repoRoot, "node_modules", ".bin", "next"));
  const nextDistBin = normalizePath(
    path.join(repoRoot, "node_modules", "next", "dist", "bin", "next"),
  );
  const nextStartServer = normalizePath(
    path.join(repoRoot, "node_modules", "next", "dist", "server", "lib", "start-server.js"),
  );
  const runsNextCli =
    (command.includes(nextBin) || command.includes(nextDistBin)) &&
    /(?:^|\s)dev(?:\s|$)/.test(command);
  const runsNextDevServer = command.includes(nextStartServer);

  return runsNextCli || runsNextDevServer;
}

function getProcessTree(processes, rootPid) {
  const childrenByParent = new Map();

  for (const processInfo of processes) {
    const children = childrenByParent.get(processInfo.ppid) ?? [];
    children.push(processInfo);
    childrenByParent.set(processInfo.ppid, children);
  }

  const tree = [];
  const queue = [rootPid];

  while (queue.length > 0) {
    const pid = queue.shift();
    const children = childrenByParent.get(pid) ?? [];

    for (const child of children) {
      tree.push(child);
      queue.push(child.pid);
    }
  }

  return tree;
}

function getRootCandidates(processes, candidates) {
  const candidateIds = new Set(candidates.map((processInfo) => processInfo.pid));

  return candidates.filter((processInfo) => !candidateIds.has(processInfo.ppid));
}

function killWindowsProcessTree(pid) {
  try {
    execFileSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8",
      stdio: "ignore",
    });
  } catch {
    // The process may have already exited while we were collecting the list.
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function killUnixProcesses(processes, roots) {
  const targets = new Map();

  for (const root of roots) {
    targets.set(root.pid, root);
    for (const child of getProcessTree(processes, root.pid)) {
      targets.set(child.pid, child);
    }
  }

  const orderedTargets = [...targets.values()].sort((a, b) => b.ppid - a.ppid);

  for (const processInfo of orderedTargets) {
    try {
      process.kill(processInfo.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  }

  await sleep(800);

  for (const processInfo of orderedTargets) {
    if (!isProcessRunning(processInfo.pid)) continue;

    try {
      process.kill(processInfo.pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function stopPreviousDevServers() {
  const processes = getProcesses();
  const candidates = processes.filter(isNextDevProcess);

  if (candidates.length === 0) return;

  const roots = getRootCandidates(processes, candidates);
  const pids = [...new Set(candidates.map((processInfo) => processInfo.pid))].sort(
    (a, b) => a - b,
  );

  console.log(`[dev] Stopping previous Next dev process(es): ${pids.join(", ")}`);

  if (process.platform === "win32") {
    for (const root of roots) {
      killWindowsProcessTree(root.pid);
    }
  } else {
    await killUnixProcesses(processes, roots);
  }

  await sleep(500);
}

function getNextCommand() {
  const commandPath = path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "next.exe" : "next",
  );

  return existsSync(commandPath) ? commandPath : "next";
}

async function main() {
  await stopPreviousDevServers();

  const child = spawn(getNextCommand(), ["dev"], {
    cwd: frontendDir,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(0);
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`[dev] Failed to start Next dev server: ${error.message}`);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  process.exit(1);
});
