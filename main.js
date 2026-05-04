let historyData = [];

document.addEventListener("DOMContentLoaded", () => {
  historyData = getDrinkHistory();
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
  
  const currentBAC = calculateBACAtTime(historyData, profile, Date.now()).toFixed(2);
  document.getElementById('totalGrams').textContent = total.toFixed(1);
  document.getElementById('promille').textContent = currentBAC;

  const labels = [];
  const dataPoints = [];
  
  if (historyData.length > 0) {
    const firstTime = new Date(historyData[0].timestamp).getTime();
    const endTime = Date.now() + (3600000 * 2); 
    for (let t = firstTime; t <= endTime; t += 900000) {
      labels.push(new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      dataPoints.push(calculateBACAtTime(historyData, profile, t).toFixed(2));
    }
  }

  renderChart('promilleChart', labels, dataPoints, getZones(profile));
}

function removeDrink(index) {
  historyData.splice(index, 1);
  saveDrinkHistory(historyData);
  updateUI();
}