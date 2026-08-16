import { TOKENS } from "../constants";
import { useLang } from "../lib/i18n.jsx";

export default function BracketView({ bracket, compact }) {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", gap: compact ? 18 : 28, minWidth: compact ? 460 : 560, overflowX: "auto" }}>
      {bracket.map((round, ri) => (
        <div key={ri} style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: compact ? 10 : 14, minWidth: compact ? 120 : 150 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#8B8A80", textTransform: "uppercase", margin: 0 }}>
            {ri === 0 ? t("bracket.round1") : ri === bracket.length - 1 ? t("bracket.final") : t("bracket.roundN")(ri + 1)}
          </p>
          {round.map((m, mi) => (
            <div key={mi} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "7px 10px", fontSize: 13, borderBottom: `1px solid ${TOKENS.line}`, background: TOKENS.chalk, color: m.a ? TOKENS.ink : "#B5B3A8" }}>{m.a || t("bracket.tbd")}</div>
              <div style={{ padding: "7px 10px", fontSize: 13, background: TOKENS.chalk, color: m.b ? TOKENS.ink : "#B5B3A8" }}>{m.b || (ri === 0 ? t("bracket.bye") : t("bracket.tbd"))}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
