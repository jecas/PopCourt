import { TOKENS } from "../constants";

export default function BracketView({ bracket, compact }) {
  return (
    <div style={{ display: "flex", gap: compact ? 18 : 28, minWidth: compact ? 460 : 560, overflowX: "auto" }}>
      {bracket.map((round, ri) => (
        <div key={ri} style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: compact ? 10 : 14, minWidth: compact ? 120 : 150 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#8B8A80", textTransform: "uppercase", margin: 0 }}>
            {ri === 0 ? "1. kolo" : ri === bracket.length - 1 ? "Finale" : `${ri + 1}. kolo`}
          </p>
          {round.map((m, mi) => (
            <div key={mi} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "7px 10px", fontSize: 13, borderBottom: `1px solid ${TOKENS.line}`, background: TOKENS.chalk, color: m.a ? TOKENS.ink : "#B5B3A8" }}>{m.a || "TBD"}</div>
              <div style={{ padding: "7px 10px", fontSize: 13, background: TOKENS.chalk, color: m.b ? TOKENS.ink : "#B5B3A8" }}>{m.b || (ri === 0 ? "slobodno" : "TBD")}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
