const SUPABASE_URL = 'https://zynyfrqdrihrltdcbnfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v9oyPX430I7TusN4mKFYIw_AO4r033c';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function syncProfileToSupabase(profile) {
  if (!sb) return;
  const { error } = await sb.from('profiles').upsert({
    player_hash: profile.id,
    display_name: profile.name,
    weight: profile.weight,
    gender: profile.gender,
    funzone_limit: profile.funzone || 1.0,
    avatar_url: profile.pic || ''
  }, { onConflict: 'player_hash' });
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
function calculateCl(grams) {
  return grams / 7.89;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const isGitHubPages = location.hostname.endsWith('github.io');
    if (!isLocal && (location.protocol === 'https:' || isGitHubPages)) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });
}