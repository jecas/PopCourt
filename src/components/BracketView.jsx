import { useMemo } from "react";
import { TOKENS } from "../constants";
import { useLang } from "../lib/i18n.jsx";

const MATCH_H = 52;
const GAP0 = 16;

export default function BracketView({ bracket, compact }) {
  const { t } = useLang();
  const matchW = compact ? 128 : 150;
  const connectorW = compact ? 24 : 32;

  const { positions, totalHeight } = useMemo(() => {
    const pos = [];
    const n0 = bracket[0]?.length || 0;
    pos.push(Array.from({ length: n0 }, (_, i) => MATCH_H / 2 + i * (MATCH_H + GAP0)));
    for (let r = 1; r < bracket.length; r++) {
      const prev = pos[r - 1];
      const cur = [];
      for (let i = 0; i < bracket[r].length; i++) {
        cur.push((prev[2 * i] + prev[2 * i + 1]) / 2);
      }
      pos.push(cur);
    }
    const first = pos[0];
    const h = first.length ? first[first.length - 1] + MATCH_H / 2 : MATCH_H;
    return { positions: pos, totalHeight: h };
  }, [bracket]);

  const totalWidth = bracket.length * matchW + (bracket.length - 1) * connectorW;

  const lines = [];
  for (let r = 0; r < bracket.length - 1; r++) {
    const roundX = r * (matchW + connectorW);
    const nextX = (r + 1) * (matchW + connectorW);
    const xStart = roundX + matchW;
    const xMid = xStart + connectorW / 2;
    for (let i = 0; i < bracket[r].length; i += 2) {
      const yA = positions[r][i];
      const yB = positions[r][i + 1];
      const yEnd = positions[r + 1][i / 2];
      lines.push(<line key={`h1-${r}-${i}`} x1={xStart} y1={yA} x2={xMid} y2={yA} stroke={TOKENS.line} strokeWidth={1.5} />);
      lines.push(<line key={`h2-${r}-${i}`} x1={xStart} y1={yB} x2={xMid} y2={yB} stroke={TOKENS.line} strokeWidth={1.5} />);
      lines.push(<line key={`v-${r}-${i}`} x1={xMid} y1={yA} x2={xMid} y2={yB} stroke={TOKENS.line} strokeWidth={1.5} />);
      lines.push(<line key={`h3-${r}-${i}`} x1={xMid} y1={yEnd} x2={nextX} y2={yEnd} stroke={TOKENS.line} strokeWidth={1.5} />);
    }
  }

  return (
    <div style={{ minWidth: totalWidth, overflowX: "auto" }}>
      <div style={{ display: "flex" }}>
        {bracket.map((round, ri) => (
          <div key={ri} style={{ width: matchW, marginRight: ri < bracket.length - 1 ? connectorW : 0, flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#8B8A80", textTransform: "uppercase", margin: "0 0 10px" }}>
              {ri === 0 ? t("bracket.round1") : ri === bracket.length - 1 ? t("bracket.final") : t("bracket.roundN")(ri + 1)}
            </p>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", width: totalWidth, height: totalHeight }}>
        <svg width={totalWidth} height={totalHeight} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {lines}
        </svg>
        {bracket.map((round, ri) => (
          <div key={ri} style={{ position: "absolute", top: 0, left: ri * (matchW + connectorW), width: matchW }}>
            {round.map((m, mi) => (
              <div
                key={mi}
                style={{
                  position: "absolute",
                  top: positions[ri][mi] - MATCH_H / 2,
                  left: 0,
                  width: matchW,
                  height: MATCH_H,
                  boxSizing: "border-box",
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: TOKENS.chalk,
                }}
              >
                <div style={{ padding: "0 10px", fontSize: 13, height: MATCH_H / 2, boxSizing: "border-box", borderBottom: `1px solid ${TOKENS.line}`, display: "flex", alignItems: "center", color: m.a ? TOKENS.ink : "#B5B3A8" }}>{m.a || t("bracket.tbd")}</div>
                <div style={{ padding: "0 10px", fontSize: 13, height: MATCH_H / 2, boxSizing: "border-box", display: "flex", alignItems: "center", color: m.b ? TOKENS.ink : "#B5B3A8" }}>{m.b || (ri === 0 ? t("bracket.bye") : t("bracket.tbd"))}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
