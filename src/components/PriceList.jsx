import { TOKENS, card } from "../constants";

function PriceRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${TOKENS.line}`, fontSize: 14 }}>
      <span style={{ color: "#3F3E38" }}>{label}</span>
      <span style={{ fontWeight: 600, color: TOKENS.ink, whiteSpace: "nowrap", marginLeft: 12 }}>{value}</span>
    </div>
  );
}

function PriceGroup({ title, children }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: TOKENS.green }}>{title}</h3>
      {children}
    </div>
  );
}

export default function PriceList() {
  return (
    <div>
      <div style={{ ...card, marginBottom: 20, background: "#F6E3D8", border: `1px solid #E9C4AB` }}>
        <p style={{ margin: 0, fontSize: 14, color: TOKENS.clayDark, fontWeight: 600 }}>
          Godišnja članarina je 1.500 din, za uplate do 1. avgusta.
        </p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Letnji period (april–oktobar)</h2>
      <p style={{ fontSize: 13, color: "#8B8A80", margin: "0 0 14px" }}>Zona 1: 07–17h. Zona 2: 17–24h.</p>

      <PriceGroup title="Cena terena za članove kluba">
        <PriceRow label="Zona 1 (07–17h) — 1h" value="800 din" />
        <PriceRow label="Zona 2 (17–24h) — 1h" value="900 din" />
      </PriceGroup>

      <PriceGroup title="Cena terena za klupske trenere">
        <PriceRow label="Zona 1 (07–17h) — 1h" value="700 din" />
        <PriceRow label="Zona 2 (17–24h) — 1h" value="800 din" />
        <p style={{ fontSize: 12, color: "#8B8A80", margin: "10px 0 0" }}>
          Treneri imaju obavezu da uplate godišnju članarinu za decu koju treniraju kako bi ostvarili popust za terene.
        </p>
      </PriceGroup>

      <PriceGroup title="Cena terena za goste kluba">
        <PriceRow label="Zona 1 (07–17h) — 1h" value="1.000 din" />
        <PriceRow label="Zona 2 (17–24h) — 1h" value="1.200 din" />
      </PriceGroup>

      <PriceGroup title="Za firme, strance, strane trenere">
        <PriceRow label="Otvoreni tereni — 1h" value="1.500 din" />
        <PriceRow label="Pokriveni tereni — 1h" value="2.000 din" />
        <PriceRow label="Zimski period — 1h" value="2.500 din" />
      </PriceGroup>

      <PriceGroup title="Dodatni troškovi za fizička lica">
        <PriceRow label="Doplata za halu — 1h (uračunato u cenu termina u hali)" value="600 din" />
        <PriceRow label="Renta tenis reketa — 1h (loptice gratis)" value="200 din" />
        <PriceRow label="Špananje žica na reketu" value="600 din" />
      </PriceGroup>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 4px" }}>Zimski period (1. novembar 2025 – 1. april 2026)</h2>
      <PriceGroup title="Cena zakupa terena">
        <PriceRow label="Termini do 13h — 1h" value="2.000 din" />
        <PriceRow label="Termini 13–17h i posle 21h — 1h" value="2.200 din" />
        <PriceRow label="Termini 17–21h — 1h" value="2.400 din" />
        <p style={{ fontSize: 12, color: "#8B8A80", margin: "10px 0 0" }}>
          Svi korisnici sa izmirenom članarinom za tekuću godinu i otvorenim elektronskim nalogom ostvaruju popust od 100 do 300 din po satu.
        </p>
      </PriceGroup>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 4px" }}>Zakazivanje i otkazivanje</h2>
      <PriceGroup title="Pravila rezervacije">
        <PriceRow label="1 kredit" value="1h tenisa" />
        <PriceRow label="1.5 kredit" value="1h 30min tenisa" />
        <PriceRow label="2 kredit" value="2h tenisa" />
        <PriceRow label="Najkasnija rezervacija termina" value="1h pre termina" />
        <PriceRow label="Najkasnije otkazivanje termina" value="24h pre termina" />
        <PriceRow label="Trajanje termina po danu" value="od 1h do 2h" />
        <p style={{ fontSize: 12, color: "#8B8A80", margin: "10px 0 0" }}>
          Za termine od 00h do 07h, kao i za termine duže od 2h, potreban je poziv radi rezervacije.
        </p>
      </PriceGroup>

      <p style={{ fontSize: 12, color: "#B5B3A8", marginTop: 16 }}>
        Cene važe od 1.11.2024. TC PopCourt zadržava pravo korekcije rasporeda u slučaju organizacionih potreba kluba.
      </p>
    </div>
  );
}
