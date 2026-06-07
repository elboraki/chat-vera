export default function Footer({ variant = "auth" }) {
  const year = new Date().getFullYear();

  if (variant === "sidebar") {
    return (
      <div className="sidebar-footer">
        <span>Built by</span>
        <span className="footer-author">Younes EL BORAKI</span>
      </div>
    );
  }

  return (
    <footer className="auth-footer">
      <div className="auth-footer-line">
        Built with <span className="heart">♥</span> by{" "}
        <span className="footer-author">Younes EL BORAKI</span>
      </div>
      <div className="auth-footer-meta">
        &copy; {year} VeraChat. All rights reserved.
      </div>
    </footer>
  );
}
