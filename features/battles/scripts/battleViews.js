const BATTLE_GRAPH_STEP_MINUTES = 30;

function buildDrinkHistory(drinkLogs) {
  return (drinkLogs || []).map(d => {
    const grams = Number.isFinite(d.grams_alcohol)
      ? d.grams_alcohol
      : parseFloat((d.volume_ml * (d.abv / 100) * 0.789).toFixed(1));
    return {
      name: d.drink_name,
      volume: d.volume_ml,
      abv: d.abv,
      grams,
      timestamp: new Date(d.consumed_at).getTime()
    };
  });
}

async function fetchProfileByHash(hash) {
  if (!sb || !hash) return null;
  const { data } = await sb.from('profiles')
    .select('player_hash, display_name, avatar_url, weight, gender, funzone_limit')
    .eq('player_hash', hash)
    .maybeSingle();
  return data || null;
}

async function fetchLatestDrinkByHash(hash) {
  if (!sb || !hash) return [];
  const { data } = await sb.from('drink_logs')
    .select('drink_name, volume_ml, abv, grams_alcohol, consumed_at')
    .eq('player_hash', hash)
    .order('consumed_at', { ascending: false })
    .limit(1);
  return data || [];
}

function buildGraphSeries(history, profile) {
  if (!history || history.length === 0) return null;
  const startTime = new Date(history[0].timestamp);
  const endTime = new Date();
  const labels = [];
  const dataPoints = [];
  let currentTime = new Date(startTime);
  while (currentTime <= endTime) {
    const bac = calculateBACAtTime(history, profile, currentTime.getTime());
    labels.push(currentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }));
    dataPoints.push(bac);
    currentTime = new Date(currentTime.getTime() + BATTLE_GRAPH_STEP_MINUTES * 60000);
  }
  return { labels, dataPoints };
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
  return {
    player_hash: hash,
    display_name: displayName,
    weight: profile && profile.weight ? profile.weight : 75,
    gender: profile && profile.gender ? profile.gender : 'man',
    funzone_limit: profile && profile.funzone_limit ? profile.funzone_limit : 1.0
  };
}

function renderStats(prefix, profile, history, series) {
  const totalGrams = history.reduce((sum, d) => sum + d.grams, 0);
  const maxBac = Math.max(...series.dataPoints);
  const currentBac = calculateBACAtTime(history, profile, Date.now());
  const lastDrink = history[history.length - 1];
  const zones = {
    legalMax: 0.2,
    redMax: profile.funzone_limit || 1.0,
    greenMax: 3.0
  };

  setText(`${prefix}Promille`, `${currentBac.toFixed(2)} promille`);
  setHtml(`${prefix}Stats`, `
    <p style="margin:3px 0;"><strong>Vikt:</strong> ${profile.weight} kg</p>
    <p style="margin:3px 0;"><strong>Kon:</strong> ${profile.gender === 'kvinna' ? 'Kvinna' : 'Man'}</p>
    <p style="margin:3px 0;"><strong>Funzone:</strong> ${zones.redMax.toFixed(1)} promille</p>
    <p style="margin:3px 0;"><strong>Total:</strong> ${totalGrams.toFixed(1)} g (${calculateCl(totalGrams).toFixed(1)} cl)</p>
    <p style="margin:3px 0;"><strong>Max promille:</strong> ${maxBac.toFixed(2)} promille</p>
    <p style="margin:3px 0;"><strong>Nuvarande promille:</strong> ${currentBac.toFixed(2)} promille</p>
    <p style="margin:3px 0;"><strong>Senaste dryck:</strong> ${lastDrink.name} (${lastDrink.volume} ml, ${lastDrink.abv}% abv)</p>
  `);

  renderChart(`${prefix}Canvas`, series.labels, series.dataPoints, zones);
}

async function renderSingleBattle(hash) {
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

  const [profile, latestLog] = await Promise.all([
    fetchProfileByHash(hash),
    fetchLatestDrinkByHash(hash)
  ]);

  const normalizedProfile = normalizeProfile(hash, profile);
  setText('singleName', normalizedProfile.display_name);

  const history = buildDrinkHistory(latestLog);
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

  renderStats('single', normalizedProfile, history, series);
  setText('singleStatus', '');
  hide('singleLoading');
  show('singleContent');
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

async function renderProfilePanel(prefix, hash) {
  if (!hash || !sb) {
    setText(`${prefix}Status`, 'Saknar hash.');
    setText(`${prefix}Promille`, '0.00 promille');
    return;
  }

  const [profile, latestLog] = await Promise.all([
    fetchProfileByHash(hash),
    fetchLatestDrinkByHash(hash)
  ]);

  const normalized = normalizeProfile(hash, profile);
  setText(`${prefix}Name`, normalized.display_name);
  setText(`${prefix}Hash`, hash);

  const history = buildDrinkHistory(latestLog);
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

async function renderDuosBattle(teammateHash, opponentHash1, opponentHash2) {
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

  await Promise.all([
    renderProfilePanel('teammate', teammateHash),
    renderProfilePanel('opponent1', opponentHash1),
    renderProfilePanel('opponent2', opponentHash2)
  ]);

  setText('duosStatus', '');
  hide('duosLoading');
  show('duosContent');
}
