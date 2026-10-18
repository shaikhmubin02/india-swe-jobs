import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell" style={{ padding: "70px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>404</div>
      <h1 className="page-title" style={{ fontSize: 21 }}>That page isn&rsquo;t here</h1>
      <p className="page-sub" style={{ margin: "0 auto 20px" }}>
        The role may have closed, or the company or city slug doesn&rsquo;t exist on this board.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="chip-btn" href="/">All roles</Link>
        <Link className="chip-btn" href="/companies">Companies</Link>
        <Link className="chip-btn" href="/walkins">Walk-ins</Link>
      </div>
    </div>
  );
}
