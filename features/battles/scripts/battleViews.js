const BATTLE_GRAPH_STEP_MINUTES = 30;

function buildDrinkHistory(drinkLogs) {
  return (drinkLogs || []).map(d => {
    const timestamp = new Date(d.consumed_at).getTime();
    const gramsValue = Number(d.grams_alcohol);
    const volumeValue = Number(d.volume_ml);
    const abvValue = Number(d.abv);
    const gramsFromColumn = Number.isFinite(gramsValue) ? gramsValue : NaN;
    const canDeriveGrams = Number.isFinite(volumeValue) && Number.isFinite(abvValue);
    const gramsDerived = canDeriveGrams
      ? parseFloat((volumeValue * (abvValue / 100) * 0.789).toFixed(1))
      : NaN;
    const grams = Number.isFinite(gramsFromColumn) ? gramsFromColumn : gramsDerived;

    return {
      name: d.drink_name || 'Okänd dryck',
      volume: Number.isFinite(volumeValue) ? volumeValue : 0,
      abv: Number.isFinite(abvValue) ? abvValue : 0,
      grams,
      timestamp
    };
  }).filter(entry => Number.isFinite(entry.timestamp) && Number.isFinite(entry.grams))
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchProfileByHash(hash) {
  if (!sb || !hash) return null;
  const { data } = await sb.from('profiles')
    .select('player_hash, display_name, avatar_url, weight, gender, funzone_limit')
    .eq('player_hash', hash)
    .maybeSingle();
  return data || null;
}

async function fetchRecentDrinksByHash(hash, sinceISO = null) {
  if (!sb || !hash) return [];
  const nowMs = Date.now();
  const lookbackMs = nowMs - 24 * 60 * 60 * 1000;
  let sinceMs = lookbackMs;
  if (sinceISO) {
    const parsed = new Date(sinceISO).getTime();
    if (Number.isFinite(parsed)) {
      sinceMs = Math.max(parsed, lookbackMs);
    }
  }
  const lookbackISO = new Date(sinceMs).toISOString();
  const { data } = await sb.from('drink_logs')
    .select('drink_name, volume_ml, abv, grams_alcohol, consumed_at')
    .eq('player_hash', hash)
    .gte('consumed_at', lookbackISO)
    .order('consumed_at', { ascending: true });
  return data || [];
}

function buildGraphSeries(history, profile) {
  if (!history || history.length === 0) return null;
  const nowMs = Date.now();
  const horizonMs = 2 * 60 * 60 * 1000;
  const stepMs = 15 * 60 * 1000;
  const labels = [];
  const dataPoints = [];

  // Graph starts at opponent's current promille and projects forward iteratively.
  const currentBacRaw = calculateBACAtTime(history, profile, nowMs);
  const currentBac = Number.isFinite(currentBacRaw) ? currentBacRaw : 0;
  for (let t = nowMs; t <= nowMs + horizonMs; t += stepMs) {
    const projected = t === nowMs ? currentBac : calculateBACAtTime(history, profile, t);
    const bac = Number.isFinite(projected) ? Math.abs(projected) : 0;
    const label = new Date(t).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    labels.push(label);
    dataPoints.push(Number(bac.toFixed(3)));
  }

  return { labels, dataPoints, currentLabel: labels[0] || null };
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function normalizeProfile(hash, profile) {
  const displayName = profile && profile.display_name ? profile.display_name : hash;
  const funzone = profile && Number.isFinite(profile.funzone)
    ? profile.funzone
    : (profile && Number.isFinite(profile.funzone_limit) ? profile.funzone_limit : 1.0);
  const weight = profile && Number.isFinite(Number(profile.weight)) ? Number(profile.weight) : 75;
  const gender = profile && typeof profile.gender === 'string' ? profile.gender : 'man';
  return {
    player_hash: hash,
    display_name: displayName,
    weight,
    gender,
    funzone
  };
}

function renderStats(prefix, profile, history, series) {
  if (!series || !Array.isArray(series.dataPoints) || series.dataPoints.length === 0) {
    setText(`${prefix}Promille`, '0.00 promille');
    setText(`${prefix}Status`, 'Ingen giltig dryckdata.');
    return;
  }
  const totalGrams = history.reduce((sum, d) => sum + d.grams, 0);
  const maxBac = Math.abs(Math.max(...series.dataPoints));
  const currentBac = Math.abs(calculateBACAtTime(history, profile, Date.now()));
  const lastDrink = history[history.length - 1];
  const zones = getZones(profile);

  setText(`${prefix}Promille`, `${currentBac.toFixed(2)} promille`);
  setHtml(`${prefix}Stats`, `
    <p style="margin:3px 0;"><strong>Vikt:</strong> ${profile.weight} kg</p>
    <p style="margin:3px 0;"><strong>Kon:</strong> ${profile.gender === 'kvinna' ? 'Kvinna' : 'Man'}</p>
    <p style="margin:3px 0;"><strong>Funzone:</strong> ${zones.redMax.toFixed(1)} promille</p>
    <p style="margin:3px 0;"><strong>Total:</strong> ${totalGrams.toFixed(1)} g (${Math.abs(calculateCl(totalGrams)).toFixed(1)} cl)</p>
    <p style="margin:3px 0;"><strong>Max promille:</strong> ${maxBac.toFixed(2)} promille</p>
    <p style="margin:3px 0;"><strong>Nuvarande promille:</strong> ${currentBac.toFixed(2)} promille</p>
    <p style="margin:3px 0;"><strong>Senaste dryck:</strong> ${lastDrink.name} (${lastDrink.volume} ml, ${lastDrink.abv}% abv)</p>
  `);

  renderChart(`${prefix}Canvas`, series.labels, series.dataPoints, zones, { currentLabel: series.currentLabel });
}

async function renderSingleBattle(hash, battleStartISO = null) {
  hide('singleContent');
  show('singleLoading');

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  if (!hash || !sb) {
    setText('singleStatus', 'Saknar hash.');
    hide('singleLoading');
    return;
  }

  setText('singleHash', hash);

  const [profile, recentLogs] = await Promise.all([
    fetchProfileByHash(hash),
    fetchRecentDrinksByHash(hash, battleStartISO)
  ]);

  const normalizedProfile = normalizeProfile(hash, profile);
  setText('singleName', normalizedProfile.display_name);

  const history = buildDrinkHistory(recentLogs).filter(entry => !battleStartISO || entry.timestamp >= new Date(battleStartISO).getTime());
  if (!history || history.length === 0) {
    setText('singleStatus', 'Ingen dryckdata.');
    setText('singlePromille', '0.00 promille');
    hide('singleLoading');
    show('singleContent');
    return;
  }

  const series = buildGraphSeries(history, normalizedProfile);
  if (!series) {
    setText('singleStatus', 'Ingen dryckdata.');
    hide('singleLoading');
    show('singleContent');
    return;
  }

  hide('singleLoading');
  show('singleContent');
  renderStats('single', normalizedProfile, history, series);
  setText('singleStatus', '');
}

async function renderDuosBattle(hash1, hash2) {
  hide('duosContent');
  show('duosLoading');

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  setText('duosStatus', '');
  hide('duosLoading');
  show('duosContent');
}

async function renderProfilePanel(prefix, hash, battleStartISO = null) {
  if (!hash || !sb) {
    setText(`${prefix}Status`, 'Saknar hash.');
    setText(`${prefix}Promille`, '0.00 promille');
    return;
  }

  const [profile, recentLogs] = await Promise.all([
    fetchProfileByHash(hash),
    fetchRecentDrinksByHash(hash, battleStartISO)
  ]);

  const normalized = normalizeProfile(hash, profile);
  setText(`${prefix}Name`, normalized.display_name);
  setText(`${prefix}Hash`, hash);

  const history = buildDrinkHistory(recentLogs).filter(entry => !battleStartISO || entry.timestamp >= new Date(battleStartISO).getTime());
  if (history.length > 0) {
    const series = buildGraphSeries(history, normalized);
    if (series) {
      renderStats(prefix, normalized, history, series);
    }
  } else {
    setText(`${prefix}Promille`, '0.00 promille');
    setText(`${prefix}Status`, 'Ingen dryckdata.');
  }
}

async function renderDuosBattle(teammateHash, opponentHash1, opponentHash2, battleStartISO = null) {
  hide('duosContent');
  show('duosLoading');

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  if (!sb || !teammateHash || !opponentHash1 || !opponentHash2) {
    setText('duosStatus', 'Saknar hash.');
    hide('duosLoading');
    return;
  }

  hide('duosLoading');
  show('duosContent');
  await Promise.all([
    renderProfilePanel('teammate', teammateHash, battleStartISO),
    renderProfilePanel('opponent1', opponentHash1, battleStartISO),
    renderProfilePanel('opponent2', opponentHash2, battleStartISO)
  ]);

  setText('duosStatus', '');
}
