import { useEffect, useState } from "react";
import { Check, Coins, KeyRound } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

const inputStyle = { width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 };

export default function MyAccount({ profile, onSaveProfile, onChangePassword }) {
  const { t } = useLang();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthDate, setBirthDate] = useState(profile.birth_date || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setBirthDate(profile.birth_date || "");
  }, [profile]);

  const saveInfo = async (e) => {
    e.preventDefault();
    setErr(""); setSaved(false); setBusy(true);
    try {
      await onSaveProfile({ fullName: fullName.trim(), phone: phone.trim(), birthDate });
      setSaved(true);
    } catch (e2) {
      setErr(e2.message || t("myAccount.error"));
    } finally {
      setBusy(false);
    }
  };

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr(""); setPwSaved(false);
    if (pw.length < 6) { setPwErr(t("login.errPwLen")); return; }
    if (pw !== pw2) { setPwErr(t("login.errPwMatch")); return; }
    setPwBusy(true);
    try {
      await onChangePassword(pw);
      setPwSaved(true);
      setPw(""); setPw2("");
    } catch (e2) {
      setPwErr(e2.message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 8, background: "#E7EFEA", border: `1px solid ${TOKENS.green}` }}>
        <Coins size={18} color={TOKENS.green} />
        <span style={{ fontSize: 14, fontWeight: 700, color: TOKENS.green }}>{t("myAccount.credits")}: {profile.credits ?? 0}</span>
      </div>

      <form onSubmit={saveInfo} style={card}>
        <label style={labelStyle}>Email</label>
        <input value={profile.username} disabled style={{ ...inputStyle, background: "#F6F2E9", color: "#8B8A80" }} />

        <label style={labelStyle}>{t("myAccount.fullName")}</label>
        <input value={fullName} onChange={(e) => { setFullName(e.target.value); setSaved(false); }} style={inputStyle} />

        <label style={labelStyle}>{t("myAccount.phone")}</label>
        <input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }} placeholder={t("myAccount.phonePlaceholder")} style={inputStyle} />

        <label style={labelStyle}>{t("myAccount.birthDate")}</label>
        <input type="date" value={birthDate || ""} onChange={(e) => { setBirthDate(e.target.value); setSaved(false); }} style={inputStyle} />

        {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="submit" disabled={busy} style={{ background: TOKENS.green, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? t("myAccount.saving") : t("myAccount.save")}
          </button>
          {saved && !busy && <span style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.green, fontSize: 13, fontWeight: 600 }}><Check size={14} /> {t("myAccount.saved")}</span>}
        </div>
      </form>

      <form onSubmit={savePassword} style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: TOKENS.green }}>
          <KeyRound size={16} />
          <strong style={{ fontSize: 14 }}>{t("myAccount.changePasswordTitle")}</strong>
        </div>
        <label style={labelStyle}>{t("resetPassword.newPassword")}</label>
        <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setPwSaved(false); }} placeholder="••••••••" style={inputStyle} />
        <label style={labelStyle}>{t("resetPassword.confirmPassword")}</label>
        <input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setPwSaved(false); }} placeholder="••••••••" style={inputStyle} />

        {pwErr && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{pwErr}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="submit" disabled={pwBusy} style={{ background: TOKENS.clay, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: pwBusy ? 0.6 : 1 }}>
            {pwBusy ? t("resetPassword.saving") : t("myAccount.changePasswordSubmit")}
          </button>
          {pwSaved && !pwBusy && <span style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.green, fontSize: 13, fontWeight: 600 }}><Check size={14} /> {t("myAccount.saved")}</span>}
        </div>
      </form>
    </div>
  );
}
