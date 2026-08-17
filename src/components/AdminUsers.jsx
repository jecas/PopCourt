import { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";
import * as api from "../lib/api";

function UserRow({ u, onSave }) {
  const { t } = useLang();
  const [balance, setBalance] = useState(u.balance);
  const [role, setRole] = useState(u.role);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = Number(balance) !== Number(u.balance) || role !== u.role;

  useEffect(() => {
    setBalance(u.balance);
    setRole(u.role);
  }, [u.balance, u.role]);

  const save = async () => {
    setBusy(true);
    try {
      await onSave(u.id, { balance: Number(balance), role });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td style={{ padding: "8px 10px", fontSize: 13 }}>{u.full_name}</td>
      <td style={{ padding: "8px 10px", fontSize: 13, color: "#8B8A80" }}>{u.username}</td>
      <td style={{ padding: "8px 10px" }}>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 6, padding: "5px 6px", fontSize: 12.5 }}>
          <option value="player">{t("adminUsers.roles").player}</option>
          <option value="coach">{t("adminUsers.roles").coach}</option>
          <option value="referee">{t("adminUsers.roles").referee}</option>
          <option value="admin">{t("adminUsers.roles").admin}</option>
        </select>
      </td>
      <td style={{ padding: "8px 10px" }}>
        <input type="number" step="50" value={balance} onChange={(e) => setBalance(e.target.value)}
          style={{ width: 90, border: `1px solid ${TOKENS.line}`, borderRadius: 6, padding: "5px 6px", fontSize: 12.5 }} /> din
      </td>
      <td style={{ padding: "8px 10px" }}>
        {dirty && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: TOKENS.clay, fontWeight: 600 }}>
              <AlertCircle size={12} /> {t("adminUsers.unsaved")}
            </span>
            <button onClick={save} disabled={busy} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, border: `1px solid ${TOKENS.green}`, background: TOKENS.green, color: "#fff", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              {t("adminUsers.save")}
            </button>
          </div>
        )}
        {saved && !dirty && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: TOKENS.green, fontWeight: 600 }}><Check size={13} /> {t("adminUsers.saved")}</span>}
      </td>
    </tr>
  );
}

export default function AdminUsers() {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.fetchAllProfiles().then((u) => { setUsers(u); setReady(true); }).catch((e) => { setErr(e.message); setReady(true); });
  }, []);

  const handleSave = async (id, patch) => {
    await api.adminUpdateProfile(id, patch);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  if (!ready) return <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p>;

  return (
    <div style={{ ...card, overflowX: "auto" }}>
      {err && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 10 }}>{err}</p>}
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${TOKENS.line}` }}>
            <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, textTransform: "uppercase", color: "#8B8A80" }}>{t("adminUsers.name")}</th>
            <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, textTransform: "uppercase", color: "#8B8A80" }}>{t("adminUsers.email")}</th>
            <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, textTransform: "uppercase", color: "#8B8A80" }}>{t("adminUsers.role")}</th>
            <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, textTransform: "uppercase", color: "#8B8A80" }}>{t("adminUsers.credits")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => <UserRow key={u.id} u={u} onSave={handleSave} />)}
        </tbody>
      </table>
    </div>
  );
}
