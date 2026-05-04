function getProfile() {
  return JSON.parse(localStorage.getItem('userProfile')) || { name: 'Gäst', weight: 70, gender: 'man', funzone: 1.0 };
}

function getZones() {
  const profile = getProfile();
  return {
    redMax: profile.funzone,
    greenMax: 3.0
  };
}