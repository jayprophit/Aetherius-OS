import { startHive } from "./hive/server.mjs";
import { startRouter } from "./model-router/server.mjs";

const hive = startHive();
const router = startRouter();

console.log("");
console.log("Aetherius orchestration is up.");
console.log(`  hive:   http://127.0.0.1:${hive.port}  (messages, tasks, memory)`);
console.log(`  a2a:    http://127.0.0.1:${hive.port}/a2a`);
console.log(`  router: http://127.0.0.1:${router.port}/v1  (free models only)`);
console.log("");
console.log("Register an agent:");
console.log(`  node orchestration/hive/cli.mjs register --id kilo --kind kilo --model auto`);
console.log("");

function shutdown() {
  console.log("[orchestration] shutting down");
  hive.close();
  router.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
