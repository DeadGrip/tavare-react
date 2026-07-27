/**
 * POST /api/reserve
 * Receives a "Reserve an introduction" inquiry from the storefront, emails
 * the studio, and sends the visitor a confirmation. Runs as a Vercel
 * serverless function.
 *
 * Required env vars (set in Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY     — secret, from resend.com/api-keys
 *   RESERVE_TO_EMAIL    — inbox that should receive inquiries
 *   RESERVE_FROM_EMAIL  — sender address on a domain verified in Resend
 *                          (e.g. "Tavaré <reserve@tavarestudio.com>")
 *
 * NOTE — Resend sandbox restriction: until tavarestudio.com is verified
 * as a sending domain in Resend (Domains tab), the shared sandbox sender
 * "onboarding@resend.dev" can only deliver to YOUR OWN Resend account
 * email. That means the studio notification below will always work, but
 * the visitor confirmation will silently fail to reach anyone except your
 * own inbox until the domain is verified — this is expected, not a bug.
 */

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

async function sendEmail(apiKey, payload) {
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resendRes.ok) {
    const errText = await resendRes.text();
    throw new Error("Resend " + resendRes.status + ": " + errText);
  }
  return resendRes.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  }
  body = body || {};

  var name = (body.name || "").trim();
  var email = (body.email || "").trim();
  var piece = (body.piece || "").trim();
  var message = (body.message || "").trim();

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "That email address doesn't look right" });
  }

  var apiKey = process.env.RESEND_API_KEY;
  var toEmail = process.env.RESERVE_TO_EMAIL;
  var fromEmail = process.env.RESERVE_FROM_EMAIL || "Tavaré <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    console.error("Missing RESEND_API_KEY or RESERVE_TO_EMAIL env vars");
    return res.status(500).json({ error: "Reserve form isn't configured yet. Please email us directly." });
  }

  var studioHtml =
    "<h2>New introduction request</h2>" +
    "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>" +
    "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" +
    "<p><strong>Piece of interest:</strong> " + escapeHtml(piece || "—") + "</p>" +
    "<p><strong>Message:</strong><br>" + escapeHtml(message || "—").replace(/\n/g, "<br>") + "</p>";

  var visitorHtml =
    "<p>Hi " + escapeHtml(name) + ",</p>" +
    "<p>We've received your request about <strong>" + escapeHtml(piece || "a piece from the collection") + "</strong>. " +
    "Nothing has been charged — this is an introduction request, not an order.</p>" +
    "<p>We reply to every introduction within two business days with a private viewing time or full provenance details.</p>" +
    "<p>— Tavaré</p>";

  // 1. Notify the studio — this one is required; its failure fails the request.
  try {
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: "Tavaré — introduction request from " + name,
      html: studioHtml,
    });
  } catch (err) {
    console.error("Reserve handler error (studio notification):", err);
    return res.status(502).json({ error: "Couldn't send that request right now. Please try again shortly." });
  }

  // 2. Confirm to the visitor — best-effort. Under Resend's sandbox sender
  // this will fail for anyone but your own account email until a sending
  // domain is verified, so we log it but don't fail the visitor's request.
  try {
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [email],
      subject: "We've received your request — Tavaré",
      html: visitorHtml,
    });
  } catch (err) {
    console.error("Reserve handler warning (visitor confirmation not sent — expected until domain is verified):", err);
  }

  return res.status(200).json({ ok: true });
};
