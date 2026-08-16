export const TOKENS = {
  clay: "#B5502A", clayDark: "#8A3B1E", green: "#1F4D3D", greenDark: "#153A2E",
  chalk: "#F6F2E9", ball: "#C7DE2E", ink: "#1B1F1C", navy: "#223354", line: "#E4DCC9",
};

export const NAV_ITEMS = ["Naslovna", "Rezultati uživo", "Žreb", "Rezervacija terena", "Cenovnik"];

export const CLUB_ADDRESS = "Hipodrom, Bavaništanski put bb, Pančevo";

export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const SLOTS = Array.from({ length: (CLOSE_HOUR - OPEN_HOUR) * 2 }, (_, i) => OPEN_HOUR + i * 0.5);
export const DURATIONS = [1, 1.5, 2];

export const miniBtn = { width: 20, height: 20, borderRadius: 4, border: `1px solid ${TOKENS.line}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: TOKENS.green };
export const smallGhostBtn = { fontSize: 11, fontWeight: 600, padding: "5px 9px", borderRadius: 6, border: `1px solid ${TOKENS.line}`, background: "#fff", color: TOKENS.ink, cursor: "pointer", display: "flex", alignItems: "center" };
export const card = { background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: 10, padding: 18 };
