export async function sendWhatsAppReceipt({ phone, invoiceId, amount, studentName }: {
  phone: string, invoiceId: string, amount: number, studentName: string
}) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  const message = `✅ EdTech Scolaire\nPaiement confirmé: ${amount.toLocaleString()} FCFA\nÉlève: ${studentName}\nReçu: ${process.env.NEXTAUTH_URL}/api/receipt/${invoiceId}\nVérif QR: ${process.env.NEXTAUTH_URL}/verify/${invoiceId}`

  if (!token || !phoneId) {
    console.log("SIMULATION WHATSAPP ->", phone, message)
    return { simulated: true }
  }

  // Formate numéro CI: 07... -> 22507...
  let cleanPhone = phone.replace(/\D/g, "")
  if (cleanPhone.startsWith("0")) cleanPhone = "225" + cleanPhone.slice(1)

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: { body: message }
    })
  })
  return await res.json()
}
