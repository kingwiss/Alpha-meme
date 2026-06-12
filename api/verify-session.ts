import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from "stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  if (!stripeSecret) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeSecret);

  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      res.json({ isPremium: true });
    } else {
      res.json({ isPremium: false });
    }
  } catch (e: any) {
    console.error("Session verification error:", e);
    res.status(500).json({ error: e.message });
  }
}
