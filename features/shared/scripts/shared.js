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
  if (!sb) return;
  const drinkTime = new Date(timestamp).toISOString();
  const { error: deleteError } = await sb.from('drinks_logs')
    .delete()
    .eq('player_hash', profileId)
    .eq('drink_name', drinkName)
    .eq('consumed_at', drinkTime);
  if (!deleteError) return;

  const { error: fallbackError } = await sb.from('drink_logs')
    .delete()
    .eq('player_hash', profileId)
    .eq('drink_name', drinkName)
    .eq('consumed_at', drinkTime);
  if (fallbackError) console.error('Error removing drink from cloud:', fallbackError);
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
  if (session) return session;
  
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