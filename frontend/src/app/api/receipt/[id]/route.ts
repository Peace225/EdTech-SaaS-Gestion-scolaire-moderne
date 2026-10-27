// src/app/api/receipt/[id]/route.ts
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getParentReceiptData } from "@/lib/parent-receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 46;
const RIGHT = 46;
const TEXT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;

const currency = (value: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
const date = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);

// Les polices PDF standard prennent en charge un jeu de caractères limité.
// Nettoyage explicite pour éviter une erreur sur les caractères Unicode.
function pdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");
}

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const chunks: string[] = [];
  let part = "";
  for (const char of word) {
    if (part && font.widthOfTextAtSize(part + char, size) > maxWidth) {
      chunks.push(part);
      part = char;
    } else {
      part += char;
    }
  }
  if (part) chunks.push(part);
  return chunks;
}

function wrap(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const parts = font.widthOfTextAtSize(word, size) <= maxWidth
      ? [word]
      : splitLongWord(word, font, size, maxWidth);
    for (const part of parts) {
      const next = line ? `${line} ${part}` : part;
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
        lines.push(line);
        line = part;
      } else {
        line = next;
      }
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}

async function buildReceiptPdf(
  data: Extract<Awaited<ReturnType<typeof getParentReceiptData>>, { kind: "ok" }>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Justificatif - Facture ${data.invoice.id}`);
  pdf.setSubject("Releve des paiements confirmes");
  pdf.setProducer("EdTech SaaS");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 58;

  function newPage() {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 55;
  }

  function ensureSpace(height: number) {
    if (y - height < 68) newPage();
  }

  function line(text: string, options: {
    font?: PDFFont;
    size?: number;
    color?: ReturnType<typeof rgb>;
    indent?: number;
    width?: number;
    leading?: number;
  } = {}) {
    const chosen = options.font ?? regular;
    const size = options.size ?? 10;
    const leading = options.leading ?? size + 5;
    const indent = options.indent ?? 0;
    const lines = wrap(text, chosen, size, options.width ?? TEXT_WIDTH - indent);
    ensureSpace(lines.length * leading + 4);
    for (const textLine of lines) {
      page.drawText(textLine, {
        x: LEFT + indent,
        y,
        size,
        font: chosen,
        color: options.color ?? rgb(0.18, 0.24, 0.34),
      });
      y -= leading;
    }
  }

  function separator() {
    ensureSpace(28);
    page.drawLine({
      start: { x: LEFT, y: y - 10 },
      end: { x: PAGE_WIDTH - RIGHT, y: y - 10 },
      thickness: 0.8,
      color: rgb(0.82, 0.87, 0.92),
    });
    y -= 29;
  }

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 18,
    width: PAGE_WIDTH,
    height: 18,
    color: rgb(0.08, 0.24, 0.43),
  });

  line("RELEVE DES PAIEMENTS CONFIRMES", {
    font: bold, size: 17, color: rgb(0.08, 0.24, 0.43), leading: 22,
  });
  line("Document informatif genere a partir des transactions enregistrees", {
    size: 9, color: rgb(0.38, 0.44, 0.52),
  });
  separator();

  line(`Facture : ${data.invoice.id}`, { font: bold, size: 10 });
  line(`Date d'emission : ${date(data.invoice.createdAt)}`);
  line(`Echeance : ${date(data.invoice.dueDate)}`);
  line(`Parent / tuteur : ${data.parent.name ?? data.parent.email ?? "Compte parent"}`);
  line(`Eleve / apprenant : ${data.invoice.student.user.name ?? data.invoice.student.user.email ?? "Apprenant"}`);
  line(`Classe / formation : ${data.invoice.student.class.name} (${data.invoice.student.class.level})`);
  separator();

  line(`Montant facture : ${currency(data.invoicedAmount)}`, { font: bold, size: 12 });
  line(`Paiements confirmes : ${currency(data.paidAmount)}`, {
    font: bold, size: 12, color: rgb(0.08, 0.46, 0.34),
  });
  line(`Solde restant : ${currency(data.remainingAmount)}`, {
    font: bold, size: 12,
    color: data.remainingAmount > 0 ? rgb(0.62, 0.33, 0.04) : rgb(0.08, 0.46, 0.34),
  });
  separator();

  line("DETAIL DES TRANSACTIONS CONFIRMEES", {
    font: bold, size: 11, color: rgb(0.08, 0.24, 0.43),
  });
  y -= 9;

  for (const [index, payment] of data.confirmedPayments.entries()) {
    ensureSpace(72);
    line(`${index + 1}. ${date(payment.createdAt)} - ${payment.provider}`, {
      font: bold, size: 10,
    });
    line(`Montant confirme : ${currency(payment.amount)}`, { size: 10, indent: 13 });
    line(`Reference : ${payment.providerTxId ?? payment.id}`, {
      size: 9, indent: 13, width: TEXT_WIDTH - 13,
    });
    y -= 10;
  }

  separator();
  line("Ce document n'est ni signe ni certifie par un etablissement.", {
    size: 9, color: rgb(0.48, 0.28, 0.2),
  });
  line("Il atteste uniquement les paiements enregistres avec le statut PAID.", {
    size: 9,
  });
  line(`Generation : ${date(new Date())}`, { size: 9 });

  // Les numéros de page sont ajoutés après création de toutes les pages.
  const pages = pdf.getPages();
  for (const [index, current] of pages.entries()) {
    const footer = `Page ${index + 1} / ${pages.length}`;
    current.drawText(footer, {
      x: PAGE_WIDTH - RIGHT - regular.widthOfTextAtSize(footer, 9),
      y: 31,
      size: 9,
      font: regular,
      color: rgb(0.50, 0.55, 0.62),
    });
  }

  return pdf.save();
}

export async function GET(request: Request, { params }: RouteProps): Promise<Response> {
  const { id } = await params;
  const data = await getParentReceiptData(id);
  const privateHeaders = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };

  if (data.kind === "unauthenticated") {
    return new Response("Authentification requise", {
      status: 401,
      headers: privateHeaders,
    });
  }

  if (data.kind !== "ok" || !data.hasReceipt) {
    return new Response("Justificatif indisponible", {
      status: 404,
      headers: privateHeaders,
    });
  }

  const bytes = await buildReceiptPdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = `justificatif-facture-${id}.pdf`;

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
