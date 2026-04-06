import "dotenv/config";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prepareAssets, renderFromScript } from "./pipeline.ts";
import { prepareBundle } from "./renderer.ts";
import { pickTopics } from "./script-generator.ts";
import type { ChatScript } from "./types.ts";

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

const BATCH_SIZE = 3;

async function main() {
  let topics = process.argv.slice(2).filter((t) => t.trim().length > 0);

  if (topics.length === 0) {
    console.log("🎲 No topics given — picking 3 random viral topics...");
    topics = await pickTopics(BATCH_SIZE);
    console.log(`   Topics: ${topics.map((t) => `"${t}"`).join(", ")}\n`);
  }

  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(__filename), "..");
  const homeDir = process.env.HOME || process.env.USERPROFILE || projectRoot;
  const videosDir = path.join(homeDir, "Desktop", "videfy videos");
  await mkdir(videosDir, { recursive: true });

  const runId = Date.now().toString(36);
  const count = topics.length;

  console.log(`💬 Vidify batch — generating ${count} chat videos`);
  const startedAt = Date.now();

  type Job = {
    n: number;
    topic: string;
    jobId: string;
    outputLocation: string;
  };

  const jobs: Job[] = topics.map((topic, i) => {
    const n = i + 1;
    const slug = slugify(topic) || "video";
    return {
      n,
      topic,
      jobId: `${runId}-${n}`,
      outputLocation: path.join(videosDir, `${slug}-${runId}-${n}.mp4`),
    };
  });

  // Phase 1: generate scripts + TTS
  const prepared = await Promise.allSettled(
    jobs.map((job) =>
      prepareAssets({
        topic: job.topic,
        jobId: job.jobId,
        projectRoot,
        onStage: (stage) => {
          const label =
            stage === "scripting" ? "writing script" : "generating voices";
          console.log(`   [${job.n}/${count}] ${label} — "${job.topic}"`);
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

  // Phase 3: render in batches of 2 to avoid overloading
  const RENDER_BATCH = 2;
  const renderByN = new Map<
    number,
    { ok: true; outputLocation: string } | { ok: false; error: string }
  >();

  for (let i = 0; i < readyToRender.length; i += RENDER_BATCH) {
    const batch = readyToRender.slice(i, i + RENDER_BATCH);
    const results = await Promise.allSettled(
      batch.map(({ job, script }) =>
        renderFromScript({
          script,
          projectRoot,
          serveUrl,
          outputLocation: job.outputLocation,
          onStage: () => {
            console.log(`   [${job.n}/${count}] rendering mp4 — "${job.topic}"`);
          },
        }).then((outputLocation) => ({ job, outputLocation })),
      ),
    );

    results.forEach((result, j) => {
      const job = batch[j].job;
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
  }

  console.log("");
  let successCount = 0;

  jobs.forEach((job) => {
    const early = earlyFailures.get(job.n);
    if (early) {
      console.error(`   [${job.n}/${count}] ✗ "${job.topic}" — ${early}`);
      return;
    }
    const r = renderByN.get(job.n);
    if (r && r.ok) {
      successCount++;
      const relPath = path.relative(projectRoot, r.outputLocation);
      console.log(`   [${job.n}/${count}] ✓ "${job.topic}" → ${relPath}`);
    } else if (r) {
      console.error(`   [${job.n}/${count}] ✗ "${job.topic}" — ${r.error}`);
    }
  });

  console.log(
    `\nDone in ${formatElapsed(Date.now() - startedAt)} — ${successCount}/${count} videos rendered.`,
  );

  if (successCount === 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
