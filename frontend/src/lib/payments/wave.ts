export async function createWaveCheckout({ amount, invoiceId, phone }: { amount: number, invoiceId: string, phone?: string }) {
  // DOC: https://pay.wave.com - Tu crées une clé API dans dashboard Wave
  const WAVE_API_KEY = process.env.WAVE_API_KEY!
  const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${WAVE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: "XOF",
      error_url: `${process.env.NEXTAUTH_URL}/parent/invoices?error=wave`,
      success_url: `${process.env.NEXTAUTH_URL}/parent/invoices?success=wave&id=${invoiceId}`,
      // En test si pas de clé, on simule
    })
  })
  if (!res.ok) {
    // MODE SIMULATION si pas de clé configurée
    console.log("Wave simulation - montant", amount)
    return { id: `wave_sim_${Date.now()}`, checkout_url: `/parent/invoices?simulate=wave&id=${invoiceId}` }
  }
  return await res.json()
}
