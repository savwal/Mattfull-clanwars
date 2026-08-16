var isOldDesign = localStorage.getItem('redlos_old_design') === '1';
var isDarkMode = localStorage.getItem('redlos_darkmode') === '1';

if (isOldDesign) {
  document.documentElement.classList.add('old-design');
  if (document.body) document.body.classList.add('old-design');
  else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('old-design'));
  
  // Enforce light mode for old design
  localStorage.setItem('redlos_darkmode', '0');
  isDarkMode = false;
}

if (isDarkMode) {
  if (document.body) document.body.classList.add('dark-mode');
  else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('dark-mode'));
}

// ---------------------------------------------------------------------------
// Drink name translation map — Swedish/English stored names → Chinese.
// Used at display time so historical logs, wrapped, etc. show Chinese names
// when the user switches language to zh.
// ---------------------------------------------------------------------------
var DRINK_NAME_ZH = {
  'Norrlands Guld': '诺兰德金牌',
  'Pripps Blå': '普里普斯蓝',
  'Brooklyn Lager': '布鲁克林拉格',
  'Ey Bro': 'Ey Bro',
  'Briska': '布里斯卡',
  'Somersby': '萨默斯比',
  'Melleruds': '梅勒鲁兹',
  'Kopparberg': '科帕伯格',
  'Falcon': '猎鹰',
  'Mariestads': '玛丽斯塔德',
  'Carlsberg Hof': '嘉士伯',
  'Heineken': '喜力',
  'The Bear': '熊牌',
  'Gränges': '格兰格斯',
  'Guinness': '健力士',
  'Sofiero': '索菲艾洛',
  '1664 Blanc': '1664 白啤',
  'Staropramen': '捷克老城',
  'Pilsner Urquell': '皮尔森欧颇',
  'Paulaner': '柏龙',
  'Ett glas vittvin': '一杯白葡萄酒',
  'Ett glas rosé': '一杯玫瑰红酒',
  'Ett glas rött': '一杯红葡萄酒',
  'Snaps': '瑞典烈酒',
  'Vodka (shot)': '伏特加 (一杯)',
  'Tequila (shot)': '龙舌兰 (一杯)',
  'Gin (shot)': '金酒 (一杯)',
  'Whisky': '威士忌',
  'Rom': '朗姆酒',
  'Jägermeister': '野格',
  'Bacardi (rum)': '百加得 (朗姆酒)',
  'En Näve Kir': '一把基尔',
  'Solbacka Kir': '索尔巴卡基尔',
  'Champagne': '香槟',
  'Cava': '卡瓦',
  'Gin & Tonic': '金汤力',
  'Vodka Cranberry': '伏特加蔓越莓',
  'Red Bull Vodka': '红牛伏特加',
  'Aperol Spritz': '阿贝罗喷趣',
  'Ulta': 'Ulta',
  // Manual entry drink type names (stored as drink_name via the dropdown)
  'Öl': '啤酒/苹果酒',
  'Öl/Cider': '啤酒/苹果酒',
  'Rött vin': '红酒',
  'Vitt vin': '白葡萄酒',
  'Sprit': '烈酒',
  'Drink': '鸡尾酒'
};

function translateDrinkName(name) {
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  if (lang === 'zh' && name && DRINK_NAME_ZH[name]) {
    return DRINK_NAME_ZH[name];
  }
  return name;
}

const SUPABASE_URL = 'https://zynyfrqdrihrltdcbnfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v9oyPX430I7TusN4mKFYIw_AO4r033c';

const customFetch = function(url, options) {
  return window.fetch(url, options).catch(function(err) {
    return new Response(JSON.stringify({ error: { message: err ? err.message : 'Network error' } }), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'application/json' }
    });
  });
};

const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: customFetch }
}) : null;

async function syncProfileToSupabase(profile) {
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  const payload = {
    player_hash: profile.id,
    display_name: profile.name,
    weight: profile.weight,
    gender: profile.gender,
    funzone_limit: profile.funzone || 1.0,
    avatar_url: profile.pic || ''
  };
  if (session && session.user) {
    payload.auth_id = session.user.id;
  }
  const { error } = await sb.from('profiles').upsert(payload, { onConflict: 'player_hash' });
  if (error) console.error('Error syncing profile:', error);
}

async function syncDrinkToSupabase(profileId, drink) {
  if (!sb || !drink) return;
  const { error } = await sb.from('drink_logs').insert({
    player_hash: profileId,
    drink_name: drink.name,
    volume_ml: drink.volume,
    abv: drink.abv,
    grams_alcohol: drink.grams,
    consumed_at: new Date(drink.timestamp).toISOString()
  });
  if (error) console.error('Error syncing drink log:', error);
  // Notify all connected clients that leaderboard data changed.
  if (!error) broadcastLeaderboardUpdate();
}

async function removeDrinkFromSupabase(profileId, drinkName, timestamp) {
  if (!sb || !profileId) return;
  const drinkTime = new Date(timestamp).toISOString();
  const { error } = await sb.from('drink_logs')
    .delete()
    .eq('player_hash', profileId)
    .eq('drink_name', drinkName)
    .eq('consumed_at', drinkTime);
  if (error) console.error('Error removing drink from cloud:', error);
  // Notify all connected clients that leaderboard data changed.
  if (!error) broadcastLeaderboardUpdate();
}

