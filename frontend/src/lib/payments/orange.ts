export async function createOrangeMoneyPayment({ amount, phone, invoiceId }: { amount: number, phone: string, invoiceId: string }) {
  // DOC Orange Money CI: https://developer.orange.com - API Collection
  // En prod tu dois avoir: Authorization, X-AUTH, etc.
  const ORANGE_AUTH = process.env.ORANGE_MONEY_TOKEN

  if (!ORANGE_AUTH) {
    console.log("Orange Money simulation", amount, phone)
    return { payToken: `om_sim_${Date.now()}`, status: "PENDING" }
  }

  const res = await fetch("https://api.orange.com/orange-money-webpay/ci/v1/webpayment", {
    method: "POST",
    headers: { Authorization: `Bearer ${ORANGE_AUTH}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_key: process.env.ORANGE_MERCHANT_KEY,
      currency: "OUV",
      order_id: invoiceId,
      amount,
      return_url: `${process.env.NEXTAUTH_URL}/parent/invoices`,
      cancel_url: `${process.env.NEXTAUTH_URL}/parent/invoices`,
      notif_url: `${process.env.NEXTAUTH_URL}/api/webhooks/orange`,
      lang: "fr",
      reference: invoiceId
    })
  })
  return await res.json()
}
