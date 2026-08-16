import { useEffect, useState } from "react";
import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

const smallInput = { width: 56, border: `1px solid ${TOKENS.line}`, borderRadius: 6, padding: "5px 6px", fontSize: 12.5 };

function toEditRows(rules) {
  return rules.map((r) => ({ startHour: r.start_hour, endHour: r.end_hour, pricePerHour: r.price_per_hour }));
}

function ZoneSportEditor({ sport, sportLabel, rules, isAdmin, onSave, t }) {
  const [rows, setRows] = useState(() => toEditRows(rules));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { setRows(toEditRows(rules)); }, [rules]);

  const dirty = JSON.stringify(rows) !== JSON.stringify(toEditRows(rules));

  const updateRow = (i, patch) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { startHour: 8, endHour: 22, pricePerHour: 1 }]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setErr("");
    setBusy(true);
    try {
      await onSave(sport, rows.map((r) => ({ startHour: Number(r.startHour), endHour: Number(r.endHour), pricePerHour: Number(r.pricePerHour) })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e.message || t("prices.zoneError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: TOKENS.green }}>{sportLabel}</h3>
      {rows.length === 0 && <p style={{ fontSize: 13, color: "#8B8A80" }}>—</p>}
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {isAdmin ? (
            <>
              <input type="number" step="0.5" value={r.startHour} onChange={(e) => updateRow(i, { startHour: e.target.value })} style={smallInput} />
              <span style={{ fontSize: 12, color: "#8B8A80" }}>– {t("prices.zoneTo").toLowerCase()}</span>
              <input type="number" step="0.5" value={r.endHour} onChange={(e) => updateRow(i, { endHour: e.target.value })} style={smallInput} />
              <span style={{ fontSize: 12, color: "#8B8A80" }}>h ·</span>
              <input type="number" step="0.1" value={r.pricePerHour} onChange={(e) => updateRow(i, { pricePerHour: e.target.value })} style={smallInput} />
              <span style={{ fontSize: 12, color: "#8B8A80" }}>{t("prices.zonePricePerHour")}</span>
              <button type="button" onClick={() => removeRow(i)} style={{ fontSize: 11, fontWeight: 600, padding: "5px 9px", borderRadius: 6, border: `1px solid ${TOKENS.clay}`, background: "#fff", color: TOKENS.clay, cursor: "pointer", marginLeft: "auto" }}>
                {t("prices.zoneRemove")}
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14 }}>{r.startHour}–{r.endHour}h — {t("booking.priceLabel")(r.pricePerHour)}</span>
          )}
        </div>
      ))}
      {isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <button type="button" onClick={addRow} style={{ fontSize: 11, fontWeight: 600, padding: "5px 9px", borderRadius: 6, border: `1px solid ${TOKENS.line}`, background: "#fff", color: TOKENS.ink, cursor: "pointer" }}>
            {t("prices.zoneAdd")}
          </button>
          <button type="button" onClick={save} disabled={busy || !dirty} style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 7, border: `1px solid ${TOKENS.green}`, background: TOKENS.green, color: "#fff", cursor: "pointer", opacity: busy || !dirty ? 0.5 : 1 }}>
            {t("prices.zoneSave")}
          </button>
          {saved && !dirty && <span style={{ fontSize: 12, color: TOKENS.green, fontWeight: 600 }}>✓ {t("prices.zoneSaved")}</span>}
        </div>
      )}
      {err && <p style={{ fontSize: 12, color: TOKENS.clay, marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${TOKENS.line}`, fontSize: 14 }}>
      <span style={{ color: "#3F3E38" }}>{label}</span>
      <span style={{ fontWeight: 600, color: TOKENS.ink, whiteSpace: "nowrap", marginLeft: 12 }}>{value}</span>
    </div>
  );
}

function PriceGroup({ title, rows, note }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: TOKENS.green }}>{title}</h3>
      {rows.map((r, i) => <PriceRow key={i} label={r.label} value={r.value} />)}
      {note && <p style={{ fontSize: 12, color: "#8B8A80", margin: "10px 0 0" }}>{note}</p>}
    </div>
  );
}

export default function PriceList({ priceRules, isAdmin, onSaveZones }) {
  const { t } = useLang();
  const prices = t("prices");
  const rules = priceRules || [];
  const tenisRules = rules.filter((r) => r.sport === "Tenis").sort((a, b) => a.sort_order - b.sort_order);
  const padelRules = rules.filter((r) => r.sport === "Padel").sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{prices.zoneTitle}</h2>
      <p style={{ fontSize: 13, color: "#8B8A80", margin: "0 0 14px" }}>{prices.zoneNote}</p>
      <ZoneSportEditor sport="Tenis" sportLabel={t("booking.sportTennis")} rules={tenisRules} isAdmin={isAdmin} onSave={onSaveZones} t={t} />
      <ZoneSportEditor sport="Padel" sportLabel={t("booking.sportPadel")} rules={padelRules} isAdmin={isAdmin} onSave={onSaveZones} t={t} />

      <div style={{ ...card, marginTop: 20, marginBottom: 20, background: "#F6E3D8", border: `1px solid #E9C4AB` }}>
        <p style={{ margin: 0, fontSize: 14, color: TOKENS.clayDark, fontWeight: 600 }}>
          {prices.membershipNotice}
        </p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{prices.summer.heading}</h2>
      <p style={{ fontSize: 13, color: "#8B8A80", margin: "0 0 14px" }}>{prices.summer.zones}</p>
      {prices.summer.groups.map((g, i) => <PriceGroup key={i} title={g.title} rows={g.rows} note={g.note} />)}

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 4px" }}>{prices.winter.heading}</h2>
      {prices.winter.groups.map((g, i) => <PriceGroup key={i} title={g.title} rows={g.rows} note={g.note} />)}

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 4px" }}>{prices.booking.heading}</h2>
      {prices.booking.groups.map((g, i) => <PriceGroup key={i} title={g.title} rows={g.rows} note={g.note} />)}

      <p style={{ fontSize: 12, color: "#B5B3A8", marginTop: 16 }}>
        {prices.footerNote}
      </p>
    </div>
  );
}
