export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, company, locations, contact, email, phone, message, type = 'enterprise' } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })

  const toEmail   = type === 'support' ? process.env.SUPPORT_EMAIL : process.env.CONTACT_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  const subject   = type === 'support' ? `SCENVY Support: ${name}` : `SCENVY Enterprise: ${company || name}`

  const html = `<h2>${subject}</h2><table>
    <tr><td><b>Name</b></td><td>${name}</td></tr>
    ${company ? `<tr><td><b>Company</b></td><td>${company}</td></tr>` : ''}
    ${locations ? `<tr><td><b>Locations</b></td><td>${locations}</td></tr>` : ''}
    ${contact ? `<tr><td><b>Contact</b></td><td>${contact}</td></tr>` : ''}
    <tr><td><b>Email</b></td><td>${email}</td></tr>
    ${phone ? `<tr><td><b>Phone</b></td><td>${phone}</td></tr>` : ''}
    ${message ? `<tr><td><b>Message</b></td><td>${message}</td></tr>` : ''}
  </table><p style="color:#666;font-size:12px">Sent via app.scenvy.de</p>`

  if (resendKey && toEmail) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'SCENVY <noreply@app.scenvy.de>', to: [toEmail], reply_to: email, subject, html })
      })
      if (!r.ok) throw new Error(await r.text())
      return res.status(200).json({ success: true, method: 'resend' })
    } catch (err) { console.error('Resend error:', err) }
  }

  console.log('Contact form submission (no email configured):', { name, company, email, type })
  return res.status(200).json({ success: true, method: 'logged', note: 'Set RESEND_API_KEY + CONTACT_EMAIL in Cloud Run environment variables' })
}