// ---------------------------------------------------------------------------
// GDPR Article 17 — Right to erasure. Deletes ALL user data from Supabase:
// drink_logs, friends, event/clan participation, and the profile itself.
// Returns true if the critical deletes (profile + drinks) succeeded.
// ---------------------------------------------------------------------------
async function deleteAccountFromSupabase(profileId) {
  if (!sb || !profileId) return false;
  try {
    // Clean up participations (non-critical, best-effort)
    await sb.from('event_participants').delete().eq('player_hash', profileId).then(function() {}, function() {});
    await sb.from('clan_participants').delete().eq('player_hash', profileId).then(function() {}, function() {});
    await sb.from('clan_members').delete().eq('player_hash', profileId).then(function() {}, function() {});
    await sb.from('friends').delete().eq('player_hash', profileId).then(function() {}, function() {});
    await sb.from('friends').delete().eq('friend_hash', profileId).then(function() {}, function() {});

    // Critical personal data
    const { error: logsError } = await sb.from('drink_logs')
      .delete()
      .eq('player_hash', profileId);
    if (logsError) console.error('Error deleting drink logs:', logsError);

    const { error: profileError } = await sb.from('profiles')
      .delete()
      .eq('player_hash', profileId);
    if (profileError) console.error('Error deleting profile:', profileError);

    return !logsError && !profileError;
  } catch (e) {
    console.error('Error deleting account:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Leaderboard broadcast helper. Sends a lightweight Supabase Realtime
// "broadcast" message on the shared 'leaderboard' channel so every connected
// client knows drink data changed and can re-render. The payload is tiny
// (~50 bytes) — the heavy lifting (BAC computation, ranking) stays client-side
// using the shared drink_logs cache.
// ---------------------------------------------------------------------------
function broadcastLeaderboardUpdate() {
  if (!sb) return;
  // Send through the persistent listener channel managed by the subscription
  // IIFE (exposed as window._leaderboardChannel). This ensures the message
  // goes out on the same 'leaderboard' channel that all clients listen on.
  // If the channel isn't subscribed yet (e.g. page still loading), the
  // message is silently dropped — the next client-side refresh on page load
  // will pick up the data anyway.
  var ch = window._leaderboardChannel;
  if (ch) {
    try {
      ch.send({
        type: 'broadcast',
        event: 'drink_change',
        payload: { ts: Date.now() }
      });
    } catch (e) {
      console.error('broadcastLeaderboardUpdate error:', e);
    }
  }
}

async function fetchProfileFromSupabase(hash) {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('profiles')
      .select('*')
      .eq('player_hash', hash)
      .single();
    if (error) return null;
    if (data) {
      return {
        id: data.player_hash,
        name: data.display_name,
        weight: data.weight,
        gender: data.gender,
        funzone: data.funzone_limit,
        pic: data.avatar_url || ''
      };
    }
  } catch(e) {
    console.error('Error fetching profile:', e);
  }
  return null;
}

function initApp() {
  let globalData;
  try {
    globalData = JSON.parse(localStorage.getItem('redlös_global')) || { persons: {}, clans: {} };
  } catch(e) {
    globalData = { persons: {}, clans: {} };
  }
  localStorage.setItem('redlös_global', JSON.stringify(globalData));
}
initApp();

// ---------------------------------------------------------------------------
// Dark mode — apply on every page load from localStorage.
// ---------------------------------------------------------------------------
(function() {
  if (localStorage.getItem('redlos_darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
})();


function enablePageTransitions() {
  document.body.classList.add('pwa-transitions');

  // Idempotent: always clear the "leaving" state and mark the page ready.
  // It MUST be safe to call repeatedly — a standalone PWA restores frozen
  // pages from the bfcache with `page-leaving` still set, and if we ever
  // refused to re-run (the old `readyApplied` guard) the content would stay
  // stuck at opacity:0 and look like it never updated.
  const ready = () => {
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-ready');
  };

  const scheduleReady = () => {
    requestAnimationFrame(() => requestAnimationFrame(ready));
    window.setTimeout(ready, 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleReady, { once: true });
  } else {
    scheduleReady();
  }

  window.addEventListener('load', scheduleReady, { once: true });
  // pageshow fires on every display, including bfcache restores in a PWA.
  // Clear the leaving state immediately (no rAF delay) so a restored page is
  // never left invisible, then re-run scheduleReady as a belt-and-braces pass.
  window.addEventListener('pageshow', () => {
    ready();
    scheduleReady();
  });
  // Coming back to the foreground (unlocking the device, switching back to the
  // installed app) must also guarantee the content is visible again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ready();
  });

  // Fade out, then navigate. A watchdog guarantees we can never get stuck on an
  // invisible page: when a real navigation happens this document is torn down and
  // the timers die with it, but if the navigation is blocked, a no-op, or the
  // device locked mid-transition and resumed on the same page, the watchdog
  // restores visibility so taps keep working instead of going dead.
  const startLeavingNavigation = url => {
    if (!url) return;
    document.body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = url;
    }, 140);
    setTimeout(ready, 1200);
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;
    // Same document, only the hash differs: let the browser jump natively. Faking
    // it through location.href would add `page-leaving` without a reload, fading
    // the page out forever — a dead UI.
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();
    startLeavingNavigation(url.href);
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest('button[onclick]');
    if (!button) return;
    const handler = button.getAttribute('onclick') || '';
    const navigationMatch = handler.match(/window\.location\.(?:href|assign)\s*=\s*(['"])(.*?)\1/);
    if (!navigationMatch) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    startLeavingNavigation(navigationMatch[2]);
  }, true);

  window.navigateWithTransition = function(url) {
    startLeavingNavigation(url);
  };
}

enablePageTransitions();

function getGlobalData() {
  return JSON.parse(localStorage.getItem('redlös_global'));
}
function saveGlobalData(data) {
  localStorage.setItem('redlös_global', JSON.stringify(data));
}
function checkRegistration() {
  let profiles = [];
  try {
    profiles = JSON.parse(localStorage.getItem('profiles')) || [];
  } catch(e) {
    profiles = [];
  }
  if (profiles.length === 0 && !window.location.href.includes('register.html')) {
    let currentHref = window.location.href;
    currentHref = currentHref.split('?')[0].split('#')[0];
    
    let redirectUrl;
    const featuresIndex = currentHref.indexOf('/features/');
    if (featuresIndex !== -1) {
      const baseHref = currentHref.slice(0, featuresIndex);
      redirectUrl = baseHref + '/features/register/pages/register.html';
    } else {
      let baseHref = currentHref;
      if (baseHref.endsWith('/index.html')) {
        baseHref = baseHref.slice(0, -11);
      } else if (baseHref.endsWith('/')) {
        baseHref = baseHref.slice(0, -1);
      }
      redirectUrl = baseHref + '/features/register/pages/register.html';
    }
    
    window.location.href = redirectUrl;
  }
}
checkRegistration();
function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem('profiles')) || [];
  } catch(e) {
    return [];
  }
}
function getActiveProfile() {
  const profiles = getProfiles();
  const activeId = localStorage.getItem('activeProfileId');
  return profiles.find(p => p.id === activeId) || profiles[0];
}
function saveProfile(profile) {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index > -1) profiles[index] = profile;
  else profiles.push(profile);
  localStorage.setItem('profiles', JSON.stringify(profiles));
  localStorage.setItem('activeProfileId', profile.id);
  let globalData = getGlobalData();
  if (globalData.persons[profile.id]) {
    globalData.persons[profile.id] = profile;
    saveGlobalData(globalData);
  }
  syncProfileToSupabase(profile);
}
function switchProfile(id) {
  localStorage.setItem('activeProfileId', id);
}
function getZones(profile) {
  return { legalMax: 0.2, redMax: profile.funzone || 1.0, greenMax: 3.0 };
}
function getDrinkHistory() {
  const profile = getActiveProfile();
  if(!profile) return [];
  try {
    const history = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
    return history[profile.id] || [];
  } catch(e) {
    return [];
  }
}
function saveDrinkHistory(history) {
  const profile = getActiveProfile();
  if(!profile) return;
  const allHistory = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
  
  const oldHistory = allHistory[profile.id] || [];
  if (history.length > oldHistory.length) {
    const newDrink = history[history.length - 1];
    syncDrinkToSupabase(profile.id, newDrink);
  }
  
  allHistory[profile.id] = history;
  localStorage.setItem('drinkHistory_all', JSON.stringify(allHistory));
}

