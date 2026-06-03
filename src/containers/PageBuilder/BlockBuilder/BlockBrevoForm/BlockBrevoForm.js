import React, { useEffect, useRef } from 'react';
import css from './BlockBrevoForm.module.css';

const stripCodeFences = raw => {
  const fenceMatch = raw.match(/^```[\w]*\n?([\s\S]*?)```$/m);
  return fenceMatch ? fenceMatch[1].trim() : raw.trim();
};

const isIframeEmbed = html => /<iframe\s/i.test(html);

// Walks container for <script>/<link> nodes that innerHTML doesn't activate.
// Returns injected nodes so the caller can clean up on unmount.
function activateEmbedAssets(container) {
  const injected = [];

  // Stylesheets first to avoid FOUC
  container.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || document.querySelector(`link[href="${href}"]`)) return;
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    document.head.appendChild(el);
    injected.push(el);
  });

  // Scripts in DOM order
  container.querySelectorAll('script').forEach(script => {
    const el = document.createElement('script');
    if (script.src) {
      el.src = script.src;
      el.async = false; // preserve execution order
    } else {
      el.textContent = script.textContent;
    }
    document.head.appendChild(el);
    injected.push(el);
  });

  return injected;
}

const BlockBrevoForm = ({ blockId, text }) => {
  const wrapRef = useRef(null);
  const raw = text?.content || (typeof text === 'string' ? text : '');
  const html = stripCodeFences(raw);

  useEffect(() => {
    if (!wrapRef.current) return;

    if (isIframeEmbed(html)) {
      // Legacy iframe embed path
      const iframe = wrapRef.current.querySelector('iframe');
      if (iframe) {
        iframe.removeAttribute('height');
        iframe.removeAttribute('width');
        iframe.style.removeProperty('height');
        iframe.style.removeProperty('width');
        iframe.style.removeProperty('max-width');
      }

      // Forward-compatible: listen for postMessage in case Sibforms ever adds it
      const onMessage = e => {
        if (!e.data || typeof e.data !== 'object') return;
        const height = e.data.height || e.data.frameHeight;
        if (!height || !wrapRef.current) return;
        const iframeEl = wrapRef.current.querySelector('iframe');
        if (iframeEl) iframeEl.style.height = `${height}px`;
      };
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    } else {
      // Inline JS embed path — activate scripts and stylesheets
      const injected = activateEmbedAssets(wrapRef.current);
      return () => injected.forEach(el => el.parentNode?.removeChild(el));
    }
  }, []); // html is static per mount

  if (!html) return null;

  return (
    <div id={blockId} className={css.root}>
      <div ref={wrapRef} className={css.formWrap} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default BlockBrevoForm;
