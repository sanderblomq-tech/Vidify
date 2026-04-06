import "dotenv/config";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prepareAssets, renderFromScript } from "./pipeline.ts";
import { prepareBundle } from "./renderer.ts";
import type { ChatScript } from "./types.ts";

const BATCH_SIZE = 3;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function formatElapsed(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function main() {
  const topic = process.argv.slice(2).join(" ").trim();
  if (!topic) {
    console.error('Usage: npm run generate -- "<topic>"');
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(__filename), "..");
  const homeDir = process.env.HOME || process.env.USERPROFILE || projectRoot;
  const videosDir = path.join(homeDir, "Desktop", "videfy videos");
  await mkdir(videosDir, { recursive: true });

  const slug = slugify(topic) || "video";
  const runId = Date.now().toString(36);

  console.log(`💬 Vidify — generating ${BATCH_SIZE} chat videos about "${topic}"`);
  const startedAt = Date.now();

  type Job = {
    n: number;
    jobId: string;
    outputLocation: string;
  };

  const jobs: Job[] = Array.from({ length: BATCH_SIZE }, (_, i) => {
    const n = i + 1;
    const jobId = `${runId}-${n}`;
    return {
      n,
      jobId,
      outputLocation: path.join(videosDir, `${slug}-${runId}-${n}.mp4`),
    };
  });

  // Phase 1: generate scripts + TTS
  const prepared = await Promise.allSettled(
    jobs.map((job) =>
      prepareAssets({
        topic,
        jobId: job.jobId,
        projectRoot,
        onStage: (stage) => {
          const label =
            stage === "scripting" ? "writing script" : "generating voices";
          console.log(`   [${job.n}/${BATCH_SIZE}] ${label}`);
        },
      }).then((script) => ({ job, script })),
    ),
  );

  const readyToRender: { job: Job; script: ChatScript }[] = [];
  const earlyFailures = new Map<number, string>();

  prepared.forEach((result, i) => {
    const job = jobs[i];
    if (result.status === "fulfilled") {
      readyToRender.push(result.value);
    } else {
      const err =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      earlyFailures.set(job.n, err);
    }
  });

  // Phase 2: bundle once
  console.log("   bundling Remotion composition...");
  const serveUrl = await prepareBundle(projectRoot);

  // Phase 3: render all
  const renders = await Promise.allSettled(
    readyToRender.map(({ job, script }) =>
      renderFromScript({
        script,
        serveUrl,
        outputLocation: job.outputLocation,
        onStage: () => {
          console.log(`   [${job.n}/${BATCH_SIZE}] rendering mp4`);
        },
      }).then((outputLocation) => ({ job, outputLocation })),
    ),
  );

  console.log("");
  let successCount = 0;
  const renderByN = new Map<
    number,
    | { ok: true; outputLocation: string }
    | { ok: false; error: string }
  >();
  renders.forEach((result, i) => {
    const job = readyToRender[i].job;
    if (result.status === "fulfilled") {
      renderByN.set(job.n, {
        ok: true,
        outputLocation: result.value.outputLocation,
      });
    } else {
      const err =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      renderByN.set(job.n, { ok: false, error: err });
    }
  });

  jobs.forEach((job) => {
    const early = earlyFailures.get(job.n);
    if (early) {
      console.error(`   [${job.n}/${BATCH_SIZE}] ✗ ${early}`);
      return;
    }
    const r = renderByN.get(job.n);
    if (r && r.ok) {
      successCount++;
      const relPath = path.relative(projectRoot, r.outputLocation);
      console.log(`   [${job.n}/${BATCH_SIZE}] ✓ ${relPath}`);
    } else if (r) {
      console.error(`   [${job.n}/${BATCH_SIZE}] ✗ ${r.error}`);
    }
  });

  console.log(
    `\nDone in ${formatElapsed(Date.now() - startedAt)} — ${successCount}/${BATCH_SIZE} videos rendered.`,
  );

  if (successCount === 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