function getArchivedDrinkHistory(profileId) {
  if (!profileId) return [];
  try {
    const allArchive = JSON.parse(localStorage.getItem('drinkHistory_archive_all')) || {};
    return allArchive[profileId] || [];
  } catch (e) {
    return [];
  }
}

function saveArchivedDrinkHistory(profileId, history) {
  if (!profileId) return;
  let allArchive = {};
  try {
    allArchive = JSON.parse(localStorage.getItem('drinkHistory_archive_all')) || {};
  } catch (e) {
    allArchive = {};
  }
  allArchive[profileId] = history || [];
  localStorage.setItem('drinkHistory_archive_all', JSON.stringify(allArchive));
}

function appendArchivedDrinkHistory(profileId, entries) {
  if (!profileId || !Array.isArray(entries) || entries.length === 0) return [];
  const existing = getArchivedDrinkHistory(profileId);
  const merged = existing.concat(entries);
  saveArchivedDrinkHistory(profileId, merged);
  return merged;
}
function calculateCl(grams) {
  return grams / 7.89;
}

// Active date guard for event leaderboards. A drink only counts toward an event
// if it was actually consumed inside that event's time window. Used by both the
// preset and custom event boards so a drink can never be attributed to the wrong
// (or an inactive) event, even if a query returns a boundary/extra row.
function isDrinkWithinEventWindow(consumedAt, startMs, endMs) {
  const t = consumedAt instanceof Date ? consumedAt.getTime() : new Date(consumedAt).getTime();
  if (!Number.isFinite(t)) return false;
  if (Number.isFinite(startMs) && t < startMs) return false;
  if (Number.isFinite(endMs) && t > endMs) return false;
  return true;
}

// --- New-device drink history restore --------------------------------------
// The log/graph lives in localStorage. On a brand-new device (or a reinstall,
// or after logging in with a personal code) that store is empty even though the
// DB already holds the drinks, so the graph would look blank. We restore them
// ONCE — only when nothing is stored locally for this profile — so the old
// drinks reappear. We never touch local data that already exists, so navigating
// between pages can never reset the live session/graph.

const DRINK_RESTORE_WINDOW_MS = 48 * 60 * 60 * 1000;
const BAC_ZERO_THRESHOLD = 0.005;
const SESSION_RESET_MS = 2 * 60 * 60 * 1000;

async function fetchDrinkLogsFromSupabase(profileId, sinceISO) {
  if (!sb || !profileId) return null; // null = couldn't fetch -> caller keeps local
  try {
    let query = sb.from('drink_logs')
      .select('drink_name, volume_ml, abv, grams_alcohol, consumed_at')
      .eq('player_hash', profileId)
      .order('consumed_at', { ascending: true });
    if (sinceISO) query = query.gte('consumed_at', sinceISO);
    const result = await query;
    if (result.error) return null;
    return (result.data || []).map(d => {
      const ts = new Date(d.consumed_at).getTime();
      let grams = Number(d.grams_alcohol);
      const vol = Number(d.volume_ml);
      const abv = Number(d.abv);
      if (!Number.isFinite(grams) && Number.isFinite(vol) && Number.isFinite(abv)) {
        grams = parseFloat((vol * (abv / 100) * 0.789).toFixed(1));
      }
      var lang = window.i18n ? window.i18n.getLang() : 'sv';
      var rawName = d.drink_name || (lang === 'zh' ? '未知饮品' : (lang === 'en' ? 'Unknown drink' : 'Okänd dryck'));
      return {
        name: translateDrinkName(rawName),
        volume: Number.isFinite(vol) ? vol : 0,
        abv: Number.isFinite(abv) ? abv : 0,
        grams: Number.isFinite(grams) ? grams : 0,
        time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: ts
      };
    }).filter(d => Number.isFinite(d.timestamp));
  } catch (e) {
    return null;
  }
}

