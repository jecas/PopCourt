import { useEffect, useState } from "react";
import { Plus, Minus, Play, Check, Save } from "lucide-react";
import { TOKENS, miniBtn, smallGhostBtn, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

export default function MatchCard({ match, canScore, onUpdate }) {
  const { t } = useLang();
  const live = match.status === "live";
  const finished = match.status === "finished";

  const [localSets, setLocalSets] = useState(match.sets);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setLocalSets(match.sets);
  }, [match.sets, dirty]);

  const bump = (setIdx, side, delta) => {
    setLocalSets((prev) => {
      const next = prev.map((s, i) => (i === setIdx ? [...s] : s));
      next[setIdx][side] = Math.max(0, next[setIdx][side] + delta);
      return next;
    });
    setDirty(true);
  };

  const addSet = () => {
    setLocalSets((prev) => [...prev, [0, 0]]);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(match.id, { sets: localSets });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

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
            {t("matchCard.live")}
          </span>
        )}
        {finished && <span style={{ fontSize: 12, color: "#8B8A80", fontWeight: 600 }}>{t("matchCard.finished")}</span>}
        {match.status === "scheduled" && <span style={{ fontSize: 12, color: "#8B8A80", fontWeight: 600 }}>{match.scheduled_time}</span>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.player1}</span>
          <span style={{ fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.player2}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {localSets.length === 0 && <span style={{ fontSize: 13, color: "#B5B3A8" }}>—</span>}
          {localSets.map((set, si) => (
            <div key={si} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 34 }}>
              {canScore && live && <button onClick={() => bump(si, 0, 1)} style={miniBtn} aria-label={t("matchCard.incP1")}><Plus size={11} /></button>}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: TOKENS.green, lineHeight: 1.2 }}>{localSets[si][0]}</div>
              {canScore && live && <button onClick={() => bump(si, 0, -1)} style={miniBtn} aria-label={t("matchCard.decP1")}><Minus size={11} /></button>}
            </div>
          ))}
        </div>
      </div>

      {localSets.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: -8 }}>
          {localSets.map((set, si) => (
            <div key={si} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 34 }}>
              {canScore && live && <button onClick={() => bump(si, 1, 1)} style={miniBtn} aria-label={t("matchCard.incP2")}><Plus size={11} /></button>}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: "#6B6A63", lineHeight: 1.2 }}>{localSets[si][1]}</div>
              {canScore && live && <button onClick={() => bump(si, 1, -1)} style={miniBtn} aria-label={t("matchCard.decP2")}><Minus size={11} /></button>}
            </div>
          ))}
        </div>
      )}

      {canScore && live && dirty && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#F6E3D8", border: `1px solid #E9C4AB`, borderRadius: 8, padding: "8px 10px" }}>
          <span style={{ fontSize: 12, color: TOKENS.clayDark, fontWeight: 600 }}>{t("matchCard.unsaved")}</span>
          <button disabled={saving} onClick={save} style={{ display: "flex", alignItems: "center", gap: 5, background: TOKENS.clay, color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            <Save size={12} /> {saving ? t("matchCard.saving") : t("matchCard.save")}
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${TOKENS.line}`, paddingTop: 8, marginTop: 2 }}>
        <span style={{ fontSize: 12, color: "#8B8A80" }}>{match.courts?.name}</span>
        {canScore && (
          <div style={{ display: "flex", gap: 6 }}>
            {live && localSets.length < 5 && <button onClick={addSet} style={smallGhostBtn}>{t("matchCard.addSet")}</button>}
            {match.status === "scheduled" && <button onClick={() => onUpdate(match.id, { status: "live", sets: [[0, 0]] })} style={{ ...smallGhostBtn, color: TOKENS.clay, borderColor: TOKENS.clay }}><Play size={11} style={{ marginRight: 4 }} /> {t("matchCard.start")}</button>}
            {live && <button onClick={() => onUpdate(match.id, { status: "finished", sets: localSets })} style={{ ...smallGhostBtn, color: TOKENS.green, borderColor: TOKENS.green }}><Check size={11} style={{ marginRight: 4 }} /> {t("matchCard.finish")}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
