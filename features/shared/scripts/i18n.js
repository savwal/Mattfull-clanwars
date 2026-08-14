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
    nav_log: { sv: 'Log', en: 'Log', zh: '记录' },
    nav_battles: { sv: 'Battles', en: 'Battles', zh: '对战' },
    nav_events: { sv: 'Events', en: 'Events', zh: '活动' },
    nav_clan: { sv: 'Klan', en: 'Clan', zh: '部落' },
    nav_friends: { sv: 'Vänner', en: 'Friends', zh: '朋友' },
    nav_historik: { sv: 'Historik', en: 'History', zh: '历史' },
    nav_profil: { sv: 'Profil', en: 'Profile', zh: '个人资料' },

    // ── Index / Log page ────────────────────────────────────────────────
    log_graph_title: { sv: 'Blodflöde', en: 'Blood Flow', zh: '血流' },
    log_legend_promille: { sv: 'Promille', en: 'BAC', zh: '血液酒精浓度' },
    log_legend_tiger: { sv: 'Tiger Woods zone', en: 'Tiger Woods zone', zh: '老虎伍兹区' },
    log_legend_fart: { sv: 'Farthållare', en: 'Speed Keeper', zh: '速度保持者' },
    log_legend_funzone: { sv: 'Funzone', en: 'Funzone', zh: '欢乐区' },
    log_legend_sangria: { sv: 'Sangriagränsen', en: 'Sangria Limit', zh: '桑格利亚界限' },
    log_manual_title: { sv: 'Manuellt registrera', en: 'Manual Entry', zh: '手动输入' },
    log_choose_drink: { sv: 'Välj dryck...', en: 'Choose drink...', zh: '选择饮品...' },
    log_beer: { sv: 'Öl/Cider', en: 'Beer/Cider', zh: '啤酒/苹果酒' },
    log_red_wine: { sv: 'Rött vin', en: 'Red Wine', zh: '红酒' },
    log_white_wine: { sv: 'Vitt vin', en: 'White Wine', zh: '白葡萄酒' },
    log_champagne: { sv: 'Champagne', en: 'Champagne', zh: '香槟' },
    log_spirits: { sv: 'Sprit', en: 'Spirits', zh: '烈酒' },
    log_cocktail: { sv: 'Drink', en: 'Cocktail', zh: '鸡尾酒' },
    log_volume_ph: { sv: 'Volym (ml, t.ex. 330)', en: 'Volume (ml, e.g. 330)', zh: '体积 (毫升, 例如 330)' },
    log_abv_ph: { sv: 'Alkoholhalt (%, t.ex. 5.0)', en: 'ABV (%, e.g. 5.0)', zh: '酒精度 (%, 例如 5.0)' },
    log_register_btn: { sv: 'Registrera', en: 'Register', zh: '注册' },
    log_tactical_title: { sv: 'Tactical Retreat', en: 'Tactical Retreat', zh: '战术撤退' },
    log_ulta_btn: { sv: 'ULTA (SPY)', en: 'ULTA (SPY)', zh: 'ULTA (SPY)' },
    log_stats_label: { sv: 'STATS', en: 'STATS', zh: '统计数据' },
    log_total_intake: { sv: 'Totalt intag:', en: 'Total intake:', zh: '总摄入量:' },
    log_cl_unit: { sv: 'cl', en: 'cl', zh: '厘升' },
    log_alcohol: { sv: 'alkohol', en: 'alcohol', zh: '酒精' },
    log_estimated_bac: { sv: 'Uppskattad promille:', en: 'Estimated BAC:', zh: '预计血液酒精浓度:' },
    log_units_title: { sv: 'Enheter', en: 'Units', zh: '单位' },
    log_planner_title: { sv: 'Schemalaggare', en: 'Planner', zh: '计划者' },
    log_planner_desc: { sv: 'Planera kvällen \u2014 se din promilleprognos innan du börjar.', en: 'Plan your night \u2014 see your BAC forecast before you start.', zh: '计划您的夜晚 — 在开始之前查看您的血液酒精浓度预测。' },
    log_planner_btn: { sv: 'Öppna planner \u2192', en: 'Open planner \u2192', zh: '打开计划者 \u2192' },
    log_quick_add: { sv: 'Registrera snabbt', en: 'Quick add', zh: '快速添加' },
    log_quick_menu: { sv: 'Snabbvals Menu', en: 'Quick Pick Menu', zh: '快速选择菜单' },

    // ── Profile page ────────────────────────────────────────────────────
    profile_name_title: { sv: 'Namn', en: 'Name', zh: '姓名' },
    profile_new_warrior: { sv: 'Ny Krigare', en: 'New Warrior', zh: '新战士' },
    profile_code_title: { sv: 'Din personliga kod', en: 'Your personal code', zh: '您的个人代码' },
    profile_title: { sv: 'Profil', en: 'Profile', zh: '个人资料' },
    profile_add_pic: { sv: 'Lägg till profilbild', en: 'Add profile picture', zh: '添加个人资料图片' },
    profile_max_size: { sv: 'Max 1 MB', en: 'Max 1 MB', zh: '最大 1 MB' },
    profile_name_ph: { sv: 'Namn', en: 'Name', zh: '姓名' },
    profile_weight_ph: { sv: 'Vikt (kg)', en: 'Weight (kg)', zh: '体重 (公斤)' },
    profile_gender_man: { sv: 'Man', en: 'Male', zh: '男' },
    profile_gender_kvinna: { sv: 'Kvinna', en: 'Female', zh: '女' },
    profile_funzone_label: { sv: 'Funzone gräns', en: 'Funzone limit', zh: '欢乐区界限' },
    profile_funzone_ph: { sv: 'Funzone gräns (‰)', en: 'Funzone limit (‰)', zh: '欢乐区界限 (‰)' },
    profile_save: { sv: 'Spara', en: 'Save', zh: '保存' },
    profile_logout: { sv: 'Logga Ut (Nollställ)', en: 'Log Out (Reset)', zh: '登出 (重置)' },
    profile_settings_title: { sv: 'Kontoinställningar', en: 'Account Settings', zh: '账户设置' },
    profile_remove_pic: { sv: 'Ta bort profilbild', en: 'Remove profile picture', zh: '移除个人资料图片' },
    profile_delete_account: { sv: 'Radera konto', en: 'Delete account', zh: '删除账户' },
    profile_contact: { sv: 'Vid frågor, kontakta oss på', en: 'For questions, contact us at', zh: '如有疑问，请联系我们' },
    profile_scan_qr: { sv: 'Skanna QR-kod', en: 'Scan QR code', zh: '扫描二维码' },
    profile_qr_title: { sv: 'Din QR-kod', en: 'Your QR code', zh: '您的二维码' },

    // ── Settings popup ──────────────────────────────────────────────────
    settings_title: { sv: 'Inställningar', en: 'Settings', zh: '设置' },
    settings_language: { sv: 'Språk', en: 'Language', zh: '语言' },
    settings_theme: { sv: 'Tema', en: 'Theme', zh: '主题' },
    settings_theme_light: { sv: 'Ljust', en: 'Light', zh: '亮色' },
    settings_theme_dark: { sv: 'Mörkt', en: 'Dark', zh: '暗色' },
    settings_account: { sv: 'Konto', en: 'Account', zh: '账户' },
    settings_gdpr: { sv: 'Dataskydd & GDPR', en: 'Data Protection & GDPR', zh: '数据保护与 GDPR' },
    settings_gdpr_text: { sv: 'Vi försöker följa EU:s GDPR-lagar. Du kan radera ditt konto och all data när som helst.', en: 'We are trying to follow EU GDPR laws. You can delete your account and all data at any time.', zh: '我们努力遵守欧盟的GDPR法律。您可以随时删除您的账户和所有数据。' },
    settings_logout: { sv: 'Logga ut', en: 'Log out', zh: '登出' },
    settings_delete: { sv: 'Radera konto', en: 'Delete account', zh: '删除账户' },
    settings_remove_pic: { sv: 'Ta bort profilbild', en: 'Remove profile picture', zh: '移除个人资料图片' },
    settings_contact: { sv: 'Vid frågor, kontakta oss på', en: 'For questions, contact us at', zh: '如有疑问，请联系我们' },

    // ── Friends page ────────────────────────────────────────────────────
    friends_add_title: { sv: 'Lägg till vän', en: 'Add friend', zh: '添加朋友' },
    friends_hash_ph: { sv: 'Ange vännens hashkod', en: "Enter friend's hash code", zh: '输入朋友的哈希代码' },
    friends_add_btn: { sv: 'Lägg till', en: 'Add', zh: '添加' },
    friends_list_title: { sv: 'Dina vänner', en: 'Your friends', zh: '您的朋友' },
    friends_live_title: { sv: 'Live Leaderboard', en: 'Live Leaderboard', zh: '实时排行榜' },
    friends_weekly_title: { sv: 'Veckans Leaderboard', en: 'Weekly Leaderboard', zh: '本周排行榜' },
    friends_show_all: { sv: 'Visa alla', en: 'Show all', zh: '显示全部' },
    friends_remove: { sv: 'Ta bort', en: 'Remove', zh: '移除' },
    friends_no_friends: { sv: 'Inga vänner ännu.', en: 'No friends yet.', zh: '还没有朋友。' },

    // ── Battles page ────────────────────────────────────────────────────
    battles_title: { sv: 'Battles', en: 'Battles', zh: '对战' },
    battles_maintenance: { sv: 'Under underhåll', en: 'Under maintenance', zh: '维护中' },
    battles_active: { sv: 'Aktiva Strider', en: 'Active Battles', zh: '活跃的对战' },
    battles_choose: { sv: 'Välj Strid', en: 'Choose Battle', zh: '选择对战' },

    // ── Events page ─────────────────────────────────────────────────────
    events_title: { sv: 'Events', en: 'Events', zh: '活动' },
    events_leaderboard: { sv: 'Event Leaderboard', en: 'Event Leaderboard', zh: '活动排行榜' },
    events_live_promille: { sv: 'Live Promille', en: 'Live BAC', zh: '实时血液酒精浓度' },
    events_leaderboard_cl: { sv: 'Leaderboard (cl)', en: 'Leaderboard (cl)', zh: '排行榜 (厘升)' },
    events_create_custom: { sv: 'Skapa custom event', en: 'Create custom event', zh: '创建自定义活动' },
    events_my_custom: { sv: 'Mina custom events', en: 'My custom events', zh: '我的自定义活动' },
    events_join_custom: { sv: 'Gå med i custom event', en: 'Join custom event', zh: '参加自定义活动' },

    // ── Clans page ──────────────────────────────────────────────────────
    clans_title: { sv: 'Klan', en: 'Clan', zh: '部落' },
    clan_qr_title: { sv: 'Klanens QR-kod', en: 'Clan QR Code', zh: '部落二维码' },
    clan_find_title: { sv: 'Hitta din Klan', en: 'Find your Clan', zh: '找到你的部落' },
    clan_new_name_ph: { sv: 'Ny Klan Namn', en: 'New Clan Name', zh: '新部落名称' },
    clan_create_btn: { sv: 'Skapa Ny Klan', en: 'Create New Clan', zh: '创建新部落' },
    clan_code_ph: { sv: 'Klan kod (5 tecken)', en: 'Clan code (5 chars)', zh: '部落代码 (5 字符)' },
    clan_join_btn: { sv: 'Gå med i Klan', en: 'Join Clan', zh: '加入部落' },
    clan_camp_title: { sv: 'Klanens Läger', en: 'Clan Camp', zh: '部落营地' },
    clan_total_points: { sv: 'Klanens Totala Poäng:', en: 'Clan Total Points:', zh: '部落总分:' },
    clan_leave_btn: { sv: 'Lämna Klan', en: 'Leave Clan', zh: '离开部落' },
    clan_members_title: { sv: 'Medlemmar', en: 'Members', zh: '成员' },
    clan_ongoing_event: { sv: 'Pågående Event', en: 'Ongoing Event', zh: '进行中的活动' },
    clan_war_title: { sv: 'Klan War', en: 'Clan War', zh: '部落战争' },
    clan_war_start_btn: { sv: 'Starta Klan War', en: 'Start Clan War', zh: '开始部落战争' },
    clan_leaderboard_title: { sv: 'Klan Leaderboard', en: 'Clan Leaderboard', zh: '部落排行榜' },
    clan_show_all_btn: { sv: 'Visa Alla', en: 'Show All', zh: '显示全部' },
    clan_war_opponent_ph: { sv: 'Ange motståndares klan kod', en: 'Enter opponent clan code', zh: '输入对手部落代码' },
    clan_war_start: { sv: 'Starta', en: 'Start', zh: '开始' },

    // ── Historik page ───────────────────────────────────────────────────
    historik_title: { sv: 'Historik', en: 'History', zh: '历史' },
    historik_choose_view: { sv: 'Välj en vy för din historik.', en: 'Choose a view for your history.', zh: '选择您的历史视图。' },
    historik_logs_btn: { sv: 'Historiska Loggar', en: 'Historical Logs', zh: '历史记录' },
    historik_wrapped_btn: { sv: 'Wrapped', en: 'Wrapped', zh: '总结' },
    historik_dina_drycker: { sv: 'Dina registrerade drycker', en: 'Your registered drinks', zh: '您记录的饮品' },
    historik_inga_drycker: { sv: 'Du har inga registrerade drycker än.', en: 'You have no registered drinks yet.', zh: '您还没有记录任何饮品。' },
    historik_antal_enheter: { sv: 'Antal enheter:', en: 'Number of units:', zh: '饮品数量:' },
    historik_ren_alkohol: { sv: 'Ren alkohol:', en: 'Pure alcohol:', zh: '纯酒精:' },

    // ── Wrapped page ─────────────────────────────────────────────────────
    wrapped_title: { sv: 'redlös Wrapped', en: 'redlös Wrapped', zh: 'redlös 总结' },
    wrapped_release_desc: { sv: 'Släpps den 24:e varje månad!', en: 'Released on the 24th of each month!', zh: '每月24日发布！' },
    wrapped_monthly_btn: { sv: 'Se Månadens Wrapped', en: "See Monthly Wrapped", zh: '查看月度总结' },
    wrapped_yearly_btn: { sv: 'Se Årets Wrapped', en: "See Yearly Wrapped", zh: '查看年度总结' },
    wrapped_total_consumption: { sv: 'Total Konsumtion:', en: 'Total Consumption:', zh: '总摄入量:' },
    wrapped_clan_points: { sv: 'Klan Poäng:', en: 'Clan Points:', zh: '部落积分:' },
    wrapped_beer: { sv: 'Öl/Cider:', en: 'Beer/Cider:', zh: '啤酒/苹果酒:' },
    wrapped_wine: { sv: 'Vin:', en: 'Wine:', zh: '葡萄酒:' },
    wrapped_sprit: { sv: 'Sprit/Drinkar:', en: 'Spirits/Cocktails:', zh: '烈酒/鸡尾酒:' },
    wrapped_pcs: { sv: 'st', en: 'pcs', zh: '个' },
    wrapped_share_btn: { sv: 'Dela Resultat', en: 'Share Result', zh: '分享结果' },

    // ── Register page ───────────────────────────────────────────────────
    register_about_title: { sv: 'Om redlös', en: 'About redlös', zh: '关于 redlös' },
    register_title: { sv: 'Ny Krigare', en: 'New Warrior', zh: '新战士' },
    register_has_account: { sv: 'Har du redan ett konto?', en: 'Already have an account?', zh: '已经有账户？' },
    register_hash_desc: { sv: 'Skriv in din personliga kod här och tryck på knappen för att logga in.', en: 'Enter your personal code here and press the button to log in.', zh: '输入您的个人代码并按下按钮登入。' },
    register_hash_ph: { sv: 'Personlig kod', en: 'Personal code', zh: '个人代码' },
    register_or: { sv: '— eller —', en: '— or —', zh: '— 或 —' },
    register_new_users: { sv: 'Nya användare', en: 'New users', zh: '新用户' },
    register_new_desc: { sv: 'Lämna fältet ovan tomt och fyll i dina uppgifter nedan för att skapa en ny profil.', en: 'Leave the field above empty and fill in your details below to create a new profile.', zh: '将上方字段留空，并在下方填写您的资料以建立新个人资料。' },
    register_name_ph: { sv: 'Namn', en: 'Name', zh: '姓名' },
    register_weight_ph: { sv: 'Vikt (kg)', en: 'Weight (kg)', zh: '体重 (公斤)' },
    register_gender_man: { sv: 'Man', en: 'Male', zh: '男' },
    register_gender_kvinna: { sv: 'Kvinna', en: 'Female', zh: '女' },
    register_funzone_ph: { sv: 'Funzone-gräns (‰) – t.ex. 1.0', en: 'Funzone limit (‰) – e.g. 1.0', zh: '欢乐区界限 (‰) – 例如 1.0' },
    register_funzone_desc: { sv: 'Funzone-gränsen är promillenivån du siktar på – grafen blir grön när du når den.', en: 'The Funzone limit is the BAC level you aim for – the graph turns green when you reach it.', zh: '欢乐区界限是您想要达到的血液酒精浓度 – 当您达到时，图表会变绿。' },
    register_continue: { sv: 'Fortsätt', en: 'Continue', zh: '继续' },
    register_install: { sv: 'Installera / Lägg till på hemskärmen', en: 'Install / Add to home screen', zh: '安装 / 增加到主画面' },
    register_upload_qr: { sv: 'Ladda upp QR-bild', en: 'Upload QR Image', zh: '上传二维码图片' },

    // ── Schemalaggare page ──────────────────────────────────────────────
    planner_title: { sv: 'Schemalaggare', en: 'Planner', zh: '计划者' },
    planner_back_btn: { sv: '← Tillbaka till Log', en: '← Back to Log', zh: '← 返回记录' },
    planner_schedule_drink: { sv: 'Schemalägg dryck', en: 'Schedule drink', zh: '安排饮品' },
    planner_add_btn: { sv: 'Lägg till', en: 'Add', zh: '添加' },
    planner_forecast_title: { sv: 'Prognos', en: 'Forecast', zh: '预测' },
    planner_peak_bac: { sv: 'Topp promille', en: 'Peak BAC', zh: '最高血液酒精浓度' },
    planner_peak_time: { sv: 'Topp kl.', en: 'Peak at', zh: '最高时间' },
    planner_sober_time: { sv: 'Nykter kl.', en: 'Sober at', zh: '清醒时间' },
    planner_planned_title: { sv: 'Planerade drycker', en: 'Planned drinks', zh: '已安排的饮品' },
    planner_empty: { sv: 'Inga drycker tillagda ännu.', en: 'No drinks added yet.', zh: '还没有添加饮品。' },

    // ── Shared / Toasts / Modals ────────────────────────────────────────
    shared_loading: { sv: 'Laddar...', en: 'Loading...', zh: '加载中...' },
    shared_confirm: { sv: 'Bekräfta', en: 'Confirm', zh: '确认' },
    shared_yes: { sv: 'Ja', en: 'Yes', zh: '是' },
    shared_cancel: { sv: 'Avbryt', en: 'Cancel', zh: '取消' },
    shared_saved: { sv: 'Sparad!', en: 'Saved!', zh: '已保存！' },
    shared_pull_release: { sv: 'Släpp för att uppdatera', en: 'Release to refresh', zh: '放开以更新' },
    shared_pull_drag: { sv: 'Dra för att uppdatera', en: 'Pull to refresh', zh: '下拉以更新' },
    shared_pull_updating: { sv: 'Uppdaterar...', en: 'Updating...', zh: '更新中...' },

    // ── QR Scanner ──────────────────────────────────────────────────────
    qr_scanner_title: { sv: 'Skanna QR-kod', en: 'Scan QR Code', zh: '扫描二维码' },
    qr_scanner_desc: { sv: 'Rikta kameran mot en väns QR-kod för att lägga till dem.', en: "Point the camera at a friend's QR code to add them.", zh: '将相机对准朋友的二维码以添加他们。' },
    qr_scanner_no_camera: { sv: 'Kunde inte komma åt kameran.', en: 'Could not access the camera.', zh: '无法访问相机。' },
    qr_scanner_found: { sv: 'Vän hittad!', en: 'Friend found!', zh: '找到朋友！' },
    qr_scanner_add_confirm: { sv: 'Vill du lägga till', en: 'Do you want to add', zh: '你想添加吗' },
    qr_scanner_added: { sv: 'Vän tillagd!', en: 'Friend added!', zh: '朋友已添加！' },
    qr_scanner_already: { sv: 'Redan tillagd som vän.', en: 'Already added as friend.', zh: '已添加为朋友。' },
    qr_scanner_not_found: { sv: 'Profilen hittades inte.', en: 'Profile not found.', zh: '找不到个人资料。' },

    // ── Friends page (additional) ──────────────────────────────────────
    friends_live_promille: { sv: 'Live Promille', en: 'Live BAC', zh: '实时血液酒精浓度' },
    friends_weekly_cl: { sv: 'Veckans Leaderboard (cl)', en: 'Weekly Leaderboard (cl)', zh: '本周排行榜 (厘升)' },
    friends_manage: { sv: 'Hantera Vänner', en: 'Manage Friends', zh: '管理朋友' },

    // ── Events page (additional) ───────────────────────────────────────
    events_show_all: { sv: 'Visa Alla', en: 'Show All', zh: '显示全部' },
    events_create_btn: { sv: 'Skapa event', en: 'Create event', zh: '创建活动' },
    events_join_btn: { sv: 'Gå med', en: 'Join', zh: '加入' },
    events_open_btn: { sv: 'Öppna', en: 'Open', zh: '打开' },

    // ── Clan QR Scanner ────────────────────────────────────────────────
    clan_qr_scan_title: { sv: 'Skanna klan QR-kod', en: 'Scan Clan QR Code', zh: '扫描部落二维码' },
    clan_qr_scan_desc: { sv: 'Rikta kameran mot en klans QR-kod för att gå med.', en: "Point the camera at a clan's QR code to join.", zh: '将相机对准部落的二维码即可加入。' }
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
