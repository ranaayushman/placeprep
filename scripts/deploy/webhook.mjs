/**
 * Lightweight GitHub webhook server for auto-deploy.
 * Runs on port 9000 (configurable via PORT env var).
 *
 * Setup:
 *   1. Set WEBHOOK_SECRET to any strong random string (same value you enter in GitHub).
 *   2. Run this with: node scripts/deploy/webhook.mjs
 *   3. Keep it alive with: pm2 start scripts/deploy/webhook.mjs --name deploy-hook
 *
 * GitHub → repo Settings → Webhooks → Add webhook:
 *   Payload URL : http://<your-server-ip>:9000/deploy
 *   Content-type: application/json
 *   Secret      : <WEBHOOK_SECRET>
 *   Events      : Just the push event
 */

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const PORT = Number(process.env.PORT ?? 9000);
const SECRET = process.env.WEBHOOK_SECRET ?? "";
const BRANCH = process.env.DEPLOY_BRANCH ?? "main";
// Absolute path to the repo root on the server.
const REPO_DIR = process.env.REPO_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "../..");

if (!SECRET) {
  console.error("WEBHOOK_SECRET is not set — requests will be rejected.");
}

function verify(secret, body, sigHeader) {
  if (!secret || !sigHeader) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader));
  } catch {
    return false;
  }
}

function deploy(callback) {
  const script = join(REPO_DIR, "scripts/deploy/redeploy.sh");
  execFile("bash", [script], { cwd: REPO_DIR, timeout: 10 * 60 * 1000 }, callback);
}

const server = createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/deploy") {
    res.writeHead(404).end("Not found");
    return;
  }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const sig = req.headers["x-hub-signature-256"] ?? "";

    if (!verify(SECRET, body, sig)) {
      console.warn("[webhook] Invalid signature — rejected");
      res.writeHead(401).end("Unauthorized");
      return;
    }

    let event;
    try {
      event = JSON.parse(body.toString());
    } catch {
      res.writeHead(400).end("Bad JSON");
      return;
    }

    const ref = event.ref ?? "";
    if (ref !== `refs/heads/${BRANCH}`) {
      console.log(`[webhook] Ignored push to ${ref}`);
      res.writeHead(200).end(`Ignored (not ${BRANCH})`);
      return;
    }

    console.log(`[webhook] Push to ${BRANCH} — deploying…`);
    res.writeHead(202).end("Deploying");

    deploy((err, stdout, stderr) => {
      if (err) {
        console.error("[deploy] FAILED:", err.message);
        console.error(stderr);
      } else {
        console.log("[deploy] Done.");
        if (stdout) console.log(stdout);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Listening on port ${PORT} — watching branch: ${BRANCH}`);
});

