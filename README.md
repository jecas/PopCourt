# PopCourt

Sajt teniskog centra PopCourt — rezultati uživo, žreb turnira, rezervacija terena i cenovnik.
Frontend: React + Vite. Backend: Supabase (Postgres baza, autentikacija, realtime).

## Šta je urađeno

- Prijava/registracija ide preko Supabase Auth (lozinke su heširane, ne čuvaju se kao tekst). Korisnik se registruje sa pravim email-om i dobija pravi mejl za potvrdu naloga; korisničko ime u bazi je automatski isto što i taj email.
- Uvedene su uloge: `player` (igrač), `coach` (trener), `referee` (sudija), `admin`. Podrazumevana uloga pri registraciji je `player`; ostale uloge dodeljuje administrator kluba ručno (objašnjeno niže).
- Samo `referee`/`admin` mogu da menjaju rezultat meča; samo `coach`/`admin` mogu da generišu i objave žreb — ovo se proverava i na frontend-u i u bazi (RLS), tako da se ne može zaobići pozivom API-ja direktno.
- Rezervacije terena: baza sama sprečava da dva termina na istom terenu preklope (exclusion constraint), pored provere u aplikaciji (najranija rezervacija 1h unapred, otkazivanje najkasnije 24h unapred).
- Rezultati, rezervacije i žreb se ažuriraju uživo kod svih otvorenih sajtova, bez ručnog refresh-a stranice.
- Korisnici mogu sami da resetuju zaboravljenu lozinku preko mejla.
- Admin nalog ima poseban tab **Podešavanja** gde može sam da promeni adresu i telefon kluba (prikazuju se u footeru i na mapi), bez potrebe da neko menja kod.
- Sajt ima stranice **Politika privatnosti** i **Uslovi korišćenja** (link u footeru), na sva 3 jezika. Ovo je osnovni predložak — pre komercijalne upotrebe (posebno kad budeš imala pravu firmu i klijente) preporučujem da ih pregleda advokat.
- **Sistem kredita**: svaki korisnik ima kredit, rezervacija termina troši kredite (1 kredit = 1h), otkazivanje ih vraća. Admin dodeljuje kredite ručno kroz tab **Korisnici**
- Tab **Moj nalog** — korisnik menja telefon/datum rođenja i lozinku, vidi svoje kredite.
- Tab **Moje rezervacije** — pregled predstojećih termina (sa otkazivanjem) i istorije prošlih termina.
- Raspored termina je u kalendarskom prikazu (tereni kao kolone, sati kao redovi) sa prekidačem Tenis/Padel tereni.
- Ime kluba, adresa i telefon su podešavanje (tab **Podešavanja**, samo admin).
- **Automatsko popunjavanje žreba**: kad se meč poveže sa mestom u žrebu (opcija u formi "Dodaj meč") i sudija ga završi, pobednik se sam upisuje u sledeće kolo žreba na naslovnoj strani.

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
git clone https://github.com/jecas/RezervacijaTerena.git
cd RezervacijaTerena
npm install
```

## 3. Napraviti Supabase projekat

1. Idi na https://supabase.com/dashboard i uloguj se (ili napravi nalog).
2. Klikni **New project**. Izaberi ime (npr. `rezervacijaTerena`), lozinku za bazu (sačuvaj je negde), region (najbliži, npr. Frankfurt), i sačekaj minut-dva da se projekat pokrene.
3. U levom meniju otvori **SQL Editor** → **New query**.
4. Otvori fajl `supabase/schema.sql` iz ovog repozitorijuma, kopiraj ceo sadržaj, nalepi u editor i klikni **Run**.
   - Ovo pravi sve tabele (profili, podešavanja kluba, tereni, mečevi, žreb, rezervacije), sigurnosna pravila (RLS) i uključuje realtime.
   - Na kraju fajla su i 4 primera meča za probu — obriši te redove iz SQL-a pre pokretanja ako ih ne želiš.
5. Da bi "Zaboravljena lozinka" radila, idi na **Authentication → URL Configuration** i u polje **Redirect URLs** dodaj adresu na kojoj sajt radi (za lokalni rad `http://localhost:5173`, kasnije i pravi domen kad ga budeš imala). Bez ovoga Supabase odbija link za reset lozinke.
6. Opcija **Confirm email** (Authentication → Sign In / Providers → Email) treba da ostane **uključena** (to je podrazumevano) — korisnici se registruju sa pravim email-om i moraju da kliknu na link u mejlu pre nego što mogu da se uloguju.
   - Supabase automatski šalje te mejlove preko svog ugrađenog mejl servisa — pod **Authentication → Emails → SMTP Settings** može podesiti sopstveni mejl provajder (npr. Resend, Gmail SMTP).
   - Mejlovi za potvrdu ponekad upadnu u spam/junk folder — proveri i tamo ako ne stigne odmah.

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

Za probu registruj korisnika kroz formu na sajtu (tab **Rezervacija terena** → Napravi nalog) sa svojim pravim email-om — dobićeš mejl za potvrdu, klikni na link, pa se uloguj. Novi nalog automatski dobija ulogu `player`.

## 6. Dodela uloga trener / sudija / admin

Nema posebne stranice za to (namerno — to radi neko ko upravlja klubom, ne bilo ko sa sajta). Kad neko napravi nalog, u Supabase dashboard-u:

- **Table Editor → profiles** → pronađi red po `username` (to je email osobe), otvori i promeni `role` u `coach`, `referee` ili `admin`, sačuvaj.
- Ili preko **SQL Editor**:
  ```sql
  update public.profiles set role = 'referee' where username = 'ime@primer.com';
  ```

Osoba treba da se ponovo uloguje (ili osveži stranicu) da bi videla nova ovlašćenja.

Uloge i krediti se sada mogu menjati i kroz sam sajt — uloguj se kao admin, idi na tab **Korisnici**, i tamo menjaj i ulogu i broj kredita bilo kog korisnika, bez SQL Editora.

**Napomena o pravom online plaćanju:** trenutni sistem kredita je "ručni" — korisnik uplati (na račun kluba ili u kešu), admin mu doda kredite kroz Korisnici tab. Da bi korisnici mogli sami da plate karticom na sajtu, potrebna je registrovana firma i ugovor sa licenciranim platnim procesorom (banka ili servis poput AllSecure/WSPay) — to je poseban korak van ovog koda.


## Struktura projekta

```
supabase/schema.sql       SQL šema, RLS pravila, realtime — pokrenuti u Supabase SQL Editoru
src/lib/supabaseClient.js Supabase klijent (čita .env.local)
src/lib/api.js            Sve funkcije koje pričaju sa bazom (auth, mečevi, rezervacije, žreb)
src/lib/utils.js          Pomoćne funkcije (datumi, žreb algoritam...)
src/components/           React komponente (MatchCard, BookingCalendar, DrawTool, LoginBox, PriceList...)
src/App.jsx               Glavna stranica — navigacija, tabovi, povezivanje podataka i komponenti
```
