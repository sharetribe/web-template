'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// Heroku note: os.tmpdir() (/tmp) is ephemeral — wiped on dyno restart.
// On restart the cursor falls back to a 10-minute lookback (handled in eventPoller.js).
// Multi-dyno deployments: each dyno maintains its own cursor and will duplicate
// notifications. Single-dyno operation is assumed for Archivo Vintach.
// Override with AV_EVENT_POLLER_CURSOR_PATH for a persistent path (external mount).
const DEFAULT_PATH = path.join(os.tmpdir(), 'av-event-poller-cursor.json');
const CURSOR_PATH = process.env.AV_EVENT_POLLER_CURSOR_PATH || DEFAULT_PATH;

const EMPTY = { lastSequenceId: null, recentEventIds: [] };

async function loadCursor() {
  try {
    const raw = await fs.promises.readFile(CURSOR_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      lastSequenceId: typeof parsed.lastSequenceId === 'number' ? parsed.lastSequenceId : null,
      recentEventIds: Array.isArray(parsed.recentEventIds) ? parsed.recentEventIds : [],
    };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[eventPollerCursor] load failed, starting fresh:', err.message);
    }
    return { ...EMPTY };
  }
}

async function saveCursor(state) {
  const payload = JSON.stringify({
    lastSequenceId: state.lastSequenceId ?? null,
    recentEventIds: Array.isArray(state.recentEventIds) ? state.recentEventIds : [],
  });
  const tmpPath = `${CURSOR_PATH}.tmp`;
  try {
    await fs.promises.writeFile(tmpPath, payload, 'utf8');
    await fs.promises.rename(tmpPath, CURSOR_PATH);
  } catch (err) {
    console.error('[eventPollerCursor] save failed:', err);
  }
}

module.exports = { loadCursor, saveCursor, CURSOR_PATH };
