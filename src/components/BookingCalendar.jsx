import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { TOKENS, OPEN_HOUR, CLOSE_HOUR, DURATIONS } from "../constants";
import { dateKey, fmtLongDate, hourLabel, hoursUntil, isSameDay, computeBookingPrice } from "../lib/utils";
import { useLang } from "../lib/i18n.jsx";

const ROW_HEIGHT = 46;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

export default function BookingCalendar({ user, courts, bookings, priceRules, onBook, onCancel }) {
  const { t } = useLang();
  const isAdmin = user.role === "admin";
  const maxDays = user.role === "coach" || user.role === "admin" ? 14 : 7;
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const maxDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + maxDays - 1); return d; }, [today, maxDays]);

  const [date, setDate] = useState(today);
  const [sport, setSport] = useState("Tenis");
  const [duration, setDuration] = useState(1);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedDate = dateKey(date);
  const filteredCourts = courts.filter((c) => c.sport === sport);
  const dayBookings = bookings.filter((b) => b.booking_date === selectedDate);

  const bookingAt = (courtId, hour) =>
    dayBookings.find((b) => b.court_id === courtId && hour >= b.start_hour && hour < b.start_hour + b.duration);

  const goDay = (delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    if (next < today || next > maxDate) return;
    setDate(next);
    setMsg("");
  };

  const bookSlot = async (courtId, startHour) => {
    setMsg("");
    if (!isAdmin) {
      const leadTime = hoursUntil(selectedDate, startHour);
      if (leadTime < 1) { setMsg(t("booking.errLeadTime")); return; }
    }
    const neededSlots = [];
    for (let h = startHour; h < startHour + duration; h += 0.5) neededSlots.push(h);
    if (neededSlots[neededSlots.length - 1] + 0.5 > CLOSE_HOUR) { setMsg(t("booking.errCloseOverflow")); return; }
    if (neededSlots.some((h) => bookingAt(courtId, h))) { setMsg(t("booking.errConflict")); return; }
    if (!isAdmin) {
      const price = computeBookingPrice(priceRules, sport, startHour, duration);
      if (price == null) { setMsg(t("booking.errNoPrice")); return; }
      if ((user.credits ?? 0) < price) { setMsg(t("booking.errInsufficientCredits")); return; }
    }
    setBusy(true);
    try {
      await onBook({ courtId, bookingDate: selectedDate, startHour, duration });
    } catch (e) {
      setMsg(mapError(e.message, t));
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async (b) => {
    setMsg("");
    const mine = b.user_id === user.id;
    if (!mine && !isAdmin) return;
    if (!isAdmin) {
      const left = hoursUntil(b.booking_date, b.start_hour);
      if (left < 24) { setMsg(t("booking.errCancelWindow")); return; }
    }
    if (isAdmin && !mine) {
      const ownerName = b.profiles?.full_name || "";
      if (!window.confirm(t("booking.confirmAdminCancel")(ownerName))) return;
    }
    setBusy(true);
    try {
      await onCancel(b.id);
    } catch (e) {
      setMsg(mapError(e.message, t));
    } finally {
      setBusy(false);
    }
  };

  const handleColumnClick = (e, court) => {
    if (e.target !== e.currentTarget) return; // click landed on a booking block, not empty space
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hour = OPEN_HOUR + Math.floor((offsetY / ROW_HEIGHT) * 2) / 2;
    bookSlot(court.id, hour);
  };

  const totalHeight = (CLOSE_HOUR - OPEN_HOUR) * ROW_HEIGHT;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSport("Tenis")} style={sportBtnStyle(sport === "Tenis")}>{t("booking.sportTennis")}</button>
          <button onClick={() => setSport("Padel")} style={sportBtnStyle(sport === "Padel")}>{t("booking.sportPadel")}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: TOKENS.green }}>
          <Coins size={15} /> {isAdmin ? t("booking.adminNoCredits") : `${t("booking.creditsLabel")}: ${user.credits ?? 0}`}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <button onClick={() => goDay(-1)} disabled={isSameDay(date, today)} aria-label={t("booking.prevDay")}
          style={{ ...navBtnStyle, opacity: isSameDay(date, today) ? 0.35 : 1, cursor: isSameDay(date, today) ? "default" : "pointer" }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{fmtLongDate(date, t("booking.dayNamesLong"), t("booking.monthNamesShort"))}</div>
          {!isSameDay(date, today) && (
            <button onClick={() => setDate(today)} style={{ background: "none", border: "none", color: TOKENS.green, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, marginTop: 2 }}>
              {t("booking.today")}
            </button>
          )}
        </div>
        <button onClick={() => goDay(1)} disabled={isSameDay(date, maxDate)} aria-label={t("booking.nextDay")}
          style={{ ...navBtnStyle, opacity: isSameDay(date, maxDate) ? 0.35 : 1, cursor: isSameDay(date, maxDate) ? "default" : "pointer" }}>
          <ChevronRight size={16} />
        </button>
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
        <div style={{ display: "flex", minWidth: 140 + filteredCourts.length * 150 }}>
          <div style={{ width: 56, flex: "0 0 auto" }}>
            <div style={{ height: 28 }} />
            {HOURS.map((h) => (
              <div key={h} style={{ height: ROW_HEIGHT, position: "relative", top: -6 }}>
                <div style={{ fontSize: 11, color: "#8B8A80" }}>{String(h).padStart(2, "0")}h</div>
              </div>
            ))}
          </div>
          {filteredCourts.map((court) => (
            <div key={court.id} style={{ flex: "1 0 150px", minWidth: 150, borderLeft: `1px solid ${TOKENS.line}` }}>
              <div style={{ height: 28, fontSize: 12, fontWeight: 700, textAlign: "center", color: TOKENS.ink }}>{court.name}</div>
              <div
                onClick={(e) => handleColumnClick(e, court)}
                style={{
                  position: "relative", height: totalHeight, cursor: "pointer",
                  backgroundImage: `linear-gradient(to bottom, ${TOKENS.line} 1px, transparent 1px)`,
                  backgroundSize: `100% ${ROW_HEIGHT}px`,
                  backgroundColor: TOKENS.chalk,
                }}
              >
                {dayBookings.filter((b) => b.court_id === court.id).map((b) => {
                  const mine = b.user_id === user.id;
                  const canCancel = mine || isAdmin;
                  const label = mine ? user.name : isAdmin ? (b.profiles?.full_name || t("booking.titleTaken")) : t("booking.titleTaken");
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); if (canCancel) cancelBooking(b); }}
                      title={mine ? t("booking.titleCancel") : isAdmin ? t("booking.titleCancelAdmin") : t("booking.titleTaken")}
                      style={{
                        position: "absolute", left: 3, right: 3,
                        top: (b.start_hour - OPEN_HOUR) * ROW_HEIGHT + 1,
                        height: b.duration * ROW_HEIGHT - 2,
                        borderRadius: 6, padding: "4px 6px", boxSizing: "border-box", overflow: "hidden",
                        background: mine ? TOKENS.ball : "#EFE9DC",
                        color: mine ? TOKENS.greenDark : "#8B8A80",
                        border: `1px solid ${mine ? TOKENS.ball : TOKENS.line}`,
                        cursor: canCancel ? "pointer" : "default",
                        fontSize: 11, fontWeight: 600, lineHeight: 1.3,
                      }}
                    >
                      {hourLabel(b.start_hour)}–{hourLabel(b.start_hour + b.duration)}
                      <br />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#8B8A80", marginTop: 14 }}>
        {user.role === "coach" || user.role === "admin" ? t("booking.noteCoach") : t("booking.notePlayer")}
        {t("booking.legend")}
      </p>
    </div>
  );
}

function sportBtnStyle(active) {
  return {
    padding: "8px 14px", borderRadius: 8, border: `1px solid ${active ? TOKENS.green : TOKENS.line}`,
    background: active ? TOKENS.green : "#fff", color: active ? "#fff" : TOKENS.ink,
    fontSize: 12, fontWeight: 700, cursor: "pointer",
  };
}

const navBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${TOKENS.line}`,
  background: "#fff", color: TOKENS.green, display: "flex", alignItems: "center", justifyContent: "center",
};

function mapError(message, t) {
  if (!message) return message;
  if (message.includes("Nemate dovoljno kredita")) return t("booking.errInsufficientCredits");
  if (message.includes("najkasnije 1h")) return t("booking.errLeadTime");
  if (message.includes("24h")) return t("booking.errCancelWindow");
  if (message.includes("exclusion") || message.includes("conflicting key")) return t("booking.errConflict");
  return message;
}