// True if, judging only by priorDrinks, BAC had been ~0 for at least the reset
// window leading up to atTime. BAC is monotonic once the last drink has
// absorbed, so a zero reading at atTime AND one reset-window earlier means it
// stayed zero throughout — the same condition checkGraphReset uses.
function bacResetBefore(priorDrinks, profile, atTime) {
  if (!priorDrinks || priorDrinks.length === 0) return false;
  if (typeof calculateBACAtTime !== 'function') return false;
  const bacAt = Math.abs(calculateBACAtTime(priorDrinks, profile, atTime));
  if (bacAt > BAC_ZERO_THRESHOLD) return false;
  const bacBefore = Math.abs(calculateBACAtTime(priorDrinks, profile, atTime - SESSION_RESET_MS));
  return bacBefore <= BAC_ZERO_THRESHOLD;
}

// Split an ascending list of drinks into the current graph session and the
// archived remainder, mirroring the live reset rules so a freshly-restored
// device shows what a continuously-running one would.
function reconstructSession(drinks, profile) {
  if (!drinks || drinks.length === 0) return { session: [], archived: [] };
  let startIdx = 0;
  for (let i = 1; i < drinks.length; i++) {
    const prior = drinks.slice(startIdx, i);
    if (bacResetBefore(prior, profile, drinks[i].timestamp)) {
      startIdx = i;
    }
  }
  const session = drinks.slice(startIdx);
  // The most recent session may itself have expired (BAC ~0 for the reset
  // window before now); if so it belongs in the archive, not on the graph.
  if (session.length && bacResetBefore(session, profile, Date.now())) {
    return { session: [], archived: drinks.slice() };
  }
  return { session: session, archived: drinks.slice(0, startIdx) };
}

// Restore drink history from the DB only when this device has none stored.
// This is what makes the graph reappear after logging in on a new device while
// keeping the old drinks. It is a one-time seed: if anything is already stored
// locally we return immediately and never overwrite it.
async function restoreDrinkHistoryIfEmpty(profileId, profile) {
  if (!sb || !profileId) return false;
  let allLocal;
  try { allLocal = JSON.parse(localStorage.getItem('drinkHistory_all')) || {}; } catch (e) { allLocal = {}; }
  const localCurrent = allLocal[profileId] || [];
  const localArchive = (typeof getArchivedDrinkHistory === 'function') ? getArchivedDrinkHistory(profileId) : [];
  if (localCurrent.length > 0 || localArchive.length > 0) return false; // already seeded

  const sinceISO = new Date(Date.now() - DRINK_RESTORE_WINDOW_MS).toISOString();
  const remote = await fetchDrinkLogsFromSupabase(profileId, sinceISO);
  if (!remote || remote.length === 0) return false;

  const split = reconstructSession(remote, profile);
  allLocal[profileId] = split.session;
  localStorage.setItem('drinkHistory_all', JSON.stringify(allLocal));
  if (typeof saveArchivedDrinkHistory === 'function') {
    saveArchivedDrinkHistory(profileId, split.archived);
  }
  return true;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const isGitHubPages = location.hostname.endsWith('github.io');
    if (!isLocal && (location.protocol === 'https:' || isGitHubPages)) {
      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window.caches) {
          caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).finally(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      });
    }
  });
}

async function ensureSupabaseAuth() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    // Access tokens last ~1h. Refresh proactively when expired (or about to be)
    // so database writes — joining events/clans, logging drinks — don't silently
    // fail with an expired token an hour after the page loaded.
    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0;
    if (expiresAtMs && expiresAtMs - Date.now() >= 60000) {
      return session;
    }
    const { data: refreshed, error: refreshError } = await sb.auth.refreshSession();
    if (!refreshError && refreshed && refreshed.session) {
      return refreshed.session;
    }
    // Refresh failed (refresh token also expired) — fall through to a new sign-in.
  }

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) {
    console.error('Error signing in anonymously:', error);
    return null;
  }
  
  const activeProfile = getActiveProfile();
  if (activeProfile && activeProfile.id) {
    const { error: updateError } = await sb.from('profiles')
      .update({ auth_id: data.user.id })
      .eq('player_hash', activeProfile.id)
      .is('auth_id', null);
    if (updateError) console.error('Error linking profile to auth:', updateError);
  }
  return data.session;
}
ensureSupabaseAuth();

const DRINK_REMINDER_MESSAGE = 'Har du druckit något mer :) Logga och se din graf';

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

async function showDrinkReminderNotification() {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  const options = {
    body: DRINK_REMINDER_MESSAGE,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: 'drink-reminder',
    renotify: true
  };
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification('redlös', options);
      return true;
    }
  }
  new Notification('redlös', options);
  return true;
}

// ---------------------------------------------------------------------------
// Shared rank styling for every leaderboard. The rank is shown as "1.", "2.",
// "3." (number + dot, no "#"). Ranks 1/2/3 get gold/silver/bronze; everyone
// else gets the standard grey badge — consistent across the whole app.
// ---------------------------------------------------------------------------
window.RANK_MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
window.rankBadgeColor = function(n) {
  return window.RANK_MEDAL_COLORS[n] || '#E5E5E5';
};
window.formatRankLabel = function(n) {
  return n + '.';
};

// ---------------------------------------------------------------------------
// Shared leaderboard preloading cache — show stale data instantly while the
// fresh DB fetch is in flight. Entries expire after 5 minutes.
// ---------------------------------------------------------------------------
(function() {
  var TTL = 5 * 60 * 1000;
  var PREFIX = 'redlos_lb_';
  window.leaderboardCache = {
    get: function(key) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        if (!raw) return null;
        var p = JSON.parse(raw);
        return (p && p.ts && Date.now() - p.ts < TTL) ? p.data : null;
      } catch(e) { return null; }
    },
    set: function(key, data) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }));
      } catch(e) {}
    }
  };
})();

