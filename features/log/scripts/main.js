let historyData = [];
let lastZoneName = null;
let toastTimer = null;
let lastNonZeroTime = Date.now();
let graphResetCheckInterval = null;
let drinkReminderTimer = null;
const ZERO_BAC_THRESHOLD = 0.005;
const MAX_ABV = 98;
const MAX_VOLUME = 1000;
const ZERO_BAC_RESET_MS = 2 * 60 * 60 * 1000;

function getLastNonZeroKey(profileId) {
  return `lastNonZeroTime_${profileId}`;
}

function getStoredLastNonZeroTime(profileId) {
  if (!profileId) return null;
  const value = localStorage.getItem(getLastNonZeroKey(profileId));
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function setStoredLastNonZeroTime(profileId, value) {
  if (!profileId) return;
  localStorage.setItem(getLastNonZeroKey(profileId), String(value));
}

function validateDrinkInput(name, volume, abv) {
  if (!name) return { ok: false, message: 'Välj en dryckstyp.' };
  if (!Number.isFinite(volume) || volume <= 0 || volume > MAX_VOLUME) {
    return { ok: false, message: 'Sluta ljug' };
  }
  if (!Number.isFinite(abv) || abv < 0 || abv > MAX_ABV) {
    return { ok: false, message: 'Sluta ljug' };
  }
  return { ok: true };
}

function getZoneName(bac, zones) {
  if (bac <= zones.legalMax) return 'Tiger Woods zone';
  if (bac <= zones.redMax) return 'Farthållare';
  if (bac <= zones.greenMax) return 'Funzone';
  return 'Sangriagränsen';
}

function notifyZoneChange(currentZone) {
  if (lastZoneName && currentZone !== lastZoneName) {
    showZoneToast(`Du går in i ${currentZone}.`);
  }
  lastZoneName = currentZone;
}

function showZoneToast(message) {
  const toast = document.getElementById('zoneToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('error', message === 'Sluta ljug');
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function getLatestDrinkTimestamp() {
  if (!historyData || historyData.length === 0) return null;
  return Math.max(...historyData.map((entry) => entry.timestamp));
}

function scheduleDrinkReminder(timestamp) {
  if (!timestamp) return;
  if (drinkReminderTimer) {
    clearTimeout(drinkReminderTimer);
  }
  const targetTime = timestamp + 20 * 60 * 1000;
  const delay = targetTime - Date.now();
  if (delay <= 0) return;
  drinkReminderTimer = setTimeout(() => {
    if (typeof showDrinkReminderNotification === 'function') {
      showDrinkReminderNotification();
    }
  }, delay);
}

document.addEventListener("DOMContentLoaded", () => {
  historyData = getDrinkHistory();
  const profile = getActiveProfile();
  const storedLastNonZero = profile ? getStoredLastNonZeroTime(profile.id) : null;
  if (storedLastNonZero) {
    lastNonZeroTime = storedLastNonZero;
  } else if (profile && historyData.length > 0) {
    const currentBAC = calculateBACAtTime(historyData, profile, Date.now());
    if (currentBAC <= ZERO_BAC_THRESHOLD) {
      lastNonZeroTime = historyData[historyData.length - 1].timestamp;
    } else {
      lastNonZeroTime = Date.now();
    }
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
  } else {
    lastNonZeroTime = Date.now();
  }
  const quickAddBubble = document.querySelector('.quick-add-bubble');
  if (quickAddBubble) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        quickAddBubble.classList.toggle('is-compact', window.scrollY > 120);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  updateUI();
  scheduleDrinkReminder(getLatestDrinkTimestamp());
  setInterval(updateUI, 60000);
  // Check for graph reset every minute
  graphResetCheckInterval = setInterval(checkGraphReset, 60000);
});

function openDrinkModal() {
  document.getElementById('drinkModal').style.display = 'block';
  renderCategoryTiles('modalContentContainer'); 
}

function addDrink() {
  const name = document.getElementById('name').value;
  const volume = parseFloat(document.getElementById('volume').value);
  const abv = parseFloat(document.getElementById('abv').value);
  const validation = validateDrinkInput(name, volume, abv);
  if (!validation.ok) {
    showZoneToast(validation.message);
    return;
  }
  const grams = parseFloat((volume * (abv / 100) * 0.789).toFixed(1));
  saveEntry(name, volume, abv, grams);
}

function ulta() {
  const now = Date.now();
  const limit = now - 30 * 60000;
  let sum = 0;
  historyData.forEach(item => {
    if (item.timestamp >= limit && item.grams > 0) {
      sum += item.grams;
    }
  });
  if (sum > 0) {
    saveEntry("Ulta", 0, 0, -parseFloat(sum.toFixed(1)));
  }
}

function saveEntry(name, volume, abv, grams) {
  if (volume > MAX_VOLUME || abv > MAX_ABV) {
    showZoneToast('Ogiltig volym eller alkoholhalt.');
    return;
  }
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  historyData.push({ name, volume, abv, grams, time, timestamp: now.getTime() });
  // If previous BAC was effectively zero, treat this as a graph-reset event:
  const profile = getActiveProfile();
  const prevBAC = profile ? calculateBACAtTime(historyData.slice(0, -1), profile, Date.now()) : 0;
  if (prevBAC <= ZERO_BAC_THRESHOLD && grams > 0) {
    // Keep only the newly added drink locally so graph resets, but still sync new drink to cloud
    const newDrink = historyData[historyData.length - 1];
    if (profile) syncDrinkToSupabase(profile.id, newDrink);
    historyData = [newDrink];
    saveDrinkHistory(historyData);
  } else {
    saveDrinkHistory(historyData);
  }
  scheduleDrinkReminder(now.getTime());
  document.getElementById('name').value = '';
  document.getElementById('volume').value = '';
  document.getElementById('abv').value = '';
  updateUI();
}

function updateUI() {
  const list = document.getElementById('history');
  list.innerHTML = '';
  let total = 0;
  const profile = getActiveProfile();
  
  if (profile.pic) {
    document.getElementById('userPic').src = profile.pic;
    document.getElementById('userPic').style.display = 'block';
  }

  for (let i = historyData.length - 1; i >= 0; i -= 1) {
    const item = historyData[i];
    total += item.grams;
    const li = document.createElement('li');
    const clValue = calculateCl(item.grams);
    const timestamp = new Date(item.timestamp);
    const dateLabel = timestamp.toLocaleDateString();
    const timeLabel = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    li.innerHTML = `<div><strong>${dateLabel} ${timeLabel}</strong>: ${item.name} <br><span style="color:#2C3E50;">${Math.abs(clValue).toFixed(1)}cl alkohol</span></div>`;
    const btn = document.createElement('button');
    btn.className = 'danger';
    btn.textContent = "X";
    btn.onclick = () => removeDrink(i);
    li.appendChild(btn);
    list.appendChild(li);
  }
  
  if (total < 0) total = 0;
  
  const currentBACValue = calculateBACAtTime(historyData, profile, Date.now());
  const currentBAC = Math.abs(currentBACValue).toFixed(2);
  document.getElementById('totalCl').textContent = Math.abs(calculateCl(total)).toFixed(1);
  document.getElementById('promille').textContent = currentBAC;
  notifyZoneChange(getZoneName(currentBACValue, getZones(profile)));

  const labels = [];
  const dataPoints = [];
  const timeline = [];
  
  if (historyData.length > 0) {
    const firstTime = new Date(historyData[0].timestamp).getTime();
    const endTime = Date.now() + (3600000 * 2); 
    for (let t = firstTime; t <= endTime; t += 900000) {
      const label = new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const value = calculateBACAtTime(historyData, profile, t);
      timeline.push({ time: t, label, value });
    }
  }
  timeline.forEach(point => {
    labels.push(point.label);
    dataPoints.push(Math.abs(point.value).toFixed(2));
  });

  let currentLabel = null;
  if (timeline.length > 0) {
    const now = Date.now();
    let closestIndex = 0;
    let closestDiff = Math.abs(timeline[0].time - now);
    for (let i = 1; i < timeline.length; i++) {
      const diff = Math.abs(timeline[i].time - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    currentLabel = timeline[closestIndex].label;
  }

  const chartCanvas = document.getElementById('promilleChart');
  if (chartCanvas) {
    const minWidth = 700;
    const pointWidth = 60;
    const targetWidth = Math.max(minWidth, labels.length * pointWidth);
    chartCanvas.style.width = `${targetWidth}px`;
    chartCanvas.style.height = '300px';
  }

  renderChart('promilleChart', labels, dataPoints, getZones(profile), { currentLabel });
}

function removeDrink(index) {
  const profile = getActiveProfile();
  const removedDrink = historyData[index];
  
  // Sync removal to Supabase
  if (profile && removedDrink) {
    removeDrinkFromSupabase(profile.id, removedDrink.name, removedDrink.timestamp);
  }
  
  historyData.splice(index, 1);
  saveDrinkHistory(historyData);
  scheduleDrinkReminder(getLatestDrinkTimestamp());
  updateUI();
}

function archiveCurrentHistory(profileId) {
  if (!profileId || !Array.isArray(historyData) || historyData.length === 0) return;
  appendArchivedDrinkHistory(profileId, historyData);
  historyData = [];
  saveDrinkHistory(historyData);
}

function checkGraphReset() {
  const profile = getActiveProfile();
  if (!profile) return;
  
  const currentBAC = calculateBACAtTime(historyData, profile, Date.now());
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const lastResetKey = `lastGraphReset_${profile.id}`;
  const lastResetDate = localStorage.getItem(lastResetKey);
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // If current BAC is above 0.00, update lastNonZeroTime
  if (currentBAC > ZERO_BAC_THRESHOLD) {
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
  }
  else if (historyData.length > 0 && Date.now() - lastNonZeroTime >= ZERO_BAC_RESET_MS) {
    // Reset the displayed graph locally without removing drinks from the cloud
    historyData = [];
    saveDrinkHistory(historyData);
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
    localStorage.setItem(lastResetKey, today);
    scheduleDrinkReminder(getLatestDrinkTimestamp());
    showZoneToast('Blodflödegraf återställd efter 2h 0.00 ‰.');
    updateUI();
  }
  // Daily reset at 11:00 AM if BAC is 0.00 and hasn't reset today
  else if (currentBAC <= ZERO_BAC_THRESHOLD && currentHour === 11 && lastResetDate !== today) {
    // Reset the graph display by resetting lastNonZeroTime
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
    localStorage.setItem(lastResetKey, today);
    showZoneToast('Blodflödegraf återställd på 11:00 AM!');
    updateUI();
  }
}