import { useMemo, useState } from "react";
import { Shuffle, Check } from "lucide-react";
import { TOKENS, card } from "../constants";
import { buildBracket } from "../lib/utils";
import BracketView from "./BracketView";

export default function DrawTool({ user, draw, onGenerate, onPublish }) {
  const [namesInput, setNamesInput] = useState("Popović\nJovanović\nKostić\nSimić\nPerić\nVukašinović\nIlić\nRadović");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const players = useMemo(() => namesInput.split("\n").map((n) => n.trim()).filter(Boolean), [namesInput]);

  const generate = async () => {
    if (players.length < 2) { setError("Unesite bar 2 igrača, svaki u novom redu."); return; }
    setError("");
    setBusy(true);
    try {
      await onGenerate({ players, rounds: buildBracket(players), createdBy: user.id });
    } catch (e) {
      setError(e.message || "Greška pri čuvanju žreba.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      await onPublish(draw.id);
    } catch (e) {
      setError(e.message || "Greška pri objavljivanju žreba.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={card}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Igrači (jedan po redu)</label>
        <textarea value={namesInput} onChange={(e) => setNamesInput(e.target.value)} rows={6}
          style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        {error && <p style={{ color: TOKENS.clay, fontSize: 13, marginTop: 6 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button disabled={busy} onClick={generate} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            <Shuffle size={14} /> Generiši žreb
          </button>
          {draw && !draw.published && (
            <button disabled={busy} onClick={publish} style={{ background: TOKENS.clay, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              Objavi žreb na početnoj
            </button>
          )}
          {draw && draw.published && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TOKENS.green, fontWeight: 600 }}>
              <Check size={15} /> Objavljeno — vidljivo na početnoj strani
            </span>
          )}
        </div>
      </div>
      {draw && <div style={{ ...card, overflowX: "auto" }}><BracketView bracket={draw.rounds} /></div>}
    </div>
  );
}