// ---------------------------------------------------------------------------
// Shared Supabase data layer — the single biggest lever for staying under the
// free-tier request quota.
//
// The leaderboards on the Klan, Events, Vänner and Historik pages all need the
// same two things: the `drink_logs` rows and the players' `profiles`. Before,
// EVERY card on EVERY page — and every 15–20s poll, and a realtime subscription
// per page — issued its own query for them, which is what blew past the quota.
//
// This layer makes the call to each table ONCE and hands the cached result to
// every caller:
//   * getDrinkLogs() — the whole (small) drink_logs table, fetched at most once
//     per DRINKS_TTL and shared by every leaderboard. Each board then filters in
//     JS to its own window (24h live, 7d weekly, the clan period, an event's
//     range, …) so no extra round-trips are needed.
//   * getProfiles(hashes) — fetches only the player_hashes not already cached and
//     merges them into one map keyed by hash. This replaces the many
//     `profiles … .in('player_hash', …)` lookups that cross-referenced other
//     tables; callers just read the map and join in JS.
//
// Both caches are mirrored to localStorage so navigating between pages reuses
// the data instead of re-querying, and concurrent callers share one in-flight
// request (several cards rendering at once still trigger only one fetch).
// ---------------------------------------------------------------------------
(function() {
  var DRINKS_TTL = 30 * 1000;        // drink_logs refetched at most once / 30s
  var PROFILES_TTL = 5 * 60 * 1000;  // profiles change rarely
  var DRINKS_LS_KEY = 'redlos_drink_logs_cache';
  var PROFILES_LS_KEY = 'redlos_profiles_cache';
  var DRINK_COLUMNS = 'player_hash, drink_name, volume_ml, abv, grams_alcohol, consumed_at';
  var PROFILE_COLUMNS = 'player_hash, display_name, avatar_url, weight, gender, funzone_limit';

  var drinksMem = null;        // { ts, data: [] }
  var drinksInflight = null;
  var profilesMem = null;      // { ts, map: {} }
  var profilesInflight = {};   // signature -> Promise

  function readLS(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ---- drink_logs ---------------------------------------------------------
  function drinksFresh(entry) {
    return !!(entry && entry.data && (Date.now() - entry.ts < DRINKS_TTL));
  }
  function cachedDrinks() {
    if (drinksMem && drinksMem.data) return drinksMem.data;
    var ls = readLS(DRINKS_LS_KEY);
    if (ls && ls.data) { drinksMem = ls; return ls.data; }
    return [];
  }

  // Returns the whole drink_logs table (cached). `options.force` bypasses the TTL.
  // Never rejects — on any failure it resolves to the last cached data (possibly
  // stale, possibly empty) so a transient error can't blank a leaderboard.
  async function getDrinkLogs(options) {
    options = options || {};
    if (drinksFresh(drinksMem) && !options.force) return drinksMem.data;
    var ls = !drinksMem ? readLS(DRINKS_LS_KEY) : null;
    if (ls) drinksMem = ls;
    if (drinksFresh(drinksMem) && !options.force) return drinksMem.data;
    if (drinksInflight) return drinksInflight;
    if (!sb) return cachedDrinks();
    drinksInflight = (async function() {
      try {
        // Newest-first with a generous explicit limit. Ordering by consumed_at
        // means that if the table ever outgrows the server's row cap, the rows
        // that ARE returned are the most recent ones — exactly what every
        // leaderboard window (24h / 7d / the clan period / recent events) needs.
        var res = await sb.from('drink_logs')
          .select(DRINK_COLUMNS)
          .order('consumed_at', { ascending: false })
          .limit(20000);
        if (res.error) return cachedDrinks();
        var data = res.data || [];
        drinksMem = { ts: Date.now(), data: data };
        writeLS(DRINKS_LS_KEY, drinksMem);
        return data;
      } catch (e) {
        return cachedDrinks();
      } finally {
        drinksInflight = null;
      }
    })();
    return drinksInflight;
  }

  // ---- profiles -----------------------------------------------------------
  function loadProfilesCache() {
    if (profilesMem) return;
    var ls = readLS(PROFILES_LS_KEY);
    if (ls && ls.map) profilesMem = ls;
  }

  // Returns a map { player_hash -> profile } covering (at least) the requested
  // hashes. Only hashes missing from the cache are fetched; when the cache has
  // expired the requested hashes are refetched so names/avatars stay current.
  async function getProfiles(hashes) {
    loadProfilesCache();
    var want = Array.from(new Set((hashes || []).filter(Boolean)));
    var expired = !profilesMem || (Date.now() - profilesMem.ts >= PROFILES_TTL);
    var map = (profilesMem && profilesMem.map) || {};
    var missing = expired ? want.slice() : want.filter(function(h) { return !map[h]; });
    if (missing.length === 0 || !sb) return map;

    var sig = missing.slice().sort().join('|');
    if (!profilesInflight[sig]) {
      profilesInflight[sig] = (async function() {
        try {
          var res = await sb.from('profiles').select(PROFILE_COLUMNS).in('player_hash', missing);
          if (!res.error && res.data) {
            var base = (profilesMem && profilesMem.map) || {};
            res.data.forEach(function(p) { base[p.player_hash] = p; });
            profilesMem = { ts: Date.now(), map: base };
            writeLS(PROFILES_LS_KEY, profilesMem);
          } else if (!profilesMem) {
            profilesMem = { ts: Date.now(), map: {} };
          }
        } catch (e) {
          if (!profilesMem) profilesMem = { ts: Date.now(), map: {} };
        } finally {
          delete profilesInflight[sig];
        }
      })();
    }
    await profilesInflight[sig];
    return (profilesMem && profilesMem.map) || map;
  }

  // Resolve the grams of alcohol for a logged drink, falling back to the
  // volume/abv calculation when grams_alcohol was not stored or is null/0.
  // Shared so every leaderboard scores a drink identically.
  function resolveDrinkGrams(row) {
    if (!row) return 0;
    var grams = Number(row.grams_alcohol);
    if (row.grams_alcohol !== null && row.grams_alcohol !== undefined && row.grams_alcohol !== '' && Number.isFinite(grams) && grams !== 0) {
      return grams;
    }
    var vol = Number(row.volume_ml) || 0;
    var abv = Number(row.abv) || 0;
    return vol * (abv / 100) * 0.789;
  }

  window.sharedData = {
    getDrinkLogs: getDrinkLogs,
    getProfiles: getProfiles,
    resolveDrinkGrams: resolveDrinkGrams,
    invalidateDrinks: function() { drinksMem = null; },
    invalidateProfiles: function() { profilesMem = null; }
  };
})();

// ---------------------------------------------------------------------------
// Leaderboard Realtime broadcast subscription (PWA-resilient).
//
// Replaces all setInterval-based leaderboard polling. When ANY client logs or
// removes a drink, it broadcasts a tiny 'drink_change' event on the
// 'leaderboard' channel. Every subscribed client receives it, invalidates
// its drink_logs cache, and re-renders — so updates appear in ~1-2s without
// constant polling.
//
// PWA-specific handling:
//   • visibilitychange / focus  — resubscribe when the app returns to
//     foreground (the WebSocket is often killed by the OS while backgrounded)
//   • online event              — resubscribe when network connectivity is
//     regained after being offline
//   • Duplicate-subscription guard — always tears down the old channel
//     before creating a new one, so repeated resume cycles never leak sockets
//   • Debounced refresh         — coalesces rapid back-to-back broadcasts
//     (e.g. user logs 3 drinks in 5 seconds) into a single cache-invalidate
//     + re-render pass
// ---------------------------------------------------------------------------
(function() {
  if (!sb) return; // No Supabase client — nothing to subscribe to.

  var DEBOUNCE_MS = 500; // Coalesce rapid broadcasts into one refresh.
  var currentChannel = null;
  var debounceTimer = null;

  // Invalidate the shared drink_logs cache and tell the current page to
  // re-render its leaderboard. Debounced so that 3 drinks logged in 5s
  // trigger only one refresh, not three.
  function onLeaderboardBroadcast() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      debounceTimer = null;
      // Force the next getDrinkLogs() call to fetch fresh data from the DB
      // instead of returning the (now stale) 30s-TTL cached copy.
      if (window.sharedData && typeof window.sharedData.invalidateDrinks === 'function') {
        window.sharedData.invalidateDrinks();
      }
      // Trigger the page's own refresh hook (each page defines this to
      // re-render its specific leaderboard cards).
      if (typeof window.refreshPageData === 'function') {
        try { window.refreshPageData(); } catch (e) {}
      }
    }, DEBOUNCE_MS);
  }

  // Create (or recreate) the broadcast subscription. Always tears down the
  // previous channel first so we never end up with duplicate sockets after
  // repeated background/foreground cycles.
  function subscribe() {
    // --- Cleanup old channel (duplicate-subscription guard) ----------------
    if (currentChannel) {
      try { sb.removeChannel(currentChannel); } catch (e) {}
      currentChannel = null;
      window._leaderboardChannel = null;
    }

    // --- Create new channel -----------------------------------------------
    var ch = sb.channel('leaderboard', {
      config: { broadcast: { self: false } } // Don't echo our own broadcasts.
    });

    ch.on('broadcast', { event: 'drink_change' }, function(_payload) {
      onLeaderboardBroadcast();
    });

    ch.subscribe(function(status) {
      if (status === 'SUBSCRIBED') {
        currentChannel = ch;
        // Expose globally so broadcastLeaderboardUpdate() can send through
        // this channel without creating a conflicting ephemeral one.
        window._leaderboardChannel = ch;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Connection failed — log but don't crash. The PWA resume handlers
        // will retry on the next foreground / online event.
        console.warn('[leaderboard-rt] subscription ' + status);
      }
    });
  }

  // --- Initial subscription on page load ----------------------------------
  subscribe();

  // --- PWA reconnect hook -------------------------------------------------
  // shared.js already calls window.reconnectRealtime() on visibilitychange,
  // pageshow, and focus (see resumeRefresh). We implement it here to
  // resubscribe the leaderboard channel after the app was backgrounded and
  // the OS killed the WebSocket.
  window.reconnectRealtime = function() {
    subscribe();
  };

  // --- Network recovery ---------------------------------------------------
  // When the device goes offline the WebSocket drops silently. Resubscribe
  // as soon as connectivity is restored so the user doesn't have to reload.
  window.addEventListener('online', function() {
    subscribe();
  });
})();

