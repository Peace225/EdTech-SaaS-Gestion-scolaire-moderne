import { Resend } from "resend"

export async function sendReceiptEmail({ to, invoiceId, amount, studentName, pdfBuffer }: {
  to: string, invoiceId: string, amount: number, studentName: string, pdfBuffer: Buffer
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("SIMULATION EMAIL ->", to, `Reçu ${invoiceId}`)
    return { simulated: true }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  
  return await resend.emails.send({
    from: "EdTech Scolaire <recu@edtech.ci>",
    to,
    subject: `Reçu de paiement ${amount.toLocaleString()} FCFA - ${studentName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>✓ Paiement confirmé</h2>
        <p>Bonjour,</p>
        <p>Le paiement de <b>${amount.toLocaleString()} FCFA</b> pour <b>${studentName}</b> a bien été reçu.</p>
        <p>Facture N° ${invoiceId.slice(0,8).toUpperCase()}</p>
        <p>Votre reçu PDF avec QR code est en pièce jointe.</p>
        <p>Vérification: ${process.env.NEXTAUTH_URL}/verify/${invoiceId}</p>
      </div>
    `,
    attachments: [
      { filename: `recu-${invoiceId.slice(0,8)}.pdf`, content: pdfBuffer }
    ]
  })
}
