import { NavLink } from 'react-router-dom';

const Logomark = ({ size = 24 }) => (
  <svg className="logomark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 6 C10 11 10 21 16 26 C22 21 22 11 16 6 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="15" r="2" fill="currentColor" />
  </svg>
);

export default function Header() {
  return (
    <header className="site">
      <div className="wrap">
        <NavLink to="/" className="logo-link">
          <Logomark />
          <span className="logo">TAVAR<em>É</em></span>
        </NavLink>
        <nav className="main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
          <NavLink to="/catalogue" className={({ isActive }) => (isActive ? 'active' : '')}>Catalogue</NavLink>
          <NavLink to="/heritage" className={({ isActive }) => (isActive ? 'active' : '')}>Heritage</NavLink>
          <NavLink to="/reserve" className={({ isActive }) => (isActive ? 'active' : '')}>Reserve</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink>
        </nav>
        <NavLink to="/reserve" className="nav-cta">Reserve</NavLink>
      </div>
    </header>
  );
}

export { Logomark };
