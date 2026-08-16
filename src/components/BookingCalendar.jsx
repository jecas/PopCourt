import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { TOKENS, SLOTS, DURATIONS, CLOSE_HOUR } from "../constants";
import { dateKey, fmtDay, hourLabel, hoursUntil } from "../lib/utils";
import { useLang } from "../lib/i18n.jsx";

export default function BookingCalendar({ user, courts, bookings, onBook, onCancel }) {
  const { t } = useLang();
  const dayNames = t("booking.dayNames");
  const maxDays = user.role === "coach" || user.role === "admin" ? 14 : 7;
  const days = useMemo(() => Array.from({ length: maxDays }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), [maxDays]);
  const [dayIdx, setDayIdx] = useState(0);
  const [duration, setDuration] = useState(1);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedDate = dateKey(days[dayIdx]);

  const bookingAt = (courtId, hour) =>
    bookings.find((b) => b.booking_date === selectedDate && b.court_id === courtId && hour >= b.start_hour && hour < b.start_hour + b.duration);

  const bookSlot = async (courtId, startHour) => {
    setMsg("");
    const leadTime = hoursUntil(selectedDate, startHour);
    if (leadTime < 1) { setMsg(t("booking.errLeadTime")); return; }
    const neededSlots = [];
    for (let h = startHour; h < startHour + duration; h += 0.5) neededSlots.push(h);
    if (neededSlots[neededSlots.length - 1] + 0.5 > CLOSE_HOUR) { setMsg(t("booking.errCloseOverflow")); return; }
    const conflict = neededSlots.some((h) => bookingAt(courtId, h));
    if (conflict) { setMsg(t("booking.errConflict")); return; }
    setBusy(true);
    try {
      await onBook({ courtId, bookingDate: selectedDate, startHour, duration });
    } catch (e) {
      setMsg(e.message || t("booking.errConflict"));
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async (b) => {
    setMsg("");
    if (b.user_id !== user.id) return;
    const left = hoursUntil(b.booking_date, b.start_hour);
    if (left < 24) { setMsg(t("booking.errCancelWindow")); return; }
    setBusy(true);
    try {
      await onCancel(b.id);
    } catch (e) {
      setMsg(e.message || t("booking.errCancelWindow"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 10 }}>
        {days.map((d, i) => (
          <button key={i} onClick={() => setDayIdx(i)} style={{ flex: "0 0 auto", padding: "8px 12px", borderRadius: 8, border: `1px solid ${i === dayIdx ? TOKENS.green : TOKENS.line}`, background: i === dayIdx ? TOKENS.green : "#fff", color: i === dayIdx ? "#fff" : TOKENS.ink, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {fmtDay(d, dayNames)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{t("booking.durationHeading")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setDuration(d)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${duration === d ? TOKENS.green : TOKENS.line}`, background: duration === d ? "#E7EFEA" : "#fff", color: duration === d ? TOKENS.green : TOKENS.ink, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {t("booking.durationLabel")(d)}
            </button>
          ))}
        </div>
      </div>

      {msg && <p style={{ fontSize: 13, color: TOKENS.clay, marginBottom: 10 }}>{msg}</p>}

      <div style={{ overflowX: "auto", opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 1120 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", position: "sticky", left: 0, background: TOKENS.chalk }}></th>
              {SLOTS.map((h) => <th key={h} style={{ padding: "6px 3px", fontWeight: 600, color: "#8B8A80" }}>{hourLabel(h)}</th>)}
            </tr>
          </thead>
          <tbody>
            {courts.map((court) => (
              <tr key={court.id}>
                <td style={{ padding: "4px 8px", fontWeight: 600, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff" }}>{court.name}</td>
                {SLOTS.map((h) => {
                  const b = bookingAt(court.id, h);
                  const mine = b && b.user_id === user.id;
                  const isStart = b && b.start_hour === h;
                  const bg = b ? (mine ? TOKENS.ball : "#EFE9DC") : "#fff";
                  const txt = b ? (mine ? TOKENS.greenDark : "#9B998C") : TOKENS.green;
                  return (
                    <td key={h} style={{ padding: 2 }}>
                      <button
                        onClick={() => (b ? cancelBooking(b) : bookSlot(court.id, h))}
                        title={b ? (mine ? t("booking.titleCancel") : t("booking.titleTaken")) : t("booking.titleFree")}
                        style={{ width: 26, height: 30, borderRadius: 5, border: `1px solid ${TOKENS.line}`, background: bg, color: txt, fontSize: 12, cursor: !b || mine ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {b ? (mine ? (isStart ? <Check size={12} /> : "") : (isStart ? "×" : "")) : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "#8B8A80", marginTop: 10 }}>
        {user.role === "coach" || user.role === "admin" ? t("booking.noteCoach") : t("booking.notePlayer")}
        {t("booking.legend")}
      </p>
    </div>
  );
}
