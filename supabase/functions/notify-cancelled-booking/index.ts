// Edge Function: notify-cancelled-booking
//
// Poziva je Database Webhook na INSERT u public.admin_cancellation_notices
// (ta tabela dobija po jedan red samo kad ADMIN otkaže rezervaciju NEKOM
// DRUGOM korisniku — vidi cancel_booking() u supabase/schema.sql).
//
// Šalje mejl vlasniku otkazanog termina preko Resend-a (resend.com).
// Podešavanje je opisano u README.md u ovom folderu.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("NOTICE_SENDER_EMAIL") ?? "onboarding@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function hourLabel(h: number) {
  const hh = Math.floor(h);
  const mm = h % 1 === 0 ? "00" : "30";
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const notice = payload.record;
    if (!notice) return new Response("Nema record-a u webhook payload-u.", { status: 400 });

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY nije podešen — mejl nije poslat.");
      return new Response("RESEND_API_KEY missing", { status: 200 });
    }

    const [{ data: profile }, { data: court }] = await Promise.all([
      supabase.from("profiles").select("username, full_name").eq("id", notice.booking_user_id).single(),
      notice.court_id
        ? supabase.from("courts").select("name").eq("id", notice.court_id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (!profile?.username) {
      console.error("Profil ili email nije pronađen za", notice.booking_user_id);
      return new Response("Profile/email not found", { status: 200 });
    }

    const courtName = court?.name ?? "teren";
    const when = `${notice.booking_date} u ${hourLabel(notice.start_hour)}`;
    const greeting = profile.full_name ? `Zdravo ${profile.full_name},` : "Zdravo,";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: profile.username,
        subject: "Vaša rezervacija je otkazana",
        text: `${greeting}\n\nAdministrator kluba je otkazao vašu rezervaciju termina:\n\n${courtName}, ${when}\n\nAko imate pitanja, obratite se klubu.`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend greška:", errText);
      return new Response(errText, { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
