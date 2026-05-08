'use strict';

const crypto = require('crypto');

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

const jobs = new Map();

function reArmCleanup(id, createdAt) {
  const ageMs = Date.now() - (createdAt || Date.now());
  const remaining = JOB_TTL_MS - ageMs;
  if (remaining <= 0) {
    jobs.delete(id);
    return;
  }
  setTimeout(() => {
    jobs.delete(id);
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
  return job;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, updates);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function hasActiveJob() {
  for (const job of jobs.values()) {
    if (job.status === 'processing') return true;
  }
  return false;
}

module.exports = { createJob, updateJob, getJob, hasActiveJob };
