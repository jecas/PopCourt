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
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return data.subscription;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function updateOwnProfile(userId, { fullName, phone, birthDate }) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone, birth_date: birthDate || null })
    .eq("id", userId);
  if (error) throw error;
}

// ---------- Admin: users ----------

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data;
}

export async function adminUpdateProfile(id, { credits, role }) {
  const patch = {};
  if (credits !== undefined) patch.credits = credits;
  if (role !== undefined) patch.role = role;
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- Club settings ----------

export async function fetchClubSettings() {
  const { data, error } = await supabase.from("club_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function updateClubSettings({ name, address, phone }) {
  const { error } = await supabase
    .from("club_settings")
    .update({ name, address, phone, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

export function subscribeClubSettings(onChange) {
  return supabase
    .channel("club-settings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "club_settings" }, onChange)
    .subscribe();
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

export async function createMatch({ sport, round, player1, player2, courtId, status, scheduledTime, drawId, roundIndex, matchIndex }) {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      sport,
      round,
      player1,
      player2,
      court_id: courtId,
      status,
      scheduled_time: status === "scheduled" ? scheduledTime : null,
      sets: status === "live" ? [[0, 0]] : [],
      draw_id: drawId ?? null,
      round_index: roundIndex ?? null,
      match_index: matchIndex ?? null,
    })
    .select()
    .single();
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

// Zavrsavanje meca ide kroz ovu funkciju umesto plain update-a — automatski
// upisuje pobednika u sledece kolo zreba ako je mec vezan za bracket slot.
export async function finishMatch(id, sets) {
  const { error } = await supabase.rpc("finish_match", { p_match_id: id, p_sets: sets });
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

export async function fetchMyUpcomingBookings(userId, from) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, courts(name)")
    .eq("user_id", userId)
    .gte("booking_date", from)
    .order("booking_date")
    .order("start_hour");
  if (error) throw error;
  return data;
}

export async function fetchMyPastBookings(userId, before) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, courts(name)")
    .eq("user_id", userId)
    .lt("booking_date", before)
    .order("booking_date", { ascending: false })
    .order("start_hour", { ascending: false });
  if (error) throw error;
  return data;
}

// Rezervacija i otkazivanje idu kroz Postgres funkcije (book_court/cancel_booking) koje
// atomicno proveravaju i troše/vraćaju kredite — direktan insert/delete na tabeli je odbijen.
export async function createBooking({ courtId, bookingDate, startHour, duration }) {
  const { data, error } = await supabase.rpc("book_court", {
    p_court_id: courtId,
    p_booking_date: bookingDate,
    p_start_hour: startHour,
    p_duration: duration,
  });
  if (error) throw error;
  return data;
}

export async function cancelBooking(id) {
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
  if (error) throw error;
}

export function subscribeBookings(onChange) {
  return supabase
    .channel("bookings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, onChange)
    .subscribe();
}
