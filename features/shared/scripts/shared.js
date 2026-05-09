function initApp() {
  let globalData = JSON.parse(localStorage.getItem('redlös_global')) || { persons: {}, clans: {} };
  localStorage.setItem('redlös_global', JSON.stringify(globalData));
}
initApp();
function getGlobalData() {
  return JSON.parse(localStorage.getItem('redlös_global'));
}
function saveGlobalData(data) {
  localStorage.setItem('redlös_global', JSON.stringify(data));
}
function getRepoBasePath() {
  const path = window.location.pathname;
  const featuresIndex = path.indexOf('/features/');
  if (featuresIndex !== -1) {
    return path.slice(0, featuresIndex);
  }
  const indexMatch = path.lastIndexOf('/index.html');
  if (indexMatch !== -1) {
    return path.slice(0, indexMatch);
  }
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.slice(0, lastSlash) : '';
}
function checkRegistration() {
  let profiles = JSON.parse(localStorage.getItem('profiles')) || [];
  if (profiles.length === 0 && !window.location.href.includes('register.html')) {
    const basePath = getRepoBasePath();
    window.location.href = `${basePath}/features/register/pages/register.html`;
  }
}
checkRegistration();
function getProfiles() {
  return JSON.parse(localStorage.getItem('profiles')) || [];
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
  const history = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
  return history[profile.id] || [];
}
function saveDrinkHistory(history) {
  const profile = getActiveProfile();
  if(!profile) return;
  const allHistory = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
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