import Stripe from 'stripe'

let stripeClient = null

function getStripeClient(customKey) {
  const key = customKey || process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient || stripeClient._secretKey !== key) {
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' })
    stripeClient._secretKey = key
  }
  return stripeClient
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const urlPath = req.url || ''
  const action = req.query?.action || req.body?.action || (
    urlPath.includes('/checkout') ? 'create-checkout-session' :
    urlPath.includes('/portal') ? 'create-portal-session' :
    urlPath.includes('/webhook') ? 'webhook' :
    urlPath.includes('/status') ? 'status' : 'status'
  )

  const apiKey = process.env.STRIPE_SECRET_KEY || req.body?.stripeSecretKey || ''
  const stripe = getStripeClient(apiKey)

  // STATUS CHECK
  if (action === 'status') {
    return res.status(200).json({
      configured: !!stripe,
      hasSecretKey: !!apiKey,
      mode: apiKey.startsWith('sk_live') ? 'live' : apiKey.startsWith('sk_test') ? 'test' : 'demo',
      webhookUrl: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'scenvy.de'}/api/stripe/webhook`
    })
  }

  // CREATE CHECKOUT SESSION
  if (action === 'create-checkout-session') {
    const {
      tenantId = 'tenant-demo-1',
      plan = 'pro',
      billingInterval = 'monthly',
      customPrice = null,
      customerEmail = 'kunden@scenvy.de',
      clientName = 'Trattoria Bella',
      successUrl = `${req.headers.origin || 'https://scenvy.de'}/dashboard?stripe_success=true&plan=${plan}`,
      cancelUrl = `${req.headers.origin || 'https://scenvy.de'}/dashboard?stripe_cancel=true`
    } = req.body || {}

    // Calculate plan amount in cents
    const basePrices = {
      starter: billingInterval === 'yearly' ? 2400 : 2900,
      pro: billingInterval === 'yearly' ? 7900 : 8900,
      enterprise: billingInterval === 'yearly' ? 19900 : 24900
    }
    const amountInCents = customPrice ? Math.round(customPrice * 100) : (basePrices[plan] || 8900)

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'sepa_debit'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `SCENVY ${plan.toUpperCase()} Plan — ${clientName}`,
                  description: `Nutzungslizenz & KI-Reels für ${clientName} (${billingInterval === 'yearly' ? 'Jährlich' : 'Monatlich'})`,
                },
                unit_amount: amountInCents,
                recurring: {
                  interval: billingInterval === 'yearly' ? 'year' : 'month'
                }
              },
              quantity: 1
            }
          ],
          mode: 'subscription',
          customer_email: customerEmail,
          client_reference_id: tenantId,
          metadata: {
            tenantId,
            plan,
            billingInterval,
            clientName
          },
          success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl
        })

        return res.status(200).json({
          success: true,
          sessionId: session.id,
          url: session.url,
          mode: 'stripe'
        })
      } catch (err) {
        console.warn('Stripe checkout API notice:', err?.message)
      }
    }

    // Demo mode fallback if Stripe key is not configured or in sandbox testing
    const demoCheckoutUrl = `${successUrl}&demo_checkout=success&tenant=${tenantId}&plan=${plan}&amount=${(amountInCents/100).toFixed(2)}`
    return res.status(200).json({
      success: true,
      sessionId: `demo_session_${Date.now()}`,
      url: demoCheckoutUrl,
      mode: 'demo_simulated',
      message: 'Stripe Test-Simulation aktiv (Kein aktiver sk_live Key hinterlegt).'
    })
  }

  // CREATE PORTAL SESSION
  if (action === 'create-portal-session') {
    const {
      customerId,
      tenantId = 'tenant-demo-1',
      returnUrl = `${req.headers.origin || 'https://scenvy.de'}/dashboard`
    } = req.body || {}

    if (stripe && customerId) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl
        })
        return res.status(200).json({
          success: true,
          url: portalSession.url,
          mode: 'stripe'
        })
      } catch (err) {
        console.warn('Stripe portal API error:', err?.message)
      }
    }

    // Demo portal fallback
    return res.status(200).json({
      success: true,
      url: `${returnUrl}?portal_demo=active&tenant=${tenantId}`,
      mode: 'demo_simulated',
      message: 'Demo Customer Portal aufgerufen'
    })
  }

  // WEBHOOK HANDLER
  if (action === 'webhook') {
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event = req.body

    if (stripe && webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      } catch (err) {
        console.error(`Webhook Signature Verification Error: ${err.message}`)
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }
    }

    console.log(`🔔 Received Stripe Webhook Event: ${event.type || 'simulated'}`)

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log(`✅ Payment received for tenant: ${session.client_reference_id}`)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const sub = event.data.object
        console.log(`ℹ️ Subscription updated: ${sub.id}, status: ${sub.status}`)
        break
      default:
        break
    }

    return res.status(200).json({ received: true })
  }

  return res.status(400).json({ error: `Unknown Stripe action: ${action}` })
}
