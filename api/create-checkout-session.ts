import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from "stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  if (!stripeSecret) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY not configured on server." });
  }

  const stripe = new Stripe(stripeSecret);

  try {
    const { uid, username } = req.body || {};
    
    let appUrl = process.env.APP_URL 
      || req.headers.origin 
      || (req.headers.referer ? new URL(req.headers.referer).origin : null);
      
    if (!appUrl) {
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
         appUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      } else if (process.env.VERCEL_URL) {
         appUrl = `https://${process.env.VERCEL_URL}`;
      } else {
         appUrl = 'http://localhost:3000';
      }
    }
    
    if (appUrl.endsWith('/')) {
      appUrl = appUrl.slice(0, -1);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium Access (1 Week)",
              description: "Unlock all the best coins on the market.",
            },
            unit_amount: 499, // $4.99
            recurring: {
              interval: "week",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?payment=cancel`,
      client_reference_id: uid, 
    });

    res.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe error:", e);
    res.status(500).json({ error: e.message });
  }
}
