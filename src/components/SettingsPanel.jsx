import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

export default function SettingsPanel({ settings, onSave }) {
  const { t } = useLang();
  const [name, setName] = useState(settings?.name || "");
  const [address, setAddress] = useState(settings?.address || "");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(settings?.name || "");
    setAddress(settings?.address || "");
    setPhone(settings?.phone || "");
  }, [settings]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaved(false);
    setBusy(true);
    try {
      await onSave({ name: name.trim(), address: address.trim(), phone: phone.trim() });
      setSaved(true);
    } catch (e2) {
      setErr(e2.message || t("settings.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ ...card, maxWidth: 460 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("settings.name")}</label>
      <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }}
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("settings.address")}</label>
      <input value={address} onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("settings.phone")}</label>
      <input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
        style={{ width: "100%", border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.green, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? t("settings.saving") : t("settings.save")}
        </button>
        {saved && !busy && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.green, fontSize: 13, fontWeight: 600 }}>
            <Check size={14} /> {t("settings.saved")}
          </span>
        )}
      </div>
    </form>
  );
}