// ---------------------------------------------------------------------------
// Shared in-page list modal. Used by the "Visa Alla" buttons to show a full
// list (all clans / all active users) in an on-page JavaScript popup — like the
// Historik popup — instead of opening a new browser tab/window. Pass the title
// and a ready-built HTML string for the body.
// ---------------------------------------------------------------------------
window.showListModal = function(title, contentHtml, options) {
  options = options || {};
  var headerBg = options.headerBg || '#2A8CFF';

  // Position the overlay inline so it works even on pages that do not define a
  // `.modal { position: fixed }` rule (e.g. events.html, friends.html) — there it
  // would otherwise flow as a static box at the bottom of the page. z-index sits
  // above the mobile bottom menu (1100).
  var overlay = document.createElement('div');
  overlay.className = 'modal';
  overlay.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:6000;transition:background-color 200ms ease-out;';
  requestAnimationFrame(function() { overlay.style.backgroundColor = 'rgba(0,0,0,0.5)'; });

  var content = document.createElement('div');
  content.className = 'modal-content card';
  content.style.cssText = 'box-sizing:border-box;width:min(92vw,520px);max-width:92vw;margin:clamp(24px,8vh,80px) auto;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;background:#FFFFFF;color:#2C3E50;border:1px solid rgba(44,62,80,0.12);border-radius:16px;box-shadow:0 8px 32px rgba(44,62,80,0.18);padding:0;text-align:left;position:relative;opacity:0;transform:translateY(12px) scale(0.97);transition:opacity 200ms ease-out,transform 200ms ease-out;';
  requestAnimationFrame(function() { requestAnimationFrame(function() { content.style.opacity = '1'; content.style.transform = 'translateY(0) scale(1)'; }); });

  var header = document.createElement('div');
  header.style.cssText = 'position:relative;flex:0 0 auto;';

  var heading = document.createElement('h2');
  heading.textContent = title;
  heading.setAttribute('data-modal-title', '');
  heading.style.cssText = "font-family:'Arial Black',sans-serif;text-transform:uppercase;color:#FFF;background:" + headerBg + ";margin:0;padding:15px 52px 15px 15px;border-bottom:1px solid rgba(255,255,255,0.15);text-align:left;border-radius:16px 16px 0 0;";

  var close = document.createElement('span');
  close.className = 'close-modal';
  close.innerHTML = '&times;';
  close.style.cssText = 'color:#FFF;font-size:28px;font-weight:bold;cursor:pointer;position:absolute;right:15px;top:10px;line-height:1;z-index:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background 0.15s ease;';

  var body = document.createElement('div');
  body.setAttribute('data-modal-body', '');
  body.style.cssText = 'flex:1 1 auto;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:20px;';
  body.innerHTML = contentHtml;

  function cleanup() {
    content.style.opacity = '0';
    content.style.transform = 'translateY(8px) scale(0.97)';
    overlay.style.backgroundColor = 'rgba(0,0,0,0)';
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 180);
  }
  close.addEventListener('click', cleanup);
  overlay.addEventListener('click', function(event) { if (event.target === overlay) cleanup(); });

  header.appendChild(heading);
  header.appendChild(close);
  content.appendChild(header);
  content.appendChild(body);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  return overlay;
};

