const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

if (!BREVO_API_KEY || !BREVO_LIST_ID) {
  // Fail fast on boot if misconfigured.
  // eslint-disable-next-line no-console
  console.warn('Brevo env missing: BREVO_API_KEY and/or BREVO_LIST_ID');
}

// Basic email sanity check.
const isEmail = str =>
  typeof str === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());

router.post('/subscribe', async (req, res) => {
  try {
    const { email, hp } = req.body || {};

    // Honeypot: if hp has a value, it’s a bot.
    if (hp) return res.status(200).json({ ok: true });

    if (!isEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }

    // 1) Upsert the contact.
    {
      const r = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
          accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          updateEnabled: true,
        }),
      });

      // Brevo returns 201 for created, 204 for updated; 400-range includes already blacklisted, etc.
      if (r.status >= 400) {
        const j = await r.json().catch(() => ({}));
        return res.status(400).json({ ok: false, error: 'brevo_create_failed', details: j });
      }
    }

    // 2) Add to target list by email.
    {
      const r = await fetch(`https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
          accept: 'application/json',
        },
        body: JSON.stringify({ emails: [email.trim()] }),
      });

      if (r.status >= 400) {
        const j = await r.json().catch(() => ({}));
        return res.status(400).json({ ok: false, error: 'brevo_add_to_list_failed', details: j });
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

router.get('/health', (_req, res) => res.send('ok'));

module.exports = router;