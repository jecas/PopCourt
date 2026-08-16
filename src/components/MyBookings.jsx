import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TOKENS, card } from "../constants";
import { hourLabel, hoursUntil } from "../lib/utils";
import { useLang } from "../lib/i18n.jsx";
import * as api from "../lib/api";

export default function MyBookings({ user, onCancel }) {
  const { t } = useLang();
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");

  const todayKey = new Date().toISOString().slice(0, 10);

  const load = () => {
    Promise.all([
      api.fetchMyUpcomingBookings(user.id, todayKey),
      api.fetchMyPastBookings(user.id, todayKey),
    ]).then(([u, h]) => { setUpcoming(u); setHistory(h); setReady(true); });
  };

  useEffect(() => { load(); }, []);

  const cancel = async (b) => {
    setMsg("");
    const left = hoursUntil(b.booking_date, b.start_hour);
    if (left < 24) { setMsg(t("booking.errCancelWindow")); return; }
    try {
      await onCancel(b.id);
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  if (!ready) return <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p>;

  return (
    <div>
      {msg && <p style={{ fontSize: 13, color: TOKENS.clay, marginBottom: 10 }}>{msg}</p>}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8B8A80", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>{t("myBookings.upcoming")}</h3>
      {upcoming.length === 0 ? (
        <p style={{ fontSize: 13, color: "#8B8A80", marginBottom: 24 }}>{t("myBookings.noUpcoming")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {upcoming.map((b) => (
            <div key={b.id} style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.courts?.name}</div>
                <div style={{ fontSize: 12, color: "#8B8A80" }}>{b.booking_date} · {hourLabel(b.start_hour)}–{hourLabel(b.start_hour + b.duration)}</div>
              </div>
              <button onClick={() => cancel(b)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 7, border: `1px solid ${TOKENS.clay}`, background: "#fff", color: TOKENS.clay, cursor: "pointer" }}>
                <X size={12} /> {t("myBookings.cancel")}
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8B8A80", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>{t("myBookings.history")}</h3>
      {history.length === 0 ? (
        <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("myBookings.noHistory")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((b) => (
            <div key={b.id} style={{ ...card, padding: "12px 16px", opacity: 0.7 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{b.courts?.name}</div>
              <div style={{ fontSize: 12, color: "#8B8A80" }}>{b.booking_date} · {hourLabel(b.start_hour)}–{hourLabel(b.start_hour + b.duration)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