// Shared markup for the "loading" state inside a popup body.
window.MODAL_LOADING_HTML = '<div style="display:flex;align-items:center;justify-content:center;gap:10px;color:#5a6570;font-weight:700;padding:24px;"><span class="loading-spinner"></span> Laddar...</div>';

// Open a list-modal immediately showing a spinner, so a tap never feels dead
// while the data is fetched. Returns the overlay; fill it later with
// updateModalBody()/updateModalTitle().
window.showLoadingModal = function(title, options) {
  if (typeof window.showListModal !== 'function') return null;
  return window.showListModal(title, window.MODAL_LOADING_HTML, options);
};

// Replace the body of a modal previously created by showListModal/showLoadingModal.
window.updateModalBody = function(overlay, html) {
  if (!overlay) return;
  var body = overlay.querySelector('[data-modal-body]');
  if (body) body.innerHTML = html;
};

// Replace the heading text of such a modal.
window.updateModalTitle = function(overlay, title) {
  if (!overlay) return;
  var heading = overlay.querySelector('[data-modal-title]');
  if (heading) heading.textContent = title;
};

// ---------------------------------------------------------------------------
// Shared lightweight toast. Lazily creates (and reuses) a single #sharedToast
// element so any page can show transient feedback ("Profil sparad!"). The
// element carries the `.toast` class, which the page-transition rules exempt,
// so it animates via its own opacity instead of being pinned by page-ready.
// ---------------------------------------------------------------------------
var _sharedToastTimer = null;
window.showToast = function(message, options) {
  options = options || {};
  var toast = document.getElementById('sharedToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sharedToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', !!options.error);
  // Force a reflow so re-showing restarts the fade even if already visible.
  void toast.offsetWidth;
  toast.classList.add('show');
  if (_sharedToastTimer) clearTimeout(_sharedToastTimer);
  _sharedToastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, options.duration || 2500);
};

// ---------------------------------------------------------------------------
// Double-submit guard. Disables the triggering button and shows an inline
// spinner for the duration of an async action, so a quick double-tap can't fire
// it twice (duplicate battles / event joins / inserts). Safe to call with a null
// button — it just runs the action without a lock.
// ---------------------------------------------------------------------------
window.runWithButtonLock = async function(btn, fn) {
  if (btn && (btn.disabled || btn.dataset.locked === '1')) return;
  var original = null;
  if (btn) {
    original = btn.innerHTML;
    btn.dataset.locked = '1';
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:3px;vertical-align:middle;"></span>';
  }
  try {
    return await fn();
  } finally {
    if (btn) {
      btn.disabled = false;
      delete btn.dataset.locked;
      btn.innerHTML = original;
    }
  }
};

// ---------------------------------------------------------------------------
// Shared confirmation modal for destructive actions (leave clan, end battle,
// delete friend). Returns a Promise that resolves true when confirmed and false
// when cancelled/dismissed, so callers can `await showConfirmModal(...)`.
// ---------------------------------------------------------------------------
window.showConfirmModal = function(message, options) {
  options = options || {};
  var title = options.title || 'Bekräfta';
  var confirmText = options.confirmText || 'Ja';
  var cancelText = options.cancelText || 'Avbryt';

  return new Promise(function(resolve) {
    // Position inline so the dialog works on pages without a `.modal` rule.
    var overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:6000;transition:background-color 200ms ease-out;';
    requestAnimationFrame(function() { overlay.style.backgroundColor = 'rgba(0,0,0,0.5)'; });

    var content = document.createElement('div');
    content.className = 'modal-content card';
    content.style.cssText = 'box-sizing:border-box;width:min(92vw,440px);max-width:92vw;margin:clamp(24px,12vh,120px) auto;max-height:85vh;overflow-y:auto;background:#2A8CFF;color:#fff;border:1px solid rgba(44,62,80,0.12);border-radius:16px;box-shadow:0 8px 32px rgba(44,62,80,0.18);padding:25px;text-align:center;position:relative;opacity:0;transform:translateY(12px) scale(0.97);transition:opacity 200ms ease-out,transform 200ms ease-out;';
    requestAnimationFrame(function() { requestAnimationFrame(function() { content.style.opacity = '1'; content.style.transform = 'translateY(0) scale(1)'; }); });

    var heading = document.createElement('h2');
    heading.textContent = title;
    heading.style.cssText = "font-family:'Arial Black',sans-serif;color:#FFF;background:#2C3E50;margin:-25px -25px 20px -25px;padding:15px;border-bottom:1px solid rgba(255,255,255,0.15);text-transform:uppercase;text-align:left;border-radius:16px 16px 0 0;";

    var text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = 'font-weight:bold;margin:0 0 20px 0;';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = cancelText;
    cancelBtn.style.cssText = 'flex:1;width:auto;margin:0;background:#FFF;color:#2C3E50;border:1px solid rgba(44,62,80,0.15);border-radius:10px;box-shadow:0 2px 6px rgba(44,62,80,0.10);padding:14px;font-weight:900;text-transform:uppercase;cursor:pointer;transition:all 0.15s ease;';

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = confirmText;
    confirmBtn.style.cssText = 'flex:1;width:auto;margin:0;background:#E74C3C;color:#FFF;border:1px solid rgba(44,62,80,0.15);border-radius:10px;box-shadow:0 2px 6px rgba(44,62,80,0.10);padding:14px;font-weight:900;text-transform:uppercase;cursor:pointer;transition:all 0.15s ease;';

    function cleanup(result) {
      content.style.opacity = '0';
      content.style.transform = 'translateY(8px) scale(0.97)';
      overlay.style.backgroundColor = 'rgba(0,0,0,0)';
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); resolve(result); }, 180);
    }
    cancelBtn.addEventListener('click', function() { cleanup(false); });
    confirmBtn.addEventListener('click', function() { cleanup(true); });
    overlay.addEventListener('click', function(event) { if (event.target === overlay) cleanup(false); });

    row.appendChild(cancelBtn);
    row.appendChild(confirmBtn);
    content.appendChild(heading);
    content.appendChild(text);
    content.appendChild(row);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  });
};

