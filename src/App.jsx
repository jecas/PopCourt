import { useCallback, useEffect, useState } from "react";
import {
  Menu, X, RadioTower, Trophy, MapPin, Phone, ChevronRight, Lock, LogIn, LogOut,
} from "lucide-react";

import { TOKENS, NAV_ITEMS, CLUB_ADDRESS, MAP_QUERY, card } from "./constants";
import { dateKey } from "./lib/utils";
import { useLang } from "./lib/i18n.jsx";
import { LANGUAGES } from "./lib/translations";
import * as api from "./lib/api";
import { supabase } from "./lib/supabaseClient";

import MatchCard from "./components/MatchCard";
import AddMatchForm from "./components/AddMatchForm";
import BracketView from "./components/BracketView";
import DrawTool from "./components/DrawTool";
import LoginBox from "./components/LoginBox";
import BookingCalendar from "./components/BookingCalendar";
import PriceList from "./components/PriceList";

const BOOKING_WINDOW_DAYS = 14;

export default function App() {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState("home");
  const [refereeMode, setRefereeMode] = useState(false);

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [matches, setMatches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [draw, setDraw] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState("");

  // ---------- auth bootstrap ----------
  useEffect(() => {
    let cancelled = false;
    api.getSession().then((s) => { if (!cancelled) setSession(s); });
    const sub = api.onAuthStateChange((s) => setSession(s));
    return () => { cancelled = true; sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!session?.user) { setProfile(null); setAuthReady(true); return; }
      try {
        const p = await api.fetchProfile(session.user.id);
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [session]);

  const user = session?.user && profile ? { id: session.user.id, name: profile.full_name, role: profile.role } : null;
  const canScoreMatches = profile?.role === "referee" || profile?.role === "admin";
  const canManageDraw = profile?.role === "coach" || profile?.role === "admin";

  // ---------- data loading ----------
  const bookingRange = { from: dateKey(new Date()), to: dateKey(new Date(Date.now() + BOOKING_WINDOW_DAYS * 86400000)) };

  const refreshMatches = useCallback(() => api.fetchMatches().then(setMatches).catch((e) => setDataError(e.message)), []);
  const refreshDraw = useCallback(() => api.fetchLatestDraw().then(setDraw).catch((e) => setDataError(e.message)), []);
  const refreshBookings = useCallback(() => {
    if (!session) { setBookings([]); return; }
    api.fetchBookings(bookingRange).then(setBookings).catch((e) => setDataError(e.message));
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const [c, m, d] = await Promise.all([api.fetchCourts(), api.fetchMatches(), api.fetchLatestDraw()]);
        if (cancelled) return;
        setCourts(c);
        setMatches(m);
        setDraw(d);
      } catch (e) {
        if (!cancelled) setDataError(e.message);
      } finally {
        if (!cancelled) setDataReady(true);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { refreshBookings(); }, [refreshBookings]);

  useEffect(() => {
    const matchesCh = api.subscribeMatches(refreshMatches);
    const drawCh = api.subscribeDraws(refreshDraw);
    const bookingsCh = api.subscribeBookings(refreshBookings);
    return () => {
      supabase.removeChannel(matchesCh);
      supabase.removeChannel(drawCh);
      supabase.removeChannel(bookingsCh);
    };
  }, [refreshMatches, refreshDraw, refreshBookings]);
  
  // ---------- document title (per section/language, helps browser tabs & shared links) ----------
  useEffect(() => {
    document.title = tab === "home" ? t("home.title") : `${t(`nav.${tab}`)} — PopCourt`;
  }, [tab, lang, t]);

  // ---------- handlers ----------
  const handleSignIn = async (creds) => { await api.signIn(creds); };
  const handleSignUp = async (creds) => { await api.signUp(creds); };
  const handleSignOut = async () => { await api.signOut(); setTab("results"); };

  const handleUpdateMatch = async (id, patch) => {
    await api.updateMatch(id, patch);
    refreshMatches();
  };

  const handleCreateMatch = async (matchData) => {
    await api.createMatch(matchData);
    refreshMatches();
  };

  const handleGenerateDraw = async ({ players, rounds, createdBy }) => {
    const created = await api.createDraw({ players, rounds, createdBy });
    setDraw(created);
  };

  const handlePublishDraw = async (id) => {
    await api.publishDraw(id);
    refreshDraw();
  };

  const handleBook = async ({ courtId, bookingDate, startHour, duration }) => {
    await api.createBooking({ courtId, bookingDate, startHour, duration, userId: user.id });
    refreshBookings();
  };

  const handleCancelBooking = async (id) => {
    await api.cancelBooking(id);
    refreshBookings();
  };

  const liveMatches = matches.filter((m) => m.status === "live");
  const otherMatches = matches.filter((m) => m.status !== "live");
  const visibleNav = NAV_ITEMS.filter((item) => item !== "draw" || canManageDraw);

  const LangSwitcher = ({ mobile }) => (
    <div style={{ display: "flex", gap: 4, ...(mobile ? { padding: "14px 20px" } : {}) }}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          style={{
            fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 5,
            border: `1px solid ${lang === l.code ? TOKENS.ball : "rgba(255,255,255,0.3)"}`,
            background: lang === l.code ? TOKENS.ball : "transparent",
            color: lang === l.code ? TOKENS.greenDark : "#F6F2E9",
            cursor: "pointer",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: TOKENS.chalk, minHeight: "100%", color: TOKENS.ink }}>
      <style>{`
        @keyframes pc-pulse { 0%,100% { opacity:1; transform:scale(1);} 50% { opacity:.35; transform:scale(1.3);} }
        .pc-navlink { position:relative; padding:8px 2px; font-size:14px; font-weight:500; color:#F6F2E9; cursor:pointer; background:none; border:none; }
        .pc-navlink.active { color:${TOKENS.ball}; }
        .pc-mobile-link { padding:14px 20px; font-size:15px; font-weight:500; color:#F6F2E9; border-bottom:1px solid rgba(255,255,255,0.08); cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        .pc-mobile-link.active { color:${TOKENS.ball}; }
        @media (min-width: 800px) { .pc-desktop-nav { display: flex !important; } .pc-menu-btn { display: none !important; } }
      `}</style>

      <header style={{ background: TOKENS.green, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: TOKENS.clay, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trophy size={18} color="#fff" />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>PopCourt</span>
          </div>

          <nav style={{ display: "none", gap: 18, alignItems: "center" }} className="pc-desktop-nav">
            {visibleNav.map((item) => <button key={item} className={`pc-navlink ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{t(`nav.${item}`)}</button>)}
            {user ? (
              <button className="pc-navlink" onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 5 }}><LogOut size={14} /> {user.name}</button>
            ) : (
              <button className="pc-navlink" onClick={() => setTab("booking")} style={{ display: "flex", alignItems: "center", gap: 5 }}><LogIn size={14} /> {t("nav.login")}</button>
            )}
            <LangSwitcher />
          </nav>

          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Meni" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex" }} className="pc-menu-btn">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {visibleNav.map((item) => (
              <div key={item} className={`pc-mobile-link ${tab === item ? "active" : ""}`} onClick={() => { setTab(item); setMenuOpen(false); }}>
                {t(`nav.${item}`)}<ChevronRight size={16} />
              </div>
            ))}
            <div className="pc-mobile-link" onClick={() => { user ? handleSignOut() : setTab("booking"); setMenuOpen(false); }}>
              {user ? `${t("nav.logoutPrefix")} (${user.name})` : t("nav.login")}
              {user ? <LogOut size={16} /> : <LogIn size={16} />}
            </div>
            <LangSwitcher mobile />
          </div>
        )}
      </header>

      <div style={{ background: TOKENS.greenDark, color: "#F6F2E9", padding: "10px 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <RadioTower size={15} color={TOKENS.ball} />
          <span style={{ fontWeight: 600, color: TOKENS.ball }}>{t("live.banner")(liveMatches.length)}</span>
          <span style={{ color: "#B9C4BC" }}>{t("live.subtitle")}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 60px" }}>
        {dataError && <p style={{ color: TOKENS.clay, fontSize: 13, marginBottom: 16 }}>{dataError}</p>}

        {tab === "home" && (
          <section>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{t("home.title")}</h1>
            <p style={{ color: "#5A5950", fontSize: 15, maxWidth: 560, lineHeight: 1.6, marginBottom: 20 }}>
              {t("home.subtitle")}
            </p>
            {draw && draw.published ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Trophy size={18} color={TOKENS.clay} />
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t("home.drawTitle")}</h2>
                </div>
                <div style={{ ...card, overflowX: "auto" }}><BracketView bracket={draw.rounds} compact /></div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("home.drawEmpty")}</p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "26px 0 10px" }}>
              <MapPin size={18} color={TOKENS.clay} />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t("home.locationTitle")}</h2>
            </div>
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <iframe
                title="Lokacija terena"
                src={`https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`}
                width="100%"
                height="320"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: TOKENS.green, fontWeight: 600 }}
            >
              {t("home.openInMaps")}
            </a>
          </section>
        )}

        {tab === "results" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t("results.title")}</h2>
              {canScoreMatches && (
                <button onClick={() => setRefereeMode((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8, border: `1px solid ${refereeMode ? TOKENS.clay : TOKENS.line}`, background: refereeMode ? "#F6E3D8" : "#fff", color: refereeMode ? TOKENS.clayDark : "#6B6A63", cursor: "pointer" }}>
                  <Lock size={12} /> {refereeMode ? t("results.refereeOn") : t("results.refereeOff")}
                </button>
              )}
            </div>
            {canScoreMatches && refereeMode && <AddMatchForm courts={courts} onCreate={handleCreateMatch} />}
            {!dataReady ? <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                  {liveMatches.map((m) => <MatchCard key={m.id} match={m} canScore={canScoreMatches && refereeMode} onUpdate={handleUpdateMatch} />)}
                </div>
                {otherMatches.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8B8A80", textTransform: "uppercase", letterSpacing: "0.04em", margin: "26px 0 12px" }}>{t("results.otherMatches")}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                      {otherMatches.map((m) => <MatchCard key={m.id} match={m} canScore={canScoreMatches && refereeMode} onUpdate={handleUpdateMatch} />)}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {tab === "draw" && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{t("draw.title")}</h2>
            <p style={{ color: "#6B6A63", fontSize: 14, margin: "0 0 18px" }}>
              {t("draw.subtitle")}
            </p>
            {!authReady ? <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p> :
              !canManageDraw ? <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("draw.restricted")}</p> :
              <DrawTool user={user} draw={draw} onGenerate={handleGenerateDraw} onPublish={handlePublishDraw} />}
          </section>
        )}

        {tab === "booking" && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{t("booking.title")}</h2>
            <p style={{ color: "#6B6A63", fontSize: 14, margin: "0 0 18px" }}>
              {t("booking.subtitle")}
            </p>
            {!authReady ? <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p> :
              !user ? <LoginBox onSignIn={handleSignIn} onSignUp={handleSignUp} /> :
              !dataReady ? <p style={{ fontSize: 13, color: "#8B8A80" }}>{t("common.loading")}</p> :
              <BookingCalendar user={user} courts={courts} bookings={bookings} onBook={handleBook} onCancel={handleCancelBooking} />}
          </section>
        )}

        {tab === "prices" && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>{t("prices.title")}</h2>
            <PriceList />
          </section>
        )}
      </main>

      <footer style={{ background: TOKENS.greenDark, color: "#B9C4BC", padding: "22px 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {CLUB_ADDRESS}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} /> 060/3622-226</span>
        </div>
      </footer>
    </div>
  );
}
