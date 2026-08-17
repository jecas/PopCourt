import { TOKENS, card } from "../constants";
import { useLang } from "../lib/i18n.jsx";

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

export default function PriceList() {
  const { t } = useLang();
  const prices = t("prices");

  return (
    <div>
      <div style={{ ...card, marginBottom: 20, background: "#F6E3D8", border: `1px solid #E9C4AB` }}>
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
