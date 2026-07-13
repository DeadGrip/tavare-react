export default function Contact() {
  return (
    <div className="wrap">
      <div className="section-head">
        <div className="eyebrow">Contact</div>
        <h2>Get in touch</h2>
      </div>
      <div className="contact-grid">
        <div>
          <div className="contact-item">
            <span className="eyebrow">Email</span>
            <p><a href="mailto:studio@tavarestudio.com">studio@tavarestudio.com</a></p>
          </div>
          <div className="contact-item">
            <span className="eyebrow">Workshop</span>
            <p>Design and production team, India — full address to follow once Series I is confirmed.</p>
          </div>
          <div className="contact-item">
            <span className="eyebrow">Response time</span>
            <p>We reply to reservation and press enquiries within two working days.</p>
          </div>
        </div>
        <div>
          <div className="contact-item">
            <span className="eyebrow">Follow along</span>
            <p>Instagram and newsletter links go here once the accounts are live.</p>
          </div>
          <div className="contact-item">
            <span className="eyebrow">Wholesale &amp; press</span>
            <p>Reach out by email — we're a small team reviewing enquiries by hand for now.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
