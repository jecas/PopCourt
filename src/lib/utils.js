export function hourLabel(h) {
  const hh = Math.floor(h);
  const mm = h % 1 === 0 ? "00" : "30";
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

export function hoursUntil(dateStr, hour) {
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
  return (d.getTime() - Date.now()) / 3600000;
}

export function dateKey(d) {
  // Namerno NE koristi toISOString() — ono konvertuje u UTC, pa bi u
  // vremenskim zonama ispred UTC (npr. Srbija) datum ponoći bio "juce".
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDay(d, dayNames) {
  return `${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
}

export function fmtLongDate(d, dayNamesLong, monthNamesShort) {
  return `${dayNamesLong[d.getDay()]}, ${d.getDate()}. ${monthNamesShort[d.getMonth()]} ${d.getFullYear()}.`;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cena po satu za dati sport u datom trenutku dana (null ako nijedno pravilo ne pokriva taj sat).
export function priceForSlot(priceRules, sport, hour) {
  const rule = priceRules.find((r) => r.sport === sport && hour >= r.start_hour && hour < r.end_hour);
  return rule ? rule.price_per_hour : null;
}

// Sabira cenu rezervacije pola sata po pola sata — ogledalo compute_booking_price() u bazi,
// koristi se samo za prikaz pre slanja; stvarnu cenu uvek računa i naplaćuje baza.
export function computeBookingPrice(priceRules, sport, startHour, duration) {
  let total = 0;
  for (let h = startHour; h < startHour + duration; h += 0.5) {
    const rate = priceForSlot(priceRules, sport, h);
    if (rate == null) return null;
    total += rate * 0.5;
  }
  return Math.round(total * 100) / 100;
}

export function buildBracket(players) {
  let size = 2;
  while (size < players.length) size *= 2;
  const padded = [...players];
  while (padded.length < size) padded.push(null);
  const shuffled = shuffle(padded);
  const rounds = [];
  let current = [];
  for (let i = 0; i < shuffled.length; i += 2) current.push({ a: shuffled[i], b: shuffled[i + 1] });
  rounds.push(current);
  let count = current.length;
  while (count > 1) {
    count = count / 2;
    rounds.push(Array.from({ length: count }, () => ({ a: null, b: null })));
  }
  return rounds;
}
