import { Link } from 'react-router-dom';
import { Logomark } from './Header.jsx';

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-link" style={{ marginBottom: 2 }}>
              <Logomark size={20} />
              <span className="logo" style={{ fontSize: 20 }}>TAVAR<em>É</em></span>
            </div>
            <p>One set of jewellery, worn four ways. Handcrafted in India in numbered, limited series, for Europe.</p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/catalogue">Catalogue</Link>
            <Link to="/reserve">Reserve Series I</Link>
          </div>
          <div className="footer-col">
            <h4>Studio</h4>
            <Link to="/heritage">Heritage &amp; craft</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Info</h4>
            <Link to="/heritage">Shipping to Europe</Link>
            <Link to="/contact">Returns</Link>
            <Link to="/contact">Privacy policy</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Series I limited to 50 numbered sets · placeholder name, verify trademark before use</p>
          <Link to="/studio" className="footer-studio-link">Studio access</Link>
        </div>
      </div>
    </footer>
  );
}
