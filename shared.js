function initProfiles() {
  let profiles = JSON.parse(localStorage.getItem('profiles')) || [];
  if (profiles.length === 0) {
    const defaultProfile = { id: Date.now().toString(), name: 'Gäst', weight: 70, gender: 'man', funzone: 1.0, pic: '' };
    profiles.push(defaultProfile);
    localStorage.setItem('profiles', JSON.stringify(profiles));
    localStorage.setItem('activeProfileId', defaultProfile.id);
  }
}
initProfiles();

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
}

function switchProfile(id) {
  localStorage.setItem('activeProfileId', id);
}

function getZones() {
  const profile = getActiveProfile();
  return { redMax: profile.funzone, greenMax: 3.0 };
}

function getDrinkHistory() {
  const profile = getActiveProfile();
  const history = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
  return history[profile.id] || [];
}

function saveDrinkHistory(history) {
  const profile = getActiveProfile();
  const allHistory = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
  allHistory[profile.id] = history;
  localStorage.setItem('drinkHistory_all', JSON.stringify(allHistory));
}