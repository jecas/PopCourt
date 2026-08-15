import { supabase } from "./supabaseClient";

// ---------- Auth ----------
// Korisničko ime u profilu je uvek isto što i email (postavlja ga baza automatski, vidi supabase/schema.sql).

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// ---------- Courts ----------

export async function fetchCourts() {
  const { data, error } = await supabase.from("courts").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

// ---------- Matches ----------

export async function fetchMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("*, courts(name)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateMatch(id, patch) {
  const { error } = await supabase
    .from("matches")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function subscribeMatches(onChange) {
  return supabase
    .channel("matches-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, onChange)
    .subscribe();
}

// ---------- Draws ----------

export async function fetchLatestDraw() {
  const { data, error } = await supabase
    .from("draws")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDraw({ players, rounds, createdBy }) {
  const { data, error } = await supabase
    .from("draws")
    .insert({ players, rounds, published: false, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishDraw(id) {
  const { error } = await supabase.from("draws").update({ published: true }).eq("id", id);
  if (error) throw error;
}

export function subscribeDraws(onChange) {
  return supabase
    .channel("draws-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "draws" }, onChange)
    .subscribe();
}

// ---------- Bookings ----------

export async function fetchBookings({ from, to }) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, courts(name), profiles(full_name)")
    .gte("booking_date", from)
    .lte("booking_date", to);
  if (error) throw error;
  return data;
}

export async function createBooking({ courtId, bookingDate, startHour, duration, userId }) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({ court_id: courtId, booking_date: bookingDate, start_hour: startHour, duration, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelBooking(id) {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeBookings(onChange) {
  return supabase
    .channel("bookings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, onChange)
    .subscribe();
}
