# PopCourt

Sajt teniskog centra PopCourt — rezultati uživo, žreb turnira, rezervacija terena i cenovnik.
Frontend: React + Vite. Backend: Supabase (Postgres baza, autentikacija, realtime).

## Šta je urađeno

- Sve što je u prototipu čuvano privremeno (`window.storage`) sada se čuva u pravoj Postgres bazi na Supabase-u.
- Prijava/registracija ide preko Supabase Auth (lozinke su heširane, ne čuvaju se kao tekst).
- Uvedene su uloge: `player` (igrač), `coach` (trener), `referee` (sudija), `admin`. Podrazumevana uloga pri registraciji je `player`; ostale uloge dodeljuje administrator kluba ručno (objašnjeno niže).
- Samo `referee`/`admin` mogu da menjaju rezultat meča; samo `coach`/`admin` mogu da generišu i objave žreb — ovo se proverava i na frontend-u i u bazi (RLS), tako da se ne može zaobići pozivom API-ja direktno.
- Rezervacije terena: baza sama sprečava da dva termina na istom terenu preklope (exclusion constraint), pored provere u aplikaciji (najranija rezervacija 1h unapred, otkazivanje najkasnije 24h unapred).
- Rezultati, rezervacije i žreb se ažuriraju uživo kod svih otvorenih sajtova (Supabase Realtime), bez ručnog refresh-a stranice.

## 1. Preduslovi na tvom laptopu

- **Node.js** verzija 20 ili novija (uključuje `npm`). Preuzimanje: https://nodejs.org (uzmi LTS verziju).
  Proveri instalaciju u terminalu:
  ```
  node -v
  npm -v
  ```
- **Git** (obično već instaliran na Mac/Linux; na Windows-u preuzmi sa https://git-scm.com).
- Nalog na https://supabase.com (besplatan je za ovakav projekat).

## 2. Preuzimanje koda

```bash
git clone https://github.com/jecas/PopCourt.git
cd PopCourt
git checkout claude/web-modernization-k8e6bm
npm install
```

## 3. Napraviti Supabase projekat

1. Idi na https://supabase.com/dashboard i uloguj se (ili napravi nalog).
2. Klikni **New project**. Izaberi ime (npr. `popcourt`), lozinku za bazu (sačuvaj je negde), region (najbliži, npr. Frankfurt), i sačekaj minut-dva da se projekat pokrene.
3. U levom meniju otvori **SQL Editor** → **New query**.
4. Otvori fajl `supabase/schema.sql` iz ovog repozitorijuma, kopiraj ceo sadržaj, nalepi u editor i klikni **Run**.
   - Ovo pravi sve tabele (profili, tereni, mečevi, žreb, rezervacije), sigurnosna pravila (RLS) i uključuje realtime.
   - Na kraju fajla su i 4 primera meča za probu — obriši te redove iz SQL-a pre pokretanja ako ih ne želiš.
5. Idi na **Authentication → Providers → Email** i isključi opciju **Confirm email**. Aplikacija koristi izmišljene email adrese (npr. `ana.anic@popcourt.local`) da bi prijava mogla da radi preko korisničkog imena — na te adrese se ne može poslati pravi mejl za potvrdu, pa potvrda mora biti isključena da bi registracija radila.

## 4. Poveži aplikaciju sa Supabase projektom

1. U Supabase dashboard-u idi na **Project Settings → API**.
2. Kopiraj **Project URL** i **anon public** ključ.
3. U folderu projekta napravi fajl `.env.local` (kopija `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
4. Otvori `.env.local` i upiši svoje vrednosti:
   ```
   VITE_SUPABASE_URL=https://tvoj-projekat.supabase.co
   VITE_SUPABASE_ANON_KEY=tvoj-anon-public-kljuc
   ```
   Ovaj fajl se ne komituje u git (već je u `.gitignore`).

## 5. Pokretanje lokalno

```bash
npm run dev
```

Otvori u browseru adresu koju ispiše terminal (obično `http://localhost:5173`).

Za probu registruj korisnika kroz formu na sajtu (tab **Rezervacija terena** → Napravi nalog) — automatski dobija ulogu `player`.

## 6. Dodela uloga trener / sudija / admin

Nema posebne stranice za to (namerno — to radi neko ko upravlja klubom, ne bilo ko sa sajta). Kad neko napravi nalog, u Supabase dashboard-u:

- **Table Editor → profiles** → pronađi red po `username`, otvori i promeni `role` u `coach`, `referee` ili `admin`, sačuvaj.
- Ili preko **SQL Editor**:
  ```sql
  update public.profiles set role = 'referee' where username = 'ime.prezime';
  ```

Osoba treba da se ponovo uloguje (ili osveži stranicu) da bi videla nova ovlašćenja.

## 7. Build za produkciju (opciono)

```bash
npm run build     # pravi optimizovan build u folderu dist/
npm run preview   # servira taj build lokalno radi provere
```

Za pravo hostovanje (Vercel, Netlify i sl.) dovoljno je povezati repo i podesiti iste `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` environment varijable na hosting servisu.

## Struktura projekta

```
supabase/schema.sql       SQL šema, RLS pravila, realtime — pokrenuti u Supabase SQL Editoru
src/lib/supabaseClient.js Supabase klijent (čita .env.local)
src/lib/api.js            Sve funkcije koje pričaju sa bazom (auth, mečevi, rezervacije, žreb)
src/lib/utils.js          Pomoćne funkcije (datumi, žreb algoritam...)
src/components/           React komponente (MatchCard, BookingCalendar, DrawTool, LoginBox, PriceList...)
src/App.jsx               Glavna stranica — navigacija, tabovi, povezivanje podataka i komponenti
```
