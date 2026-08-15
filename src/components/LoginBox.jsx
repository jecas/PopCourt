import { useState } from "react";
import { LogIn } from "lucide-react";
import { TOKENS, card } from "../constants";

export default function LoginBox({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submitLogin = async () => {
    setErr("");
    if (!username.trim() || !password) { setErr("Popunite korisničko ime i lozinku."); return; }
    setBusy(true);
    try {
      await onSignIn({ username, password });
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? "Pogrešno korisničko ime ili lozinka." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    setErr("");
    if (!username.trim() || !password || !fullName.trim()) { setErr("Popunite sva polja."); return; }
    if (password.length < 6) { setErr("Lozinka mora imati bar 6 karaktera."); return; }
    if (password !== password2) { setErr("Lozinke se ne poklapaju."); return; }
    setBusy(true);
    try {
      await onSignUp({ username, password, fullName });
    } catch (e) {
      setErr(e.message.includes("already registered") ? "To korisničko ime je zauzeto." : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...card, maxWidth: 380 }}>
      <p style={{ fontSize: 13, color: "#6B6A63", margin: "0 0 12px" }}>
        Nalozi i lozinke se čuvaju u Supabase autentikaciji (heširano, van naše baze). Trener/sudijski/admin pristup dodeljuje administrator kluba naknadno.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => { setMode("login"); setErr(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${mode === "login" ? TOKENS.green : TOKENS.line}`, background: mode === "login" ? "#E7EFEA" : "#fff", color: mode === "login" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Prijavi se
        </button>
        <button onClick={() => { setMode("register"); setErr(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${mode === "register" ? TOKENS.green : TOKENS.line}`, background: mode === "register" ? "#E7EFEA" : "#fff", color: mode === "register" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Napravi nalog
        </button>
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Korisničko ime</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="npr. ana.anic"
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      {mode === "register" && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Ime i prezime</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="npr. Ana Anić"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Lozinka</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      {mode === "register" && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Ponovi lozinku</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
        </>
      )}

      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

      <button disabled={busy} onClick={mode === "login" ? submitLogin : submitRegister} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        <LogIn size={14} /> {busy ? "Sačekajte…" : mode === "login" ? "Uloguj se" : "Napravi nalog i uloguj se"}
      </button>
    </div>
  );
}
