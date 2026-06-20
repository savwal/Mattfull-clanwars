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
  summary.innerHTML = '<p style="margin:0; color:#5a6570; font-weight:bold;">Laddar dina loggar...</p>';
  list.innerHTML = '';

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  // Locate every drink this user has logged via their player_hash.
  const { data, error } = await sb.from('drink_logs')
    .select('id, player_hash, drink_name, volume_ml, abv, grams_alcohol, consumed_at')
    .eq('player_hash', profile.id)
    .order('consumed_at', { ascending: false });

  if (error) {
    summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">Kunde inte hämta loggarna.</p>';
    return;
  }

  const logs = data || [];
  if (logs.length === 0) {
    summary.innerHTML = '<p style="margin:0; color:#5a6570; font-weight:bold;">Du har inga registrerade drycker än.</p>';
    return;
  }

  const totalGrams = logs.reduce((sum, log) => sum + resolveDrinkGrams(log), 0);
  const totalCl = Math.abs(calculateCl(totalGrams));

  summary.innerHTML = `
    <div style="display:grid; gap:8px; text-align:left;">
      <div><strong>Antal loggar:</strong> ${logs.length}</div>
      <div><strong>Total alkohol:</strong> ${totalCl.toFixed(1)} cl</div>
    </div>
  `;

  list.innerHTML = logs.map(renderDrinkLogItem).join('');
}

function closeHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  if (modal) modal.style.display = 'none';
}
