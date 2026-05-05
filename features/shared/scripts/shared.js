function initApp() {
  let globalData = JSON.parse(localStorage.getItem('plupfull_global')) || { persons: {}, clans: {} };
  localStorage.setItem('plupfull_global', JSON.stringify(globalData));
}
initApp();
function getGlobalData() {
  return JSON.parse(localStorage.getItem('plupfull_global'));
}
function saveGlobalData(data) {
  localStorage.setItem('plupfull_global', JSON.stringify(data));
}
function checkRegistration() {
  let profiles = JSON.parse(localStorage.getItem('profiles')) || [];
  if (profiles.length === 0 && !window.location.href.includes('register.html')) {
    window.location.href = 'register.html';
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