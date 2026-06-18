var historyData = [];
var lastZoneName = null;
var toastTimer = null;
var lastNonZeroTime = Date.now();
var graphResetCheckInterval = null;
var drinkReminderTimer = null;
var ZERO_BAC_THRESHOLD = 0.005;
var MAX_ABV = 98;
var MAX_VOLUME = 1000;
var ZERO_BAC_RESET_MS = 2 * 60 * 60 * 1000;
var DISPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;

function getLastNonZeroKey(profileId) {
  return 'lastNonZeroTime_' + profileId;
}

function getStoredLastNonZeroTime(profileId) {
  if (!profileId) return null;
  var value = localStorage.getItem(getLastNonZeroKey(profileId));
  var parsed = value ? Number(value) : NaN;
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
    showZoneToast('Du går in i ' + currentZone + '.');
  }
  lastZoneName = currentZone;
}

function showZoneToast(message) {
  var toast = document.getElementById('zoneToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('error', message === 'Sluta ljug');
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

function getLatestDrinkTimestamp() {
  if (!historyData || historyData.length === 0) return null;
  var max = historyData[0].timestamp;
  for (var i = 1; i < historyData.length; i++) {
    if (historyData[i].timestamp > max) max = historyData[i].timestamp;
  }
  return max;
}

function scheduleDrinkReminder(timestamp) {
  if (!timestamp) return;
  if (drinkReminderTimer) clearTimeout(drinkReminderTimer);
  var targetTime = timestamp + 20 * 60 * 1000;
  var delay = targetTime - Date.now();
  if (delay <= 0) return;
  drinkReminderTimer = setTimeout(function() {
    if (typeof showDrinkReminderNotification === 'function') {
      showDrinkReminderNotification();
    }
  }, delay);
}

// Returns all drinks visible in the history panel:
// current session + archived entries within the 24h window.
function getDisplayHistory() {
  var profile = getActiveProfile();
  if (!profile) return historyData.slice();
  var cutoff = Date.now() - DISPLAY_WINDOW_MS;
  var archived = typeof getArchivedDrinkHistory === 'function'
    ? getArchivedDrinkHistory(profile.id)
    : [];
  var recent = [];
  for (var i = 0; i < archived.length; i++) {
    if (archived[i].timestamp > cutoff) recent.push(archived[i]);
  }
  // Combine current session + archived, dedup by timestamp
  var seen = {};
  var combined = [];
  var all = historyData.concat(recent);
  for (var j = 0; j < all.length; j++) {
    var key = all[j].timestamp + '_' + all[j].name;
    if (!seen[key]) {
      seen[key] = true;
      combined.push(all[j]);
    }
  }
  combined.sort(function(a, b) { return b.timestamp - a.timestamp; });
  return combined;
}

document.addEventListener('DOMContentLoaded', async function() {
  var profile = getActiveProfile();
  // On a brand-new device the local store is empty — seed it once from the DB
  // so the graph shows the old drinks. This never overwrites existing local
  // data, so changing pages can't reset the graph.
  if (profile && typeof restoreDrinkHistoryIfEmpty === 'function') {
    try { await restoreDrinkHistoryIfEmpty(profile.id, profile); } catch (e) {}
  }
  historyData = getDrinkHistory();
  var storedLastNonZero = profile ? getStoredLastNonZeroTime(profile.id) : null;
  if (storedLastNonZero) {
    lastNonZeroTime = storedLastNonZero;
  } else if (profile && historyData.length > 0) {
    var currentBAC = calculateBACAtTime(historyData, profile, Date.now());
    if (currentBAC <= ZERO_BAC_THRESHOLD) {
      lastNonZeroTime = historyData[historyData.length - 1].timestamp;
    } else {
      lastNonZeroTime = Date.now();
    }
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
  } else {
    lastNonZeroTime = Date.now();
  }

  var quickAddBubble = document.querySelector('.quick-add-bubble');
  if (quickAddBubble) {
    var ticking = false;
    var onScroll = function() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function() {
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
  graphResetCheckInterval = setInterval(checkGraphReset, 60000);
});

function openDrinkModal() {
  document.getElementById('drinkModal').style.display = 'block';
  renderCategoryTiles('modalContentContainer');
}

function addDrink() {
  var name = document.getElementById('name').value;
  var volume = parseFloat(document.getElementById('volume').value);
  var abv = parseFloat(document.getElementById('abv').value);
  var validation = validateDrinkInput(name, volume, abv);
  if (!validation.ok) {
    showZoneToast(validation.message);
    return;
  }
  var grams = parseFloat((volume * (abv / 100) * 0.789).toFixed(1));
  saveEntry(name, volume, abv, grams);
}

function ulta() {
  var now = Date.now();
  var limit = now - 30 * 60000;
  var sum = 0;
  historyData.forEach(function(item) {
    if (item.timestamp >= limit && item.grams > 0) sum += item.grams;
  });
  if (sum > 0) {
    saveEntry('Ulta', 0, 0, -parseFloat(sum.toFixed(1)));
  }
}

function saveEntry(name, volume, abv, grams) {
  var now = new Date();
  var lastDrinkTimestamp = getLatestDrinkTimestamp();
  if (lastDrinkTimestamp && (now.getTime() - lastDrinkTimestamp) < 5000) {
    showZoneToast('Vänta lite innan du loggar nästa drink.');
    return;
  }
  if (volume > MAX_VOLUME || abv > MAX_ABV) {
    showZoneToast('Ogiltig volym eller alkoholhalt.');
    return;
  }
  var profile = getActiveProfile();

  // Only start a new session when there are no drinks in the current session.
  // Do NOT use prevBAC: alcohol takes ~60min to absorb so BAC stays near 0
  // for several minutes even after the first drink, which would incorrectly
  // reset the session on every quick subsequent drink.
  var isNewSession = historyData.length === 0;

  var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  historyData.push({ name: name, volume: volume, abv: abv, grams: grams, time: time, timestamp: now.getTime() });

  if (isNewSession && grams > 0) {
    var newDrink = historyData[historyData.length - 1];
    if (profile) syncDrinkToSupabase(profile.id, newDrink);
    historyData = [newDrink];
    // Write directly to avoid double-sync inside saveDrinkHistory
    try {
      var allHist = JSON.parse(localStorage.getItem('drinkHistory_all')) || {};
      allHist[profile.id] = historyData;
      localStorage.setItem('drinkHistory_all', JSON.stringify(allHist));
    } catch (e) {}
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
  var list = document.getElementById('history');
  list.innerHTML = '';
  var profile = getActiveProfile();

  if (profile && profile.pic) {
    var picEl = document.getElementById('userPic');
    if (picEl) {
      picEl.src = profile.pic;
      picEl.style.display = 'block';
    }
  }

  // Show all drinks logged within the last 24h (current session + archived)
  var displayItems = getDisplayHistory();
  var total = 0;

  displayItems.forEach(function(item) {
    if (item.grams > 0) total += item.grams;
    var li = document.createElement('li');
    var clValue = calculateCl(item.grams);
    var ts = new Date(item.timestamp);
    var dateLabel = ts.toLocaleDateString();
    var timeLabel = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var infoDiv = document.createElement('div');
    infoDiv.innerHTML = '<strong>' + dateLabel + ' ' + timeLabel + '</strong>: ' + item.name +
      ' <br><span style="color:#2C3E50;">' + Math.abs(clValue).toFixed(1) + 'cl alkohol</span>';
    li.appendChild(infoDiv);
    var btn = document.createElement('button');
    btn.className = 'danger';
    btn.textContent = 'X';
    (function(ts) {
      btn.onclick = function() { removeDrink(ts); };
    })(item.timestamp);
    li.appendChild(btn);
    list.appendChild(li);
  });

  var currentBACValue = calculateBACAtTime(historyData, profile, Date.now());
  var currentBAC = Math.abs(currentBACValue).toFixed(2);
  document.getElementById('totalCl').textContent = Math.abs(calculateCl(total)).toFixed(1);
  document.getElementById('promille').textContent = currentBAC;
  if (profile) notifyZoneChange(getZoneName(currentBACValue, getZones(profile)));

  // Build graph from current session only
  var labels = [];
  var dataPoints = [];
  var timeline = [];

  if (historyData.length > 0) {
    var firstTime = new Date(historyData[0].timestamp).getTime();
    var endTime = Date.now() + (3600000 * 2);
    for (var t = firstTime; t <= endTime; t += 900000) {
      var label = new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var value = calculateBACAtTime(historyData, profile, t);
      timeline.push({ time: t, label: label, value: value });
    }
  }
  timeline.forEach(function(point) {
    labels.push(point.label);
    dataPoints.push(Math.abs(point.value).toFixed(2));
  });

  var currentLabel = null;
  if (timeline.length > 0) {
    var now = Date.now();
    var closestIndex = 0;
    var closestDiff = Math.abs(timeline[0].time - now);
    for (var i = 1; i < timeline.length; i++) {
      var diff = Math.abs(timeline[i].time - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    currentLabel = timeline[closestIndex].label;
  }

  var chartCanvas = document.getElementById('promilleChart');
  if (chartCanvas) {
    var minWidth = 700;
    var pointWidth = 60;
    var targetWidth = Math.max(minWidth, labels.length * pointWidth);
    chartCanvas.style.width = targetWidth + 'px';
    chartCanvas.style.height = '300px';
  }

  renderChart('promilleChart', labels, dataPoints, getZones(profile), { currentLabel: currentLabel });
}

// Remove a drink by timestamp — works for both current session and archived entries
function removeDrink(timestamp) {
  var profile = getActiveProfile();

  // Try removing from current session first
  var idx = -1;
  for (var i = 0; i < historyData.length; i++) {
    if (historyData[i].timestamp === timestamp) { idx = i; break; }
  }
  if (idx !== -1) {
    var removed = historyData[idx];
    if (profile && removed) removeDrinkFromSupabase(profile.id, removed.name, removed.timestamp);
    historyData.splice(idx, 1);
    saveDrinkHistory(historyData);
  } else if (profile && typeof getArchivedDrinkHistory === 'function') {
    // Try archived
    var archived = getArchivedDrinkHistory(profile.id);
    var archIdx = -1;
    for (var j = 0; j < archived.length; j++) {
      if (archived[j].timestamp === timestamp) { archIdx = j; break; }
    }
    if (archIdx !== -1) {
      var removedArch = archived[archIdx];
      removeDrinkFromSupabase(profile.id, removedArch.name, removedArch.timestamp);
      archived.splice(archIdx, 1);
      saveArchivedDrinkHistory(profile.id, archived);
    }
  }
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
  var profile = getActiveProfile();
  if (!profile) return;

  var currentBAC = calculateBACAtTime(historyData, profile, Date.now());
  var now = new Date();
  var currentHour = now.getHours();
  var lastResetKey = 'lastGraphReset_' + profile.id;
  var lastResetDate = localStorage.getItem(lastResetKey);
  var today = now.toISOString().split('T')[0];

  if (currentBAC > ZERO_BAC_THRESHOLD) {
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
  } else if (historyData.length > 0 && Date.now() - lastNonZeroTime >= ZERO_BAC_RESET_MS) {
    // Archive current session instead of deleting — keeps drinks visible in the 24h list
    archiveCurrentHistory(profile.id);
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
    localStorage.setItem(lastResetKey, today);
    scheduleDrinkReminder(getLatestDrinkTimestamp());
    showZoneToast('Blodflödegraf återställd efter 2h 0.00 ‰.');
    updateUI();
  } else if (currentBAC <= ZERO_BAC_THRESHOLD && currentHour === 11 && lastResetDate !== today) {
    // Archive (don't just relabel) so the graph actually resets while the drinks
    // stay visible in the 24h "Enheter" list.
    archiveCurrentHistory(profile.id);
    lastNonZeroTime = Date.now();
    setStoredLastNonZeroTime(profile.id, lastNonZeroTime);
    localStorage.setItem(lastResetKey, today);
    scheduleDrinkReminder(getLatestDrinkTimestamp());
    showZoneToast('Blodflödegraf återställd på 11:00 AM!');
    updateUI();
  }
}

// Called by the shared resume/pull-to-refresh helpers when the app returns to
// the foreground, so the graph and history reflect the latest data.
window.refreshPageData = function() {
  historyData = getDrinkHistory();
  updateUI();
  scheduleDrinkReminder(getLatestDrinkTimestamp());
};
