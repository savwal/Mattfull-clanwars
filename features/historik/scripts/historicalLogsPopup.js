// Resolve the grams of alcohol for a logged drink, falling back to the
// volume/abv calculation when grams_alcohol was not stored. Values are only
// read here — never modified — so what is shown matches what was logged.
function resolveDrinkGrams(log) {
  const grams = Number(log.grams_alcohol);
  if (Number.isFinite(grams)) return grams;
  const volumeMl = Number(log.volume_ml) || 0;
  const abv = Number(log.abv) || 0;
  return volumeMl * (abv / 100) * 0.789;
}

function renderDrinkLogItem(log) {
  const grams = resolveDrinkGrams(log);
  const cl = Math.abs(calculateCl(grams));
  const name = log.drink_name || 'Okänd dryck';
  const volumeMl = Number(log.volume_ml) || 0;
  const abv = Number(log.abv) || 0;
  const consumed = log.consumed_at ? new Date(log.consumed_at) : null;
  const whenLabel = consumed ? consumed.toLocaleString('sv-SE') : 'Okänt datum';

  return `<li>
    <div class="drink-log-item" style="width:100%;">
      <div class="drink-log-info">
        <span class="drink-log-name">${name}</span>
        <span class="drink-log-sub">${volumeMl} ml · ${abv}% · ${whenLabel}</span>
      </div>
      <div class="drink-log-cl">${cl.toFixed(1)} cl</div>
    </div>
  </li>`;
}

async function openHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  const meta = document.getElementById('historicalLogsMeta');
  const summary = document.getElementById('historicalLogsSummary');
  const list = document.getElementById('historicalLogsList');

  if (!modal || !meta || !summary || !list) return;
  modal.style.display = 'block';

  const profile = getActiveProfile();
  if (!sb || !profile || !profile.id) {
    meta.textContent = 'Historiska loggar';
    summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">Kunde inte hitta din profil.</p>';
    list.innerHTML = '';
    return;
  }

  meta.textContent = 'Dina registrerade drycker';
  summary.innerHTML = '';
  list.innerHTML = '<li class="loading-row"><span class="loading-spinner"></span> Laddar dina loggar...</li>';

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  // Read every drink from the shared drink_logs cache (the same single fetch the
  // leaderboards use) and keep just this player's, newest first — no dedicated
  // query for this popup.
  let allDrinks = [];
  if (window.sharedData && typeof window.sharedData.getDrinkLogs === 'function') {
    allDrinks = await window.sharedData.getDrinkLogs();
  } else {
    const { data, error } = await sb.from('drink_logs')
      .select('player_hash, drink_name, volume_ml, abv, grams_alcohol, consumed_at')
      .eq('player_hash', profile.id);
    if (error) {
      summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">Kunde inte hämta loggarna.</p>';
      return;
    }
    allDrinks = data || [];
  }

  const logs = (allDrinks || [])
    .filter(d => d.player_hash === profile.id)
    .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime());
  if (logs.length === 0) {
    summary.innerHTML = '<p style="margin:0; color:#5a6570; font-weight:bold;">Du har inga registrerade drycker än.</p>';
    return;
  }

  const totalGrams = logs.reduce((sum, log) => sum + resolveDrinkGrams(log), 0);
  const totalCl = Math.abs(calculateCl(totalGrams));

  summary.innerHTML = `
    <div style="display:grid; gap:10px; text-align:left;">
      <div style="display:flex; align-items:center; gap:8px;"><strong>Antal enheter:</strong> <span style="display:inline-block; background:#FF6FB5; color:#111; border:3px solid #2C3E50; padding:4px 8px; font-weight:900; box-shadow:2px 2px 0 #2C3E50;">${logs.length}</span></div>
      <div style="display:flex; align-items:center; gap:8px;"><strong>Ren alkohol:</strong> <span style="display:inline-block; background:#2ECC71; color:#111; border:3px solid #2C3E50; padding:4px 8px; font-weight:900; box-shadow:2px 2px 0 #2C3E50;">${totalCl.toFixed(1)} cl</span></div>
    </div>
  `;

  list.innerHTML = logs.map(renderDrinkLogItem).join('');
}

function closeHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  if (modal) modal.style.display = 'none';
}
