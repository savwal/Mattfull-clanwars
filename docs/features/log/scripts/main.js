let historyData = [];
let lastZoneName = null;
let graphStartPercent = 0;
let toastTimer = null;

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
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  historyData = getDrinkHistory();
  const slider = document.getElementById('graphStartSlider');
  if (slider) {
    graphStartPercent = parseFloat(slider.value) || 0;
    slider.addEventListener('input', (event) => {
      graphStartPercent = parseFloat(event.target.value) || 0;
      updateUI();
    });
  }
  updateUI();
  setInterval(updateUI, 60000);
});

function openDrinkModal() {
  document.getElementById('drinkModal').style.display = 'block';
  renderCategoryTiles('modalContentContainer'); 
}

function addDrink() {
  const name = document.getElementById('name').value;
  const volume = parseFloat(document.getElementById('volume').value);
  const abv = parseFloat(document.getElementById('abv').value);
  if (!name || isNaN(volume) || isNaN(abv)) return;
  const grams = parseFloat((volume * (abv / 100) * 0.789).toFixed(1));
  saveEntry(name, volume, abv, grams);
}

function gragasUlt() {
  const now = Date.now();
  const limit = now - 30 * 60000;
  let sum = 0;
  historyData.forEach(item => {
    if (item.timestamp >= limit && item.grams > 0) {
      sum += item.grams;
    }
  });
  if (sum > 0) {
    saveEntry("Gragas Ult", 0, 0, -parseFloat(sum.toFixed(1)));
  }
}

function saveEntry(name, volume, abv, grams) {
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  historyData.push({ name, volume, abv, grams, time, timestamp: now.getTime() });
  saveDrinkHistory(historyData);
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

  historyData.forEach((item, index) => {
    total += item.grams;
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${item.time}</strong>: ${item.name} <br><span style="color:#2C3E50;">${item.grams > 0 ? '+' : ''}${item.grams.toFixed(1)}g alkohol</span></div>`;
    const btn = document.createElement('button');
    btn.className = 'danger';
    btn.textContent = "X";
    btn.onclick = () => removeDrink(index);
    li.appendChild(btn);
    list.appendChild(li);
  });
  
  if (total < 0) total = 0;
  
  const currentBACValue = calculateBACAtTime(historyData, profile, Date.now());
  const currentBAC = currentBACValue.toFixed(2);
  document.getElementById('totalGrams').textContent = total.toFixed(1);
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
  const totalPoints = timeline.length;
  const startIndex = totalPoints > 0 ? Math.floor((graphStartPercent / 100) * (totalPoints - 1)) : 0;
  const visible = timeline.slice(startIndex);
  visible.forEach(point => {
    labels.push(point.label);
    dataPoints.push(point.value.toFixed(2));
  });

  const currentTimeLabel = document.getElementById('currentTimeLabel');
  if (currentTimeLabel) {
    currentTimeLabel.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
  const graphStartLabel = document.getElementById('graphStartLabel');
  if (graphStartLabel) {
    const label = totalPoints > 0 ? timeline[startIndex].label : '--:--';
    graphStartLabel.textContent = `Start: ${label}`;
  }

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
    if (closestIndex >= startIndex) {
      currentLabel = timeline[closestIndex].label;
    } else if (visible.length > 0) {
      currentLabel = visible[0].label;
    }
  }

  renderChart('promilleChart', labels, dataPoints, getZones(profile), { currentLabel });
}

function removeDrink(index) {
  historyData.splice(index, 1);
  saveDrinkHistory(historyData);
  updateUI();
}