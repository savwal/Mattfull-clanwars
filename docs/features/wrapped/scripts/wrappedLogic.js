function openWrapped(type) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  if (currentDay < 24) {
    alert("Wrapped är inte tillgängligt ännu! Det släpps den 24:e.");
    return;
  }
  if (type === 'yearly' && currentMonth !== 11) {
    alert("Årets Wrapped släpps den 24:e December!");
    return;
  }
  const history = getDrinkHistory();
  let totalGrams = 0;
  let beerCount = 0, wineCount = 0, spritCount = 0;
  history.forEach(item => { 
    if(item.grams > 0) {
        totalGrams += item.grams; 
        if(item.abv <= 10) beerCount++;
        else if(item.abv <= 20) wineCount++;
        else spritCount++;
    }
  });
  const cl = calculateCl(totalGrams);
  document.getElementById('wrappedTitle').innerText = type === 'yearly' ? 'Årets Wrapped 🥂' : 'Månadens Wrapped 🔥';
  document.getElementById('wrappedGrams').innerText = cl.toFixed(1) + ' cl ren alkohol';
  document.getElementById('wrappedElo').innerText = cl.toFixed(1) + ' ‰';
  document.getElementById('wrappedBeer').innerText = beerCount;
  document.getElementById('wrappedWine').innerText = wineCount;
  document.getElementById('wrappedSprit').innerText = spritCount;
  document.getElementById('wrappedModal').style.display = 'block';
}
function closeWrapped() {
  document.getElementById('wrappedModal').style.display = 'none';
}