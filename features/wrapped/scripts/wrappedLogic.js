function openWrapped(type) {
  const profile = getActiveProfile();
  if (!profile || !profile.id) {
    alert('Saknar aktiv profil.');
    return;
  }

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
  loadWrapped(profile.id, type);
}

async function loadWrapped(playerHash, type) {
  if (!sb) {
    alert('Databasen kunde inte laddas.');
    return;
  }

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  const now = new Date();
  let rangeStart, rangeEnd;
  if (type === 'yearly') {
    rangeStart = new Date(now.getFullYear(), 0, 1);
    rangeEnd = now;
  } else {
    // Monthly wrapped mirrors the clan scoring period: it covers the 25th of the
    // previous month through the 24th of this month. It is released on the 24th
    // (gated in openWrapped) so last month's wrapped stays visible from the 24th
    // through the end of the month.
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 25, 0, 0, 0, 0);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 24, 23, 59, 59, 999);
    rangeEnd = now < periodEnd ? now : periodEnd;
  }

  const { data: logs, error } = await sb.from('drink_logs')
    .select('drink_name, volume_ml, abv, grams_alcohol, consumed_at')
    .eq('player_hash', playerHash)
    .gte('consumed_at', rangeStart.toISOString())
    .lte('consumed_at', rangeEnd.toISOString())
    .order('consumed_at', { ascending: true });

  if (error) {
    console.error('Error loading wrapped data:', error);
    alert('Kunde inte läsa wrapped-data.');
    return;
  }

  const history = (logs || []).map(item => ({
    name: item.drink_name || 'Okänd dryck',
    volume: Number(item.volume_ml) || 0,
    abv: Number(item.abv) || 0,
    grams: Number.isFinite(Number(item.grams_alcohol))
      ? Number(item.grams_alcohol)
      : (Number(item.volume_ml) || 0) * ((Number(item.abv) || 0) / 100) * 0.789,
    timestamp: item.consumed_at ? new Date(item.consumed_at).getTime() : NaN
  })).filter(item => Number.isFinite(item.timestamp));

  let totalVolumeMl = 0;
  let totalGrams = 0;
  let beerCount = 0;
  let wineCount = 0;
  let spritCount = 0;

  history.forEach(item => {
    totalVolumeMl += item.volume;
    totalGrams += item.grams;
    if (item.abv <= 10) {
      beerCount++;
    } else if (item.abv <= 20) {
      wineCount++;
    } else {
      spritCount++;
    }
  });

  const totalCl = totalVolumeMl / 10;
  const alcoholCl = Math.abs(calculateCl(totalGrams));

  document.getElementById('wrappedTitle').innerText = type === 'yearly' ? 'Årets Wrapped 🥂' : 'Månadens Wrapped 🔥';
  document.getElementById('wrappedGrams').innerText = `${totalCl.toFixed(1)} cl totalt dryckesvolym`;
  document.getElementById('wrappedElo').innerText = `${alcoholCl.toFixed(1)} cl ren alkohol`;
  document.getElementById('wrappedBeer').innerText = beerCount;
  document.getElementById('wrappedWine').innerText = wineCount;
  document.getElementById('wrappedSprit').innerText = spritCount;
  document.getElementById('wrappedModal').style.display = 'block';
}
function closeWrapped() {
  document.getElementById('wrappedModal').style.display = 'none';
}