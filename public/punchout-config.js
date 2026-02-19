/**
 * PUNCHOUT KONFIGURASJON
 * ======================
 * Dette er den ENESTE filen du trenger å redigere for å tilpasse appen.
 * Lastes automatisk FØR motor.js — alle verdier er tilgjengelige ved oppstart.
 *
 * Seksjoner:
 *   1. LØNNSKODER        — koder som vises i timeark
 *   2. KJØRETØY          — kjøretøy som vises i daglig kjøretøysjekk
 *   3. SJA STANDARDVERDIER — forhåndsutfylte felt ved oppstart av SJA
 *   4. EKSTERNE LENKER   — knapper i startskjerm (Elrapp, Linx, osv.)
 *   5. TIMEARK           — hoved-ordre-nummer
 */

window.PUNCHOUT_CONFIG = {

  // ============================================================
  // 1. LØNNSKODER
  // Vises som valgmuligheter i timearket.
  // Legg til eller fjern koder etter behov.
  // Format: { kode: "KODE", label: "Visningsnavn" }
  // ============================================================
  lonnskoder: [
    { kode: "ORD",   label: "Ordinær" },
    { kode: "OT50",  label: "Overtid 50%" },
    { kode: "OT100", label: "Overtid 100%" },
    { kode: "NATT",  label: "Nattillegg" },
  ],

  // ============================================================
  // 2. KJØRETØY
  // Vises som hurtigvalg i daglig kjøretøysjekk-skjema.
  // Tomt array [] = fri tekst (ingen nedtrekksliste).
  // Format: "REGNR" eller "Regnr / Beskrivelse"
  // ============================================================
  kjoretoy: [
    "AB 12345",
    "CD 67890",
    "EF 11111",
  ],

  // ============================================================
  // 3. SJA STANDARDVERDIER
  // Forhåndsutfylte valgfrie felt ved oppstart av SJA-skjema.
  // Disse er alltid redigerbare av brukeren.
  // arbeidsvarsling: "ingen" | "enkel" | "manuell" | "full"
  // sted: fri tekst, tomt = ikke forhåndsutfylt
  // ============================================================
  sjaDefaults: {
    sted: "",
    arbeidsvarsling: "enkel",
  },

  // ============================================================
  // 4. EKSTERNE LENKER
  // Vises som knapper i startskjermen (pre-day fase).
  // Legg til, fjern eller endre lenker etter behov.
  // Format: { id: "unikt-id", title: "Visningsnavn", url: "https://..." }
  // ============================================================
  externalLinks: [
    { id: "elrapp", title: "Logg inn i Elrapp", url: "https://elrapp.no" },
    { id: "linx",   title: "Linx-innlogging",   url: "https://linx.no"  },
  ],

  // ============================================================
  // 5. TIMEARK
  // Hoved-ordre brukes for timeark-registrering.
  // Sett til ordrenkode som passer din organisasjon.
  // ============================================================
  hovedordre: "HOVED",

};
