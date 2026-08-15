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

const DAY_NAMES = ["ned", "pon", "uto", "sre", "čet", "pet", "sub"];

export function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function fmtDay(d) {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
