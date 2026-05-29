function calculateDrinkMetrics(logs) {
  return logs.reduce((accumulator, item) => {
    const volumeMl = Number(item.volume_ml) || 0;
    const abv = Number(item.abv) || 0;
    const grams = Number.isFinite(Number(item.grams_alcohol))
      ? Number(item.grams_alcohol)
      : volumeMl * (abv / 100) * 0.789;
    const drinkName = item.drink_name || 'Okänd dryck';

    accumulator.totalEntries += 1;
    accumulator.totalVolumeMl += volumeMl;
    accumulator.totalGrams += grams;
    accumulator.drinkCounts[drinkName] = (accumulator.drinkCounts[drinkName] || 0) + 1;
    return accumulator;
  }, {
    totalEntries: 0,
    totalVolumeMl: 0,
    totalGrams: 0,
    drinkCounts: {}
  });
}

function renderDrinkNameCounts(drinkCounts) {
  const entries = Object.entries(drinkCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'sv-SE'));

  if (entries.length === 0) {
    return '<div style="color:#7f8c8d; font-size:0.9em; margin-top:6px;">Inga dryckesnamn att visa.</div>';
  }

  return `<div style="margin-top:8px; display:grid; gap:4px;">
    ${entries.map(([name, count]) => `<div style="font-size:0.9em; color:#2C3E50;"><strong>${name}</strong>: ${count} st</div>`).join('')}
  </div>`;
}

function renderGroupedLogItem(group, displayName) {
  const metrics = calculateDrinkMetrics(group.logs);
  const totalCl = Math.abs(calculateCl(metrics.totalGrams));
  const latestTimestamp = group.logs.length > 0 ? new Date(group.logs[0].consumed_at) : null;
  const latestLabel = latestTimestamp ? latestTimestamp.toLocaleString('sv-SE') : 'Okänt datum';

  return `<li style="display:block; text-align:left; margin-bottom:14px;">
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
      <div>
        <div style="font-weight:900; color:#2C3E50;">${displayName}</div>
        <div style="font-size:0.85em; color:#7f8c8d;">${group.playerHash}</div>
      </div>
      <div style="text-align:right; font-size:0.85em; color:#7f8c8d;">Senaste: ${latestLabel}</div>
    </div>
    <div style="margin-top:8px; display:grid; gap:4px;">
      <div><strong>Antal loggar:</strong> ${metrics.totalEntries}</div>
      <div><strong>Total volym:</strong> ${metrics.totalVolumeMl} ml</div>
      <div><strong>Total alkohol:</strong> ${totalCl.toFixed(1)} cl</div>
      <div><strong>Totalt gram alkohol:</strong> ${metrics.totalGrams.toFixed(1)} g</div>
    </div>
    ${renderDrinkNameCounts(metrics.drinkCounts)}
  </li>`;
}

function groupLogsByPlayer(logs) {
  const grouped = {};
  (logs || []).forEach(item => {
    const playerHash = item.player_hash || 'okänt';
    if (!grouped[playerHash]) {
      grouped[playerHash] = [];
    }
    grouped[playerHash].push(item);
  });

  return Object.keys(grouped)
    .sort((left, right) => left.localeCompare(right, 'sv-SE'))
    .map(playerHash => ({
      playerHash,
      logs: grouped[playerHash].sort((left, right) => new Date(right.consumed_at).getTime() - new Date(left.consumed_at).getTime())
    }));
}

async function openHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  const meta = document.getElementById('historicalLogsMeta');
  const summary = document.getElementById('historicalLogsSummary');
  const list = document.getElementById('historicalLogsList');

  if (!modal || !meta || !summary || !list) return;
  modal.style.display = 'block';
  if (!sb) {
    meta.textContent = 'Historiska loggar';
    summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">Databasen kunde inte laddas.</p>';
    return;
  }

  meta.textContent = 'Visar historiska loggar sorterade per player_hash';
  summary.innerHTML = '<p style="margin:0; color:#7f8c8d; font-weight:bold;">Laddar historiska loggar...</p>';
  list.innerHTML = '';

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  const { data, error } = await sb.from('drink_logs')
    .select('id, player_hash, drink_name, volume_ml, abv, grams_alcohol, consumed_at')
    .order('player_hash', { ascending: true })
    .order('consumed_at', { ascending: false });

  if (error) {
    summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">Kunde inte hämta loggarna.</p>';
    return;
  }

  const logs = data || [];
  if (logs.length === 0) {
    summary.innerHTML = '<p style="margin:0; color:#7f8c8d; font-weight:bold;">Inga historiska loggar att visa.</p>';
    return;
  }

  const groupedLogs = groupLogsByPlayer(logs);
  const uniqueHashes = groupedLogs.map(group => group.playerHash);
  const profiles = await sb.from('profiles')
    .select('player_hash, display_name')
    .in('player_hash', uniqueHashes);
  const profileMap = (profiles.data || []).reduce((accumulator, profile) => {
    accumulator[profile.player_hash] = profile.display_name;
    return accumulator;
  }, {});

  const overallMetrics = calculateDrinkMetrics(logs);
  summary.innerHTML = `
    <div style="display:grid; gap:8px; text-align:left;">
      <div><strong>Antal player_hash:</strong> ${groupedLogs.length}</div>
      <div><strong>Antal loggar:</strong> ${overallMetrics.totalEntries}</div>
      <div><strong>Total volym:</strong> ${overallMetrics.totalVolumeMl} ml</div>
      <div><strong>Total alkohol:</strong> ${Math.abs(calculateCl(overallMetrics.totalGrams)).toFixed(1)} cl</div>
    </div>
  `;

  list.innerHTML = groupedLogs.map(group => {
    const displayName = profileMap[group.playerHash] || group.playerHash;
    return renderGroupedLogItem(group, displayName);
  }).join('');
}

function closeHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  if (modal) modal.style.display = 'none';
}
