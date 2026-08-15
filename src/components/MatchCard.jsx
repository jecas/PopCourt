import { Plus, Minus, Play, Check } from "lucide-react";
import { TOKENS, miniBtn, smallGhostBtn, card } from "../constants";

export default function MatchCard({ match, canScore, onUpdate }) {
  const live = match.status === "live";
  const finished = match.status === "finished";

  const bump = (setIdx, side, delta) => {
    const newSets = match.sets.map((s, i) => (i === setIdx ? [...s] : s));
    newSets[setIdx][side] = Math.max(0, newSets[setIdx][side] + delta);
    onUpdate(match.id, { sets: newSets });
  };
  const addSet = () => onUpdate(match.id, { sets: [...match.sets, [0, 0]] });

  return (
    <div style={{ ...card, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: match.sport === "Tenis" ? TOKENS.clayDark : TOKENS.navy, background: match.sport === "Tenis" ? "#F6E3D8" : "#E4E8F1", padding: "3px 8px", borderRadius: 5 }}>
            {match.sport}
          </span>
          <span style={{ fontSize: 13, color: "#6B6A63" }}>{match.round}</span>
        </div>
        {live && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: TOKENS.clay, fontWeight: 700, fontSize: 12, letterSpacing: "0.05em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.clay, animation: "pc-pulse 1.4s ease-in-out infinite" }} />
            UŽIVO
          </span>
        )}
        {finished && <span style={{ fontSize: 12, color: "#8B8A80", fontWeight: 600 }}>ZAVRŠENO</span>}
        {match.status === "scheduled" && <span style={{ fontSize: 12, color: "#8B8A80", fontWeight: 600 }}>{match.scheduled_time}</span>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.player1}</span>
          <span style={{ fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.player2}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {match.sets.length === 0 && <span style={{ fontSize: 13, color: "#B5B3A8" }}>—</span>}
          {match.sets.map((set, si) => (
            <div key={si} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 34 }}>
              {canScore && live && <button onClick={() => bump(si, 0, 1)} style={miniBtn} aria-label="uvecaj gem prvog igraca"><Plus size={11} /></button>}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: TOKENS.green, lineHeight: 1.2 }}>{match.sets[si][0]}</div>
              {canScore && live && <button onClick={() => bump(si, 0, -1)} style={miniBtn} aria-label="umanji gem prvog igraca"><Minus size={11} /></button>}
            </div>
          ))}
        </div>
      </div>

      {match.sets.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: -8 }}>
          {match.sets.map((set, si) => (
            <div key={si} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 34 }}>
              {canScore && live && <button onClick={() => bump(si, 1, 1)} style={miniBtn} aria-label="uvecaj gem drugog igraca"><Plus size={11} /></button>}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: "#6B6A63", lineHeight: 1.2 }}>{match.sets[si][1]}</div>
              {canScore && live && <button onClick={() => bump(si, 1, -1)} style={miniBtn} aria-label="umanji gem drugog igraca"><Minus size={11} /></button>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${TOKENS.line}`, paddingTop: 8, marginTop: 2 }}>
        <span style={{ fontSize: 12, color: "#8B8A80" }}>{match.courts?.name}</span>
        {canScore && (
          <div style={{ display: "flex", gap: 6 }}>
            {live && match.sets.length < 5 && <button onClick={addSet} style={smallGhostBtn}>+ set</button>}
            {match.status === "scheduled" && <button onClick={() => onUpdate(match.id, { status: "live", sets: [[0, 0]] })} style={{ ...smallGhostBtn, color: TOKENS.clay, borderColor: TOKENS.clay }}><Play size={11} style={{ marginRight: 4 }} /> Pokreni</button>}
            {live && <button onClick={() => onUpdate(match.id, { status: "finished" })} style={{ ...smallGhostBtn, color: TOKENS.green, borderColor: TOKENS.green }}><Check size={11} style={{ marginRight: 4 }} /> Završi</button>}
          </div>
        )}
      </div>
    </div>
  );
}
