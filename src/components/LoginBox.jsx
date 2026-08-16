import { useState } from "react";
import { LogIn, MailCheck, KeyRound } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

export default function LoginBox({ onSignIn, onSignUp, onForgotPassword }) {
  const { t } = useLang();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const submitLogin = async () => {
    setErr("");
    if (!email.trim() || !password) { setErr(t("login.errFillEmailPass")); return; }
    setBusy(true);
    try {
      await onSignIn({ email, password });
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? t("login.errWrongCreds") : e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    setErr("");
    if (!email.trim() || !password || !fullName.trim()) { setErr(t("login.errFillAll")); return; }
    if (password.length < 6) { setErr(t("login.errPwLen")); return; }
    if (password !== password2) { setErr(t("login.errPwMatch")); return; }
    setBusy(true);
    try {
      await onSignUp({ email, password, fullName });
      setJustRegistered(true);
    } catch (e) {
      setErr(e.message.includes("already registered") ? t("login.errEmailTaken") : e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async () => {
    setErr("");
    if (!email.trim()) { setErr(t("login.errFillEmailPass")); return; }
    setBusy(true);
    try {
      await onForgotPassword(email);
      setForgotSent(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (mode === "login") submitLogin();
    else if (mode === "register") submitRegister();
    else submitForgot();
  };

  const backToLogin = () => {
    setJustRegistered(false);
    setForgotSent(false);
    setMode("login");
    setPassword("");
    setPassword2("");
    setErr("");
  };

  if (justRegistered) {
    return (
      <div style={{ ...card, maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: TOKENS.green }}>
          <MailCheck size={20} />
          <strong style={{ fontSize: 15 }}>{t("login.checkEmailTitle")}</strong>
        </div>
        <p style={{ fontSize: 13, color: "#6B6A63", margin: 0 }}>
          {t("login.checkEmailBody")(email)}
        </p>
        <button onClick={backToLogin} style={{ marginTop: 14, background: "none", border: "none", color: TOKENS.green, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          {t("login.backToLogin")}
        </button>
      </div>
    );
  }

  if (forgotSent) {
    return (
      <div style={{ ...card, maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: TOKENS.green }}>
          <MailCheck size={20} />
          <strong style={{ fontSize: 15 }}>{t("login.forgotSentTitle")}</strong>
        </div>
        <p style={{ fontSize: 13, color: "#6B6A63", margin: 0 }}>
          {t("login.forgotSentBody")(email)}
        </p>
        <button onClick={backToLogin} style={{ marginTop: 14, background: "none", border: "none", color: TOKENS.green, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          {t("login.backToLogin")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...card, maxWidth: 380 }}>
      {mode === "forgot" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: TOKENS.green }}>
            <KeyRound size={18} />
            <strong style={{ fontSize: 15 }}>{t("login.forgotTitle")}</strong>
          </div>
          <p style={{ fontSize: 13, color: "#6B6A63", margin: "0 0 14px" }}>{t("login.forgotBody")}</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#6B6A63", margin: "0 0 12px" }}>
            {t("login.notice")}
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button type="button" onClick={() => { setMode("login"); setErr(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${mode === "login" ? TOKENS.green : TOKENS.line}`, background: mode === "login" ? "#E7EFEA" : "#fff", color: mode === "login" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t("login.signIn")}
            </button>
            <button type="button" onClick={() => { setMode("register"); setErr(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${mode === "register" ? TOKENS.green : TOKENS.line}`, background: mode === "register" ? "#E7EFEA" : "#fff", color: mode === "register" ? TOKENS.green : TOKENS.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t("login.signUp")}
            </button>
          </div>
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("login.email")}</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.emailPlaceholder")}
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      {mode === "register" && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("login.fullName")}</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("login.fullNamePlaceholder")}
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
        </>
      )}

      {mode !== "forgot" && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("login.password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: mode === "login" ? 6 : 12 }} />
        </>
      )}

      {mode === "login" && (
        <button type="button" onClick={() => { setMode("forgot"); setErr(""); }} style={{ background: "none", border: "none", color: TOKENS.green, fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, marginBottom: 12, display: "block" }}>
          {t("login.forgotPassword")}
        </button>
      )}

      {mode === "register" && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("login.password2")}</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
        </>
      )}

      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

      <button type="submit" disabled={busy} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        <LogIn size={14} />
        {busy ? t("login.wait") : mode === "login" ? t("login.submitSignIn") : mode === "register" ? t("login.submitSignUp") : t("login.forgotSubmit")}
      </button>

      {mode === "forgot" && (
        <button type="button" onClick={backToLogin} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#6B6A63", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          {t("login.backToLogin")}
        </button>
      )}
    </form>
  );
}
