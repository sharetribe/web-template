function labelsToStr(labels = {}) {
  const parts = Object.entries(labels).map(([k, v]) => `${k}="${String(v)}"`);
  return parts.length ? `{${parts.join(',')}}` : '';
}

function metric(name, labels) {
  if (process.env.METRICS_LOG === '1') {
    // e.g. [metrics] sms_attempt{role="lender"} 1
    console.log(`[metrics] ${name}${labelsToStr(labels)} 1`);
  }
}

module.exports = {
  attempt: (role) => metric('sms_attempt', { role }),
  sent:    (role) => metric('sms_sent', { role }),
  failed:  (role, code) => metric('sms_failed', { role, code }),
};
