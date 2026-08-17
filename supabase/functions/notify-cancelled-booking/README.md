# Mejl obaveštenje kad admin otkaže tuđu rezervaciju

Ovo je jedini deo aplikacije koji ne radi "sam od sebe" posle pokretanja
SQL migracije — mejlovi koji NISU deo Supabase login/registracije (kao
što je ovo obaveštenje) moraju da idu preko posebne funkcije ("Edge
Function") i pravog mejl servisa. Ovo se podešava jednom, ručno, u par
koraka.

## 1. Napravi besplatan Resend nalog

Idi na [resend.com](https://resend.com), napravi nalog (besplatan plan:
100 mejlova dnevno / 3.000 mesečno, dovoljno za klub). U **API Keys**
napravi novi ključ i sačuvaj ga — to je `RESEND_API_KEY`.

Za pravo slanje (ne samo test) kasnije ćeš u Resend-u dodati i potvrditi
svoj domen (**Domains → Add Domain**) da mejlovi ne padaju u spam. Dok to
ne uradiš, pošiljalac ostaje `onboarding@resend.dev` i Resend dozvoljava
slanje samo na tvoju sopstvenu (verifikovanu) adresu — dovoljno za
testiranje, ne i za prave članove kluba.

## 2. Poveži projekat sa Supabase CLI

**Ne instaliraj `supabase` preko `npm install -g`** — Supabase to zvanično
ne podržava, komanda ume da "prođe" instalaciju ali `supabase` posle
ostane nepoznata komanda (`command not found`). Umesto toga koristi
`npx` — stavi `npx ` ispred svake komande, ništa se globalno ne
instalira, i uvek radi:

```bash
npx supabase login
```

Otvoriće se browser da se prijaviš na Supabase nalog. U folderu projekta
(`.../PopCourt`, ne u `supabase` podfolderu):

```bash
npx supabase link --project-ref <tvoj-project-ref>
```

`<tvoj-project-ref>` nalaziš u Supabase dashboard-u → Project Settings →
General → Reference ID.

## 3. Postavi tajne (secrets) za funkciju

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
npx supabase secrets set NOTICE_SENDER_EMAIL=onboarding@resend.dev
```

(Kad potvrdiš svoj domen u Resend-u, promeni `NOTICE_SENDER_EMAIL` na
npr. `obavestenja@tvojklub.rs`.)

## 4. Deploy funkcije

```bash
npx supabase functions deploy notify-cancelled-booking
```

## 5. Napravi Database Webhook

U Supabase dashboard-u: **Database → Webhooks → Create a new hook**.

- Name: `notify-cancelled-booking`
- Table: `admin_cancellation_notices`
- Events: samo **Insert**
- Type: **Supabase Edge Functions**
- Edge Function: `notify-cancelled-booking`

Sačuvaj. Od sada, svaki put kad admin otkaže rezervaciju nekom drugom
korisniku, taj korisnik dobija mejl na adresu sa kojom je registrovan.

## Provera da li radi

U SQL Editoru možeš ručno ubaciti test-red i proveriti da li mejl stigne:

```sql
insert into public.admin_cancellation_notices (booking_user_id, court_id, booking_date, start_hour, duration, cancelled_by)
values ('<id-nekog-korisnika>', 1, current_date, 9, 1, '<tvoj-admin-id>');
```

Ako mejl ne stigne, proveri logove funkcije: **Edge Functions →
notify-cancelled-booking → Logs** u dashboard-u.
