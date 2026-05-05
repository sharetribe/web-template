'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour
const FLUSH_DEBOUNCE_MS = 50;

const DEFAULT_PATH = path.join(os.tmpdir(), 'av-bulk-import-jobs.json');
const STORE_PATH = process.env.AV_BULK_IMPORT_JOBS_PATH || DEFAULT_PATH;

const jobs = new Map();
let flushTimer = null;
let flushInFlight = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    flushInFlight = (async () => {
      const snapshot = { jobs: Object.fromEntries(jobs) };
      const tmpPath = `${STORE_PATH}.tmp`;
      try {
        await fs.promises.writeFile(tmpPath, JSON.stringify(snapshot), 'utf8');
        await fs.promises.rename(tmpPath, STORE_PATH);
      } catch (err) {
        console.error('[jobStore] flush failed:', err);
      }
    })();
    await flushInFlight;
    flushInFlight = null;
  }, FLUSH_DEBOUNCE_MS);
  flushTimer.unref?.();
}

// Load on module init. Synchronous so jobs are ready before any request lands.
// Any job left in 'processing' was killed by the restart — mark it failed so
// the admin sees the interruption instead of a 404 / forever-spinner.
function loadJobsSync() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const loadedJobs = parsed?.jobs || {};
    let interrupted = 0;
    for (const [id, job] of Object.entries(loadedJobs)) {
      if (job.status === 'processing') {
        job.status = 'failed';
        job.error = { message: 'Interrupted by server restart', code: 'interrupted' };
        interrupted += 1;
      }
      jobs.set(id, job);
      reArmCleanup(id, job.createdAt);
    }
    if (interrupted > 0) {
      console.warn(`[jobStore] Restored ${jobs.size} jobs; ${interrupted} marked failed (interrupted).`);
      scheduleFlush();
    } else if (jobs.size > 0) {
      console.log(`[jobStore] Restored ${jobs.size} jobs from disk.`);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[jobStore] load failed, starting fresh:', err.message);
    }
  }
}

function reArmCleanup(id, createdAt) {
  const ageMs = Date.now() - (createdAt || Date.now());
  const remaining = JOB_TTL_MS - ageMs;
  if (remaining <= 0) {
    jobs.delete(id);
    scheduleFlush();
    return;
  }
  setTimeout(() => {
    jobs.delete(id);
    scheduleFlush();
  }, remaining).unref();
}

function createJob(total) {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'processing',
    total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
    results: [],
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  reArmCleanup(id, job.createdAt);
  scheduleFlush();
  return job;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, updates);
  scheduleFlush();
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

loadJobsSync();

module.exports = { createJob, updateJob, getJob, STORE_PATH };
