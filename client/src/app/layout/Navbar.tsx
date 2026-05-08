type NavbarProps = {
  logoSrc: string;
};

function Navbar({ logoSrc }: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="top-navbar__brand">
        <a
          href="#dashboard"
          aria-label="Go to dashboard"
          style={{ display: 'contents', cursor: 'pointer' }}
        >
          <img
            src={logoSrc}
            alt="Escali Insight"
            className="brand-logo"
          />
        </a>
      </div>
    </header>
  );
}

export default Navbar;
