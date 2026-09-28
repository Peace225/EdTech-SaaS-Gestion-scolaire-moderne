// src/app/api/receipt/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const parentId = (session.user as any).id
  const role = (session.user as any).role

  // Résolution des paramètres (requis dans les versions récentes de Next.js)
  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ...(role === "PARENT" ? { parentId } : {})
    },
    include: {
      student: { include: { user: true, class: true } },
      parent: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  })

  if (!invoice) return new Response("Not found", { status: 404 })
  if (invoice.status !== "PAID") return new Response("Facture non payée", { status: 400 })

  const payment = invoice.payments[0]
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify/${invoice.id}`

  // QR code
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300 })
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64")

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const qrImage = await pdfDoc.embedPng(qrImageBytes)

  const drawText = (text: string, x: number, y: number, size = 10, bold = false) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) })
  }

  // Header
  drawText("EDTECH SCOLAIRE - ABIDJAN", 50, 790, 14, true)
  drawText("Reçu de paiement officiel", 50, 770, 10)
  drawText(`N° ${invoice.id.slice(0, 8).toUpperCase()}`, 400, 790, 10, true)

  // Ligne
  page.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0, 0, 0) })

  // Infos
  drawText(`Élève: ${invoice.student.user.name}`, 50, 720, 11, true)
  drawText(`Classe: ${invoice.student.class.name} - ${invoice.student.class.level}`, 50, 700)
  drawText(`Parent: ${invoice.parent.email}`, 50, 680)
  drawText(`Montant payé: ${invoice.amount.toLocaleString()} FCFA`, 50, 650, 12, true)
  drawText(`Méthode: ${payment?.provider || "ESPECES"}`, 50, 630)
  drawText(`Transaction: ${payment?.providerTxId || payment?.id || "N/A"}`, 50, 610, 8)
  drawText(`Date paiement: ${new Date(payment?.createdAt || new Date()).toLocaleString("fr-CI")}`, 50, 590)
  drawText(`Statut: PAYÉ`, 50, 570, 11, true)

  // QR
  page.drawImage(qrImage, { x: 380, y: 500, width: 140, height: 140 })
  drawText("Scanner pour vérifier", 390, 485, 8)
  drawText(verifyUrl, 50, 460, 6)

  // Footer
  drawText("Document généré automatiquement - Portail Parents Sécurisé", 50, 40, 7)
  drawText("Ce reçu fait foi de paiement. Conservez-le.", 50, 28, 7)

  const pdfBytes = await pdfDoc.save()
  // Conversion explicite en Buffer pour satisfaire le type BodyInit de Response
  const pdfBuffer = Buffer.from(pdfBytes)

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=recu-${invoice.id.slice(0, 8)}.pdf`
    }
  })
}