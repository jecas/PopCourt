import { TOKENS, card } from "../constants";

export default function LegalPage({ content }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>{content.title}</h2>
      <p style={{ color: "#6B6A63", fontSize: 14, margin: "0 0 20px", maxWidth: 640 }}>{content.intro}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {content.sections.map((s, i) => (
          <div key={i} style={{ ...card }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: TOKENS.green }}>{s.heading}</h3>
            <p style={{ fontSize: 14, color: "#3F3E38", margin: 0, lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
