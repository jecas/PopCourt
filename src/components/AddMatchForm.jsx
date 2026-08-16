import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

const inputStyle = { width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box" };
const disabledInputStyle = { ...inputStyle, background: "#F6F2E9", color: "#8B8A80" };
const labelStyle = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 };

export default function AddMatchForm({ courts, draw, onCreate }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState("Tenis");
  const [round, setRound] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [status, setStatus] = useState("scheduled");
  const [scheduledTime, setScheduledTime] = useState("");
  const [slotKey, setSlotKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const slots = useMemo(() => {
    if (!draw?.rounds) return [];
    const list = [];
    draw.rounds.forEach((r, ri) => {
      r.forEach((m, si) => {
        if (m.a && m.b) {
          const roundLabel = ri === 0 ? t("bracket.round1") : ri === draw.rounds.length - 1 ? t("bracket.final") : t("bracket.roundN")(ri + 1);
          list.push({ key: `${ri}-${si}`, roundIndex: ri, matchIndex: si, a: m.a, b: m.b, label: `${roundLabel}: ${m.a} vs ${m.b}` });
        }
      });
    });
    return list;
  }, [draw, t]);

  const selectedSlot = slots.find((s) => s.key === slotKey);

  const reset = () => {
    setRound(""); setPlayer1(""); setPlayer2(""); setStatus("scheduled"); setScheduledTime(""); setSlotKey(""); setErr("");
  };

  const onSlotChange = (key) => {
    setSlotKey(key);
    const slot = slots.find((s) => s.key === key);
    if (slot) { setPlayer1(slot.a); setPlayer2(slot.b); }
  };

  const submit = async () => {
    setErr("");
    if (!round.trim() || !player1.trim() || !player2.trim() || !courtId) { setErr(t("addMatch.errFillAll")); return; }
    if (status === "scheduled" && !scheduledTime.trim()) { setErr(t("addMatch.errTime")); return; }
    setBusy(true);
    try {
      await onCreate({
        sport, round: round.trim(), player1: player1.trim(), player2: player2.trim(), courtId, status, scheduledTime: scheduledTime.trim(),
        drawId: selectedSlot ? draw.id : null,
        roundIndex: selectedSlot ? selectedSlot.roundIndex : null,
        matchIndex: selectedSlot ? selectedSlot.matchIndex : null,
      });
      reset();
      setOpen(false);
    } catch (e) {
      setErr(e.message || t("addMatch.errGeneric"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8, border: `1px solid ${TOKENS.green}`, background: "#fff", color: TOKENS.green, cursor: "pointer" }}>
        <Plus size={12} /> {t("addMatch.button")}
      </button>
    );
  }

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t("addMatch.title")}</h3>
        <button onClick={() => { setOpen(false); reset(); }} style={{ background: "none", border: "none", color: "#8B8A80", fontSize: 13, cursor: "pointer" }}>{t("addMatch.cancel")}</button>
      </div>

      {slots.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{t("addMatch.linkDraw")}</label>
          <select value={slotKey} onChange={(e) => onSlotChange(e.target.value)} style={inputStyle}>
            <option value="">{t("addMatch.noLink")}</option>
            {slots.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>{t("addMatch.sport")}</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)} style={inputStyle}>
            <option value="Tenis">Tenis</option>
            <option value="Padel">Padel</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t("addMatch.court")}</label>
          <select value={courtId} onChange={(e) => setCourtId(Number(e.target.value))} style={inputStyle}>
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <label style={labelStyle}>{t("addMatch.round")}</label>
      <input value={round} onChange={(e) => setRound(e.target.value)} placeholder={t("addMatch.roundPlaceholder")} style={{ ...inputStyle, marginBottom: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>{t("addMatch.player1")}</label>
          <input value={player1} disabled={!!selectedSlot} onChange={(e) => setPlayer1(e.target.value)} placeholder={t("addMatch.player1Placeholder")} style={selectedSlot ? disabledInputStyle : inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t("addMatch.player2")}</label>
          <input value={player2} disabled={!!selectedSlot} onChange={(e) => setPlayer2(e.target.value)} placeholder={t("addMatch.player2Placeholder")} style={selectedSlot ? disabledInputStyle : inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>{t("addMatch.status")}</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStatus("scheduled")} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${status === "scheduled" ? TOKENS.green : TOKENS.line}`, background: status === "scheduled" ? "#E7EFEA" : "#fff", color: status === "scheduled" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {t("addMatch.scheduled")}
        </button>
        <button onClick={() => setStatus("live")} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${status === "live" ? TOKENS.clay : TOKENS.line}`, background: status === "live" ? "#F6E3D8" : "#fff", color: status === "live" ? TOKENS.clayDark : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {t("addMatch.liveNow")}
        </button>
      </div>

      {status === "scheduled" && (
        <>
          <label style={labelStyle}>{t("addMatch.time")}</label>
          <input value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} placeholder={t("addMatch.timePlaceholder")} style={{ ...inputStyle, marginBottom: 12 }} />
        </>
      )}

      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

      <button disabled={busy} onClick={submit} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        <Plus size={14} /> {busy ? t("addMatch.adding") : t("addMatch.button")}
      </button>
    </div>
  );
}