// ---------------------------------------------------------------------------
// PWA refresh helpers
// Standalone PWAs can't be hard-refreshed and freeze their timers/realtime
// sockets while the device is locked. When the app comes back to the
// foreground we refetch data and re-open realtime channels so the UI is never
// stuck on stale values. Pages opt in by defining window.refreshPageData and
// (optionally) window.reconnectRealtime.
// ---------------------------------------------------------------------------
(function() {
  var resuming = false;

  // Coming back to the foreground after the device was locked, we must assume the
  // Supabase access token has expired — tokens last ~1h and their refresh timer is
  // frozen while the app is backgrounded. Refresh auth FIRST, before anything that
  // touches the DB: otherwise the realtime socket reconnects with a dead JWT and
  // every refetch is silently rejected by RLS, leaving the UI stuck on stale data
  // and taps that depend on it feeling dead. Only once the token is valid do we
  // reopen realtime channels and refresh the page's data. This is what lets the
  // PWA keep working after being locked for over an hour.
  async function resumeRefresh() {
    if (resuming) return;
    resuming = true;
    try {
      if (typeof ensureSupabaseAuth === 'function') {
        try { await ensureSupabaseAuth(); } catch (e) {}
      }
      if (typeof window.reconnectRealtime === 'function') {
        try { window.reconnectRealtime(); } catch (e) {}
      }
      if (typeof window.refreshPageData === 'function') {
        try { window.refreshPageData(); } catch (e) {}
      }
    } finally {
      resuming = false;
    }
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') resumeRefresh();
  });
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) resumeRefresh();
  });
  window.addEventListener('focus', resumeRefresh);
})();

// ---------------------------------------------------------------------------
// Pull-to-refresh: drag down from the top of the page to hard-refresh.
// Needed because the native gesture is disabled in standalone PWA mode.
// ---------------------------------------------------------------------------
(function() {
  if (!('ontouchstart' in window)) return;

  var THRESHOLD = 80;
  var startY = 0;
  var distance = 0;
  var pulling = false;
  var indicator = null;

  function anyModalOpen() {
    var modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
      if (window.getComputedStyle(modals[i]).display !== 'none') return true;
    }
    return false;
  }

  function getIndicator() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.setAttribute('aria-hidden', 'true');
    indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;height:0;overflow:hidden;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:#FFCC00;color:#2C3E50;font-weight:900;text-transform:uppercase;' +
      'font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.5px;' +
      'border-bottom:4px solid #2C3E50;z-index:5000;pointer-events:none;';
    document.body.appendChild(indicator);
    return indicator;
  }

  function reset() {
    if (indicator) indicator.style.height = '0';
  }

  document.addEventListener('touchstart', function(e) {
    pulling = false;
    if (e.touches.length !== 1) return;
    if ((window.scrollY || document.documentElement.scrollTop || 0) > 0) return;
    if (anyModalOpen()) return;
    startY = e.touches[0].clientY;
    distance = 0;
    pulling = true;
  }, { passive: true });

  // Non-passive so we can call preventDefault() and OWN the downward pull at the
  // top of the page. Without this the browser's native overscroll/rubber-band
  // can swallow the gesture in a standalone PWA and the refresh never triggers.
  document.addEventListener('touchmove', function(e) {
    if (!pulling) return;
    distance = e.touches[0].clientY - startY;
    if (distance <= 0) { reset(); return; }
    // We're at the top and the finger is moving down — this is our pull, not a
    // scroll. Claim it so the page doesn't also try to overscroll.
    if (e.cancelable) e.preventDefault();
    var bar = getIndicator();
    bar.style.height = Math.min(distance * 0.5, 60) + 'px';
    bar.textContent = distance > THRESHOLD ? 'Släpp för att uppdatera' : 'Dra för att uppdatera';
  }, { passive: false });

  document.addEventListener('touchend', function() {
    if (!pulling) return;
    pulling = false;
    if (distance > THRESHOLD) {
      var bar = getIndicator();
      bar.style.height = '60px';
      bar.textContent = 'Uppdaterar...';
      setTimeout(function() {
        if (window.caches) {
          caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) { return caches.delete(k); }));
          }).finally(function() { window.location.reload(); });
        } else {
          window.location.reload();
        }
      }, 60);
    } else {
      reset();
    }
  }, { passive: true });

  document.addEventListener('touchcancel', function() {
    pulling = false;
    reset();
  }, { passive: true });
})();