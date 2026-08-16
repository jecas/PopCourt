import { useState } from "react";
import { Plus } from "lucide-react";
import { TOKENS, card } from "../constants";

const inputStyle = { width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box" };
const labelStyle = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 };

export default function AddMatchForm({ courts, onCreate }) {
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState("Tenis");
  const [round, setRound] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [status, setStatus] = useState("scheduled");
  const [scheduledTime, setScheduledTime] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setRound(""); setPlayer1(""); setPlayer2(""); setStatus("scheduled"); setScheduledTime(""); setErr("");
  };

  const submit = async () => {
    setErr("");
    if (!round.trim() || !player1.trim() || !player2.trim() || !courtId) { setErr("Popunite sva polja."); return; }
    if (status === "scheduled" && !scheduledTime.trim()) { setErr("Unesite vreme termina (npr. 18:30)."); return; }
    setBusy(true);
    try {
      await onCreate({ sport, round: round.trim(), player1: player1.trim(), player2: player2.trim(), courtId, status, scheduledTime: scheduledTime.trim() });
      reset();
      setOpen(false);
    } catch (e) {
      setErr(e.message || "Greška pri dodavanju meča.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8, border: `1px solid ${TOKENS.green}`, background: "#fff", color: TOKENS.green, cursor: "pointer" }}>
        <Plus size={12} /> Dodaj meč
      </button>
    );
  }

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Novi meč</h3>
        <button onClick={() => { setOpen(false); reset(); }} style={{ background: "none", border: "none", color: "#8B8A80", fontSize: 13, cursor: "pointer" }}>Otkaži</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Sport</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)} style={inputStyle}>
            <option value="Tenis">Tenis</option>
            <option value="Padel">Padel</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Teren</label>
          <select value={courtId} onChange={(e) => setCourtId(Number(e.target.value))} style={inputStyle}>
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <label style={labelStyle}>Krug / grupa</label>
      <input value={round} onChange={(e) => setRound(e.target.value)} placeholder="npr. Zimska liga - Grupa A" style={{ ...inputStyle, marginBottom: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Igrač / par 1</label>
          <input value={player1} onChange={(e) => setPlayer1(e.target.value)} placeholder="npr. V. Popović" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Igrač / par 2</label>
          <input value={player2} onChange={(e) => setPlayer2(e.target.value)} placeholder="npr. M. Jovanović" style={inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>Status</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStatus("scheduled")} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${status === "scheduled" ? TOKENS.green : TOKENS.line}`, background: status === "scheduled" ? "#E7EFEA" : "#fff", color: status === "scheduled" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Zakazan
        </button>
        <button onClick={() => setStatus("live")} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${status === "live" ? TOKENS.clay : TOKENS.line}`, background: status === "live" ? "#F6E3D8" : "#fff", color: status === "live" ? TOKENS.clayDark : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Počinje odmah (uživo)
        </button>
      </div>

      {status === "scheduled" && (
        <>
          <label style={labelStyle}>Vreme termina</label>
          <input value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} placeholder="npr. 18:30" style={{ ...inputStyle, marginBottom: 12 }} />
        </>
      )}

      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

      <button disabled={busy} onClick={submit} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        <Plus size={14} /> {busy ? "Dodajem…" : "Dodaj meč"}
      </button>
    </div>
  );
}
