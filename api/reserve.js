/**
 * POST /api/reserve
 * Receives a "Reserve an introduction" inquiry from the storefront and
 * emails it via Resend. Runs as a Vercel serverless function.
 *
 * Required env vars (set in Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY     — secret, from resend.com/api-keys
 *   RESERVE_TO_EMAIL    — inbox that should receive inquiries
 *   RESERVE_FROM_EMAIL  — sender address on a domain verified in Resend
 *                          (e.g. "Tavaré <reserve@tavarestudio.com>")
 */

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
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

  var html =
    "<h2>New introduction request</h2>" +
    "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>" +
    "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" +
    "<p><strong>Piece of interest:</strong> " + escapeHtml(piece || "—") + "</p>" +
    "<p><strong>Message:</strong><br>" + escapeHtml(message || "—").replace(/\n/g, "<br>") + "</p>";

  try {
    var resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: "Tavaré — introduction request from " + name,
        html: html,
      }),
    });

    if (!resendRes.ok) {
      var errText = await resendRes.text();
      console.error("Resend error:", resendRes.status, errText);
      return res.status(502).json({ error: "Couldn't send that request right now. Please try again shortly." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Reserve handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
