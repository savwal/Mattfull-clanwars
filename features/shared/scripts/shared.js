const SUPABASE_URL = 'https://zynyfrqdrihrltdcbnfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v9oyPX430I7TusN4mKFYIw_AO4r033c';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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

function enablePageTransitions() {
  const isStandalonePwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.body.classList.add('pwa-transitions');

  let readyApplied = false;
  const ready = () => {
    if (readyApplied) return;
    readyApplied = true;
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
  window.addEventListener('pageshow', () => {
    scheduleReady();
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    event.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = url.href;
    }, 140);
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest('button[onclick]');
    if (!button) return;
    const handler = button.getAttribute('onclick') || '';
    const navigationMatch = handler.match(/window\.location\.(?:href|assign)\s*=\s*(['"])(.*?)\1/);
    if (!navigationMatch) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = navigationMatch[2];
    }, 140);
  }, true);

  window.navigateWithTransition = function(url) {
    if (!url) return;
    document.body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = url;
    }, 140);
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
      return {
        name: d.drink_name || 'Okänd dryck',
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
  overlay.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0.6);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:6000;';

  // Flex column: the header (heading + close button) is fixed and only the body
  // scrolls, so the close X stays reachable even after scrolling down the list.
  var content = document.createElement('div');
  content.className = 'modal-content card';
  content.style.cssText = 'box-sizing:border-box;width:min(92vw,520px);max-width:92vw;margin:clamp(24px,8vh,80px) auto;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;background:#FFFFFF;color:#2C3E50;border:6px solid #2C3E50;box-shadow:8px 8px 0 #2C3E50;padding:0;text-align:left;position:relative;';

  var header = document.createElement('div');
  header.style.cssText = 'position:relative;flex:0 0 auto;';

  var heading = document.createElement('h2');
  heading.textContent = title;
  heading.style.cssText = "font-family:'Arial Black',sans-serif;text-transform:uppercase;color:#FFF;background:" + headerBg + ";margin:0;padding:15px 52px 15px 15px;border-bottom:4px solid #2C3E50;text-align:left;";

  var close = document.createElement('span');
  close.className = 'close-modal';
  close.innerHTML = '&times;';
  close.style.cssText = 'color:#FFF;font-size:32px;font-weight:bold;cursor:pointer;position:absolute;right:15px;top:8px;line-height:1;z-index:1;';

  var body = document.createElement('div');
  body.style.cssText = 'flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:20px;';
  body.innerHTML = contentHtml;

  function cleanup() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
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
    overlay.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0.6);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:6000;';

    var content = document.createElement('div');
    content.className = 'modal-content card';
    content.style.cssText = 'box-sizing:border-box;width:min(92vw,440px);max-width:92vw;margin:clamp(24px,12vh,120px) auto;max-height:85vh;overflow-y:auto;background:#2A8CFF;color:#fff;border:6px solid #2C3E50;box-shadow:8px 8px 0 #2C3E50;padding:25px;text-align:center;position:relative;';

    var heading = document.createElement('h2');
    heading.textContent = title;
    heading.style.cssText = "font-family:'Arial Black',sans-serif;color:#FFF;background:#2C3E50;margin:-25px -25px 20px -25px;padding:15px;border-bottom:4px solid #E74C3C;text-transform:uppercase;text-align:left;";

    var text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = 'font-weight:bold;margin:0 0 20px 0;';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = cancelText;
    cancelBtn.style.cssText = 'flex:1;width:auto;margin:0;background:#FFF;color:#2C3E50;border:4px solid #2C3E50;box-shadow:4px 4px 0 #2C3E50;padding:14px;font-weight:900;text-transform:uppercase;cursor:pointer;';

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = confirmText;
    confirmBtn.style.cssText = 'flex:1;width:auto;margin:0;background:#E74C3C;color:#FFF;border:4px solid #2C3E50;box-shadow:4px 4px 0 #2C3E50;padding:14px;font-weight:900;text-transform:uppercase;cursor:pointer;';

    function cleanup(result) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      resolve(result);
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
  function resumeRefresh() {
    if (typeof window.reconnectRealtime === 'function') {
      try { window.reconnectRealtime(); } catch (e) {}
    }
    if (typeof window.refreshPageData === 'function') {
      try { window.refreshPageData(); } catch (e) {}
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

  document.addEventListener('touchmove', function(e) {
    if (!pulling) return;
    distance = e.touches[0].clientY - startY;
    if (distance <= 0) { reset(); return; }
    var bar = getIndicator();
    bar.style.height = Math.min(distance * 0.5, 60) + 'px';
    bar.textContent = distance > THRESHOLD ? 'Släpp för att uppdatera' : 'Dra för att uppdatera';
  }, { passive: true });

  document.addEventListener('touchend', function() {
    if (!pulling) return;
    pulling = false;
    if (distance > THRESHOLD) {
      var bar = getIndicator();
      bar.style.height = '60px';
      bar.textContent = 'Uppdaterar...';
      setTimeout(function() { window.location.reload(); }, 60);
    } else {
      reset();
    }
  }, { passive: true });

  document.addEventListener('touchcancel', function() {
    pulling = false;
    reset();
  }, { passive: true });
})();