'use strict';

const fetch = require('node-fetch');
const { generateGettingStartedPDF } = require('./pdfGenerator');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'hola@archivovintach.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Archivo Vintach';
const MARKETPLACE_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL || 'https://archivovintach.com';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Sends a welcome email with the Getting Started PDF attached.
 * @param {{ email: string, firstName: string, lastName: string }} user
 */
async function sendWelcomeEmail({ email, firstName, lastName }) {
  if (!BREVO_API_KEY) {
    console.warn('[welcomeEmailService] BREVO_API_KEY not set — skipping welcome email');
    return;
  }

  const pdfBuffer = await generateGettingStartedPDF({ firstName });
  const pdfBase64 = pdfBuffer.toString('base64');

  const safeFirstName = escapeHtml(firstName || 'Usuario');
  const safeMarketplaceUrl = escapeHtml(MARKETPLACE_URL);
  const safeSenderEmail = escapeHtml(SENDER_EMAIL);

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1a1a1a; padding: 40px 30px; text-align: center;">
        <h1 style="color: #c8a97e; margin: 0; font-size: 28px;">Archivo Vintach</h1>
        <p style="color: #cccccc; margin: 8px 0 0; font-size: 13px;">Moda vintage con historia</p>
      </div>

      <div style="padding: 40px 30px;">
        <h2 style="font-size: 22px; margin-top: 0;">¡Hola, ${safeFirstName}! 👋</h2>

        <p style="line-height: 1.7; color: #555;">
          Estamos encantados de tenerte en <strong>Archivo Vintach</strong>. Tu cuenta ya está activa
          y lista para explorar cientos de piezas de moda vintage únicas.
        </p>

        <p style="line-height: 1.7; color: #555;">
          Te adjuntamos nuestra <strong>Guía de Inicio</strong> en PDF para que saques el máximo
          provecho de la plataforma desde el primer día.
        </p>

        <div style="text-align: center; margin: 36px 0;">
          <a href="${safeMarketplaceUrl}/s"
             style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none;
                    padding: 14px 28px; margin: 6px; font-size: 14px; border-radius: 3px;">
            Explorar el catálogo
          </a>
          <a href="${safeMarketplaceUrl}/l/new"
             style="display: inline-block; background: #c8a97e; color: #1a1a1a; text-decoration: none;
                    padding: 14px 28px; margin: 6px; font-size: 14px; border-radius: 3px;">
            Publicar mi primer anuncio
          </a>
        </div>

        <p style="line-height: 1.7; color: #555;">
          Si tienes alguna pregunta no dudes en escribirnos a
          <a href="mailto:${safeSenderEmail}" style="color: #c8a97e;">${safeSenderEmail}</a>.
        </p>

        <p style="color: #555;">¡Bienvenido/a al archivo!</p>
        <p style="color: #555;">— El equipo de Archivo Vintach</p>
      </div>

      <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; font-size: 11px; color: #999;">
        © ${new Date().getFullYear()} Archivo Vintach ·
        <a href="${safeMarketplaceUrl}" style="color: #999;">archivovintach.com</a>
      </div>
    </div>
  `;

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email, name: `${firstName} ${lastName}`.trim() }],
    subject: `¡Bienvenido/a a Archivo Vintach, ${firstName}!`,
    htmlContent: htmlBody,
    attachment: [
      {
        name: 'Guia-de-Inicio-ArchivoVintach.pdf',
        content: pdfBase64,
      },
    ],
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error('[welcomeEmailService] Brevo API error:', response.status, body);
    throw new Error(`Brevo transactional email failed: ${response.status}`);
  }

  console.log(`[welcomeEmailService] Welcome email sent to ${email}`);
}

module.exports = { sendWelcomeEmail };
