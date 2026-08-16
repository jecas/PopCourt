import { useState } from "react";
import { KeyRound, Check } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

export default function ResetPasswordForm({ onSubmit, onDone }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 6) { setErr(t("login.errPwLen")); return; }
    if (password !== password2) { setErr(t("login.errPwMatch")); return; }
    setBusy(true);
    try {
      await onSubmit(password);
      setDone(true);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,31,23,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      {done ? (
        <div style={{ ...card, maxWidth: 380, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: TOKENS.green }}>
            <Check size={20} />
            <strong style={{ fontSize: 15 }}>{t("resetPassword.success")}</strong>
          </div>
          <button onClick={onDone} style={{ width: "100%", marginTop: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t("resetPassword.continue")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ ...card, maxWidth: 380, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: TOKENS.green }}>
            <KeyRound size={18} />
            <strong style={{ fontSize: 15 }}>{t("resetPassword.title")}</strong>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("resetPassword.newPassword")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("resetPassword.confirmPassword")}</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

          {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

          <button type="submit" disabled={busy} style={{ width: "100%", background: TOKENS.green, color: "#fff", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? t("resetPassword.saving") : t("resetPassword.submit")}
          </button>
        </form>
      )}
    </div>
  );
}
