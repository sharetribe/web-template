'use strict';

/**
 * Generates a "Getting Started with Archivo Vintach" PDF guide.
 * Returns a Promise<Buffer> suitable for base64-encoding as a Brevo attachment.
 */
function generateGettingStartedPDF({ firstName = 'Nuevo usuario' } = {}) {
  // Lazy-load PDFKit so it doesn't bloat the require cache on dynos that never
  // generate a PDF (e.g. workers that restart before any user/created event).
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BRAND = '#1a1a1a';
    const ACCENT = '#c8a97e';
    const GRAY = '#555555';
    const PAGE_WIDTH = 595.28;
    const CONTENT_WIDTH = PAGE_WIDTH - 100;

    // ─── Cover ────────────────────────────────────────────────────────────────
    doc
      .rect(0, 0, PAGE_WIDTH, 200)
      .fill(BRAND);

    doc
      .fillColor('#ffffff')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text('Archivo Vintach', 50, 70, { width: CONTENT_WIDTH, align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor(ACCENT)
      .text('Moda vintage con historia', 50, 115, { width: CONTENT_WIDTH, align: 'center' });

    doc
      .fontSize(11)
      .fillColor('#cccccc')
      .text(`Guía de inicio · ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 145, { width: CONTENT_WIDTH, align: 'center' });

    doc.moveDown(8);

    // ─── Welcome ──────────────────────────────────────────────────────────────
    doc
      .fillColor(BRAND)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(`¡Bienvenido/a, ${firstName}!`, { align: 'left' });

    doc.moveDown(0.5);

    doc
      .fillColor(GRAY)
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Gracias por unirte a Archivo Vintach, el mercado en línea de moda vintage de México. ' +
        'Esta guía te ayudará a sacar el máximo provecho de la plataforma, ya seas comprador, ' +
        'vendedor o ambos. ¡Estamos emocionados de tenerte aquí!',
        { align: 'justify', lineGap: 3 }
      );

    doc.moveDown(1.5);

    // ─── Divider ──────────────────────────────────────────────────────────────
    const divider = () => {
      doc
        .moveTo(50, doc.y)
        .lineTo(PAGE_WIDTH - 50, doc.y)
        .strokeColor(ACCENT)
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.8);
    };

    const sectionTitle = (title, color = BRAND) => {
      divider();
      doc
        .fillColor(color)
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(title);
      doc.moveDown(0.5);
      doc
        .fillColor(GRAY)
        .fontSize(11)
        .font('Helvetica');
    };

    const bullet = (text) => {
      doc
        .fillColor(ACCENT)
        .text('▸  ', { continued: true })
        .fillColor(GRAY)
        .text(text, { lineGap: 2 });
      doc.moveDown(0.3);
    };

    // ─── For Buyers ───────────────────────────────────────────────────────────
    sectionTitle('Para Compradores');

    bullet('Navega el catálogo desde la página principal o usa la búsqueda por categoría, talla, color y precio.');
    bullet('Guarda tus piezas favoritas con el botón de corazón para volver a ellas fácilmente.');
    bullet('Antes de comprar, revisa la descripción, las fotos y el perfil del vendedor.');
    bullet('Los pagos se procesan de forma segura con Stripe. Nunca compartimos tus datos de tarjeta.');
    bullet('¿Tienes dudas? Envía un mensaje al vendedor directamente desde el anuncio antes de comprar.');
    bullet('Una vez recibido tu pedido, marca la entrega como completada para liberar el pago al vendedor.');

    doc.moveDown(0.5);

    // ─── For Sellers ──────────────────────────────────────────────────────────
    sectionTitle('Para Vendedores');

    bullet('Crea tu primer anuncio desde el menú de usuario → "Tus anuncios" → "Nuevo anuncio".');
    bullet('Sube al menos 3 fotos con buena iluminación: frente, reverso y detalle de etiqueta.');
    bullet('Especifica talla, condición (Excelente / Buena / Aceptable) y cualquier desgaste visible.');
    bullet('Conecta tu cuenta de Stripe desde Configuración → Pagos para recibir tus ganancias.');
    bullet('Los pagos se acreditan automáticamente 2–3 días hábiles después de que el comprador confirme la entrega.');
    bullet('Responde mensajes rápido — los vendedores activos aparecen mejor posicionados en búsqueda.');

    doc.moveDown(0.5);

    // ─── Security ─────────────────────────────────────────────────────────────
    sectionTitle('Seguridad y Confianza');

    doc.text(
      'Archivo Vintach utiliza Stripe Connect para todos los pagos. Nunca transfieras dinero fuera ' +
      'de la plataforma ni compartas tus credenciales bancarias. Reporta cualquier actividad sospechosa ' +
      'al equipo de soporte.',
      { align: 'justify', lineGap: 3 }
    );

    doc.moveDown(1);

    // ─── Support ──────────────────────────────────────────────────────────────
    sectionTitle('¿Necesitas Ayuda?');

    doc.text('Estamos aquí para ti. Escríbenos:');
    doc.moveDown(0.4);

    doc
      .fillColor(ACCENT)
      .text('hola@archivovintach.com', { underline: true });

    doc.moveDown(0.3);

    doc
      .fillColor(GRAY)
      .text('O visítanos en: https://archivovintach.com');

    doc.moveDown(2);

    // ─── Footer ───────────────────────────────────────────────────────────────
    divider();

    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(
        '© ' + new Date().getFullYear() + ' Archivo Vintach · Este documento es de uso exclusivo del destinatario.',
        { align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generateGettingStartedPDF };
