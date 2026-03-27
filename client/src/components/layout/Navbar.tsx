type NavbarProps = {
  logoSrc: string;
};

function Navbar({ logoSrc }: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="top-navbar__brand">
        <img
          src={logoSrc}
          alt="Escali Insight"
          className="brand-logo"
        />
      </div>
    </header>
  );
}

export default Navbar;
