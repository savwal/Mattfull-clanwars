// ---------------------------------------------------------------------------
// i18n — Internationalization support for redlös.
//
// Stores the user's language preference in localStorage('redlos_lang') and
// applies translations to any element carrying a [data-i18n="key"] attribute.
// Pages call applyLanguage() once on load; the settings popup calls it again
// when the user switches language.
// ---------------------------------------------------------------------------

(function () {
  var TRANSLATIONS = {
    // ── Navigation ──────────────────────────────────────────────────────
    nav_log: { sv: 'Log', en: 'Log' },
    nav_battles: { sv: 'Battles', en: 'Battles' },
    nav_events: { sv: 'Events', en: 'Events' },
    nav_clan: { sv: 'Klan', en: 'Clan' },
    nav_friends: { sv: 'Vänner', en: 'Friends' },
    nav_historik: { sv: 'Historik', en: 'History' },
    nav_profil: { sv: 'Profil', en: 'Profile' },

    // ── Index / Log page ────────────────────────────────────────────────
    log_graph_title: { sv: 'Blodflöde', en: 'Blood Flow' },
    log_legend_promille: { sv: 'Promille', en: 'BAC' },
    log_legend_tiger: { sv: 'Tiger Woods zone', en: 'Tiger Woods zone' },
    log_legend_fart: { sv: 'Farthållare', en: 'Speed Keeper' },
    log_legend_funzone: { sv: 'Funzone', en: 'Funzone' },
    log_legend_sangria: { sv: 'Sangriagränsen', en: 'Sangria Limit' },
    log_manual_title: { sv: 'Manuellt registrera', en: 'Manual Entry' },
    log_choose_drink: { sv: 'Välj dryck...', en: 'Choose drink...' },
    log_beer: { sv: 'Öl/Cider', en: 'Beer/Cider' },
    log_red_wine: { sv: 'Rött vin', en: 'Red Wine' },
    log_white_wine: { sv: 'Vitt vin', en: 'White Wine' },
    log_champagne: { sv: 'Champagne', en: 'Champagne' },
    log_spirits: { sv: 'Sprit', en: 'Spirits' },
    log_cocktail: { sv: 'Drink', en: 'Cocktail' },
    log_volume_ph: { sv: 'Volym (ml, t.ex. 330)', en: 'Volume (ml, e.g. 330)' },
    log_abv_ph: { sv: 'Alkoholhalt (%, t.ex. 5.0)', en: 'ABV (%, e.g. 5.0)' },
    log_register_btn: { sv: 'Registrera', en: 'Register' },
    log_tactical_title: { sv: 'Tactical Retreat', en: 'Tactical Retreat' },
    log_ulta_btn: { sv: 'ULTA (SPY)', en: 'ULTA (SPY)' },
    log_stats_label: { sv: 'STATS', en: 'STATS' },
    log_total_intake: { sv: 'Totalt intag:', en: 'Total intake:' },
    log_cl_unit: { sv: 'cl', en: 'cl' },
    log_alcohol: { sv: 'alkohol', en: 'alcohol' },
    log_estimated_bac: { sv: 'Uppskattad promille:', en: 'Estimated BAC:' },
    log_units_title: { sv: 'Enheter', en: 'Units' },
    log_planner_title: { sv: 'Schemalaggare', en: 'Planner' },
    log_planner_desc: { sv: 'Planera kvällen \u2014 se din promilleprognos innan du börjar.', en: 'Plan your night \u2014 see your BAC forecast before you start.' },
    log_planner_btn: { sv: 'Öppna planner \u2192', en: 'Open planner \u2192' },
    log_quick_add: { sv: 'Registrera snabbt', en: 'Quick add' },
    log_quick_menu: { sv: 'Snabbvals Menu', en: 'Quick Pick Menu' },

    // ── Profile page ────────────────────────────────────────────────────
    profile_name_title: { sv: 'Namn', en: 'Name' },
    profile_new_warrior: { sv: 'Ny Krigare', en: 'New Warrior' },
    profile_code_title: { sv: 'Din personliga kod', en: 'Your personal code' },
    profile_title: { sv: 'Profil', en: 'Profile' },
    profile_add_pic: { sv: 'Lägg till profilbild', en: 'Add profile picture' },
    profile_max_size: { sv: 'Max 1 MB', en: 'Max 1 MB' },
    profile_name_ph: { sv: 'Namn', en: 'Name' },
    profile_weight_ph: { sv: 'Vikt (kg)', en: 'Weight (kg)' },
    profile_gender_man: { sv: 'Man', en: 'Male' },
    profile_gender_kvinna: { sv: 'Kvinna', en: 'Female' },
    profile_funzone_label: { sv: 'Funzone gräns', en: 'Funzone limit' },
    profile_funzone_ph: { sv: 'Funzone gräns (‰)', en: 'Funzone limit (‰)' },
    profile_save: { sv: 'Spara', en: 'Save' },
    profile_logout: { sv: 'Logga Ut (Nollställ)', en: 'Log Out (Reset)' },
    profile_settings_title: { sv: 'Kontoinställningar', en: 'Account Settings' },
    profile_remove_pic: { sv: 'Ta bort profilbild', en: 'Remove profile picture' },
    profile_delete_account: { sv: 'Radera konto', en: 'Delete account' },
    profile_contact: { sv: 'Vid frågor, kontakta oss på', en: 'For questions, contact us at' },
    profile_scan_qr: { sv: 'Skanna QR-kod', en: 'Scan QR code' },
    profile_qr_title: { sv: 'Din QR-kod', en: 'Your QR code' },

    // ── Settings popup ──────────────────────────────────────────────────
    settings_title: { sv: 'Inställningar', en: 'Settings' },
    settings_language: { sv: 'Språk', en: 'Language' },
    settings_theme: { sv: 'Tema', en: 'Theme' },
    settings_theme_light: { sv: 'Ljust', en: 'Light' },
    settings_theme_dark: { sv: 'Mörkt', en: 'Dark' },
    settings_account: { sv: 'Konto', en: 'Account' },
    settings_gdpr: { sv: 'Dataskydd & GDPR', en: 'Data Protection & GDPR' },
    settings_gdpr_text: { sv: 'Vi försöker följa EU:s GDPR-lagar. Du kan radera ditt konto och all data när som helst.', en: 'We are trying to follow EU GDPR laws. You can delete your account and all data at any time.' },
    settings_logout: { sv: 'Logga ut', en: 'Log out' },
    settings_delete: { sv: 'Radera konto', en: 'Delete account' },
    settings_remove_pic: { sv: 'Ta bort profilbild', en: 'Remove profile picture' },
    settings_contact: { sv: 'Vid frågor, kontakta oss på', en: 'For questions, contact us at' },

    // ── Friends page ────────────────────────────────────────────────────
    friends_add_title: { sv: 'Lägg till vän', en: 'Add friend' },
    friends_hash_ph: { sv: 'Ange vännens hashkod', en: "Enter friend's hash code" },
    friends_add_btn: { sv: 'Lägg till', en: 'Add' },
    friends_list_title: { sv: 'Dina vänner', en: 'Your friends' },
    friends_live_title: { sv: 'Live Leaderboard', en: 'Live Leaderboard' },
    friends_weekly_title: { sv: 'Veckans Leaderboard', en: 'Weekly Leaderboard' },
    friends_show_all: { sv: 'Visa alla', en: 'Show all' },
    friends_remove: { sv: 'Ta bort', en: 'Remove' },
    friends_no_friends: { sv: 'Inga vänner ännu.', en: 'No friends yet.' },

    // ── Battles page ────────────────────────────────────────────────────
    battles_title: { sv: 'Battles', en: 'Battles' },
    battles_maintenance: { sv: 'Under underhåll', en: 'Under maintenance' },

    // ── Events page ─────────────────────────────────────────────────────
    events_title: { sv: 'Events', en: 'Events' },

    // ── Clans page ──────────────────────────────────────────────────────
    clans_title: { sv: 'Klan', en: 'Clan' },

    // ── Historik page ───────────────────────────────────────────────────
    historik_title: { sv: 'Historik', en: 'History' },

    // ── Register page ───────────────────────────────────────────────────
    register_about_title: { sv: 'Om redlös', en: 'About redlös' },
    register_title: { sv: 'Ny Krigare', en: 'New Warrior' },
    register_has_account: { sv: 'Har du redan ett konto?', en: 'Already have an account?' },
    register_hash_desc: { sv: 'Skriv in din personliga kod här och tryck på knappen för att logga in.', en: 'Enter your personal code here and press the button to log in.' },
    register_hash_ph: { sv: 'Personlig kod', en: 'Personal code' },
    register_or: { sv: '\u2014 eller \u2014', en: '\u2014 or \u2014' },
    register_new_users: { sv: 'Nya användare', en: 'New users' },
    register_new_desc: { sv: 'Lämna fältet ovan tomt och fyll i dina uppgifter nedan för att skapa en ny profil.', en: 'Leave the field above empty and fill in your details below to create a new profile.' },
    register_name_ph: { sv: 'Namn', en: 'Name' },
    register_weight_ph: { sv: 'Vikt (kg)', en: 'Weight (kg)' },
    register_gender_man: { sv: 'Man', en: 'Male' },
    register_gender_kvinna: { sv: 'Kvinna', en: 'Female' },
    register_funzone_ph: { sv: 'Funzone-gräns (‰) \u2013 t.ex. 1.0', en: 'Funzone limit (‰) \u2013 e.g. 1.0' },
    register_funzone_desc: { sv: 'Funzone-gränsen är promillenivån du siktar på \u2013 grafen blir grön när du når den.', en: 'The Funzone limit is the BAC level you aim for \u2013 the graph turns green when you reach it.' },
    register_continue: { sv: 'Fortsätt', en: 'Continue' },
    register_install: { sv: 'Installera / Lägg till på hemskärmen', en: 'Install / Add to home screen' },

    // ── Schemalaggare page ──────────────────────────────────────────────
    planner_title: { sv: 'Schemalaggare', en: 'Planner' },

    // ── Shared / Toasts / Modals ────────────────────────────────────────
    shared_loading: { sv: 'Laddar...', en: 'Loading...' },
    shared_confirm: { sv: 'Bekräfta', en: 'Confirm' },
    shared_yes: { sv: 'Ja', en: 'Yes' },
    shared_cancel: { sv: 'Avbryt', en: 'Cancel' },
    shared_saved: { sv: 'Sparad!', en: 'Saved!' },
    shared_pull_release: { sv: 'Släpp för att uppdatera', en: 'Release to refresh' },
    shared_pull_drag: { sv: 'Dra för att uppdatera', en: 'Pull to refresh' },
    shared_pull_updating: { sv: 'Uppdaterar...', en: 'Updating...' },

    // ── QR Scanner ──────────────────────────────────────────────────────
    qr_scanner_title: { sv: 'Skanna QR-kod', en: 'Scan QR Code' },
    qr_scanner_desc: { sv: 'Rikta kameran mot en väns QR-kod för att lägga till dem.', en: "Point the camera at a friend's QR code to add them." },
    qr_scanner_no_camera: { sv: 'Kunde inte komma åt kameran.', en: 'Could not access the camera.' },
    qr_scanner_found: { sv: 'Vän hittad!', en: 'Friend found!' },
    qr_scanner_add_confirm: { sv: 'Vill du lägga till', en: 'Do you want to add' },
    qr_scanner_added: { sv: 'Vän tillagd!', en: 'Friend added!' },
    qr_scanner_already: { sv: 'Redan tillagd som vän.', en: 'Already added as friend.' },
    qr_scanner_not_found: { sv: 'Profilen hittades inte.', en: 'Profile not found.' }
  };

  function getLang() {
    return localStorage.getItem('redlos_lang') || 'sv';
  }

  function t(key) {
    var lang = getLang();
    var entry = TRANSLATIONS[key];
    if (!entry) return null;
    return entry[lang] || entry['sv'] || null;
  }

  function applyLanguage(lang) {
    if (lang) localStorage.setItem('redlos_lang', lang);
    var current = getLang();
    document.documentElement.lang = current;

    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (val === null) continue;

      // Handle placeholders on inputs
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.tagName === 'OPTION') {
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    }
  }

  // Apply on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyLanguage(); });
  } else {
    applyLanguage();
  }

  // Expose globally
  window.i18n = {
    t: t,
    getLang: getLang,
    applyLanguage: applyLanguage
  };
})();
