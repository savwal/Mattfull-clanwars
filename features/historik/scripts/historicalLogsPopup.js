// Resolve the grams of alcohol for a logged drink, falling back to the
// volume/abv calculation when grams_alcohol was not stored. Values are only
// read here — never modified — so what is shown matches what was logged.
function resolveDrinkGrams(log) {
  if (window.sharedData && typeof window.sharedData.resolveDrinkGrams === 'function') {
    return window.sharedData.resolveDrinkGrams(log);
  }
  const grams = Number(log.grams_alcohol);
  if (log.grams_alcohol !== null && log.grams_alcohol !== undefined && Number.isFinite(grams) && grams !== 0) return grams;
  const volumeMl = Number(log.volume_ml) || 0;
  const abv = Number(log.abv) || 0;
  return volumeMl * (abv / 100) * 0.789;
}

function renderDrinkLogItem(log) {
  const grams = resolveDrinkGrams(log);
  const cl = Math.abs(calculateCl(grams));
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  const rawName = log.drink_name || (lang === 'zh' ? '未知饮品' : (lang === 'en' ? 'Unknown drink' : 'Okänd dryck'));
  const name = typeof translateDrinkName === 'function' ? translateDrinkName(rawName) : rawName;
  const volumeMl = Number(log.volume_ml) || 0;
  const abv = Number(log.abv) || 0;
  const consumed = log.consumed_at ? new Date(log.consumed_at) : null;
  const whenLabel = consumed ? consumed.toLocaleString(lang === 'zh' ? 'zh-CN' : (lang === 'en' ? 'en-US' : 'sv-SE')) : (lang === 'zh' ? '未知日期' : (lang === 'en' ? 'Unknown date' : 'Okänt datum'));

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
    var lang = window.i18n ? window.i18n.getLang() : 'sv';
    meta.textContent = lang === 'zh' ? '历史记录' : (lang === 'en' ? 'Historical logs' : 'Historiska loggar');
    summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">' + (lang === 'zh' ? '找不到您的个人资料。' : (lang === 'en' ? 'Could not find your profile.' : 'Kunde inte hitta din profil.')) + '</p>';
    list.innerHTML = '';
    return;
  }

  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  meta.textContent = lang === 'zh' ? '您记录的饮品' : (lang === 'en' ? 'Your registered drinks' : 'Dina registrerade drycker');
  summary.innerHTML = '';
  list.innerHTML = '<li class="loading-row"><span class="loading-spinner"></span> ' + (lang === 'zh' ? '正在加载您的记录...' : (lang === 'en' ? 'Loading your logs...' : 'Laddar dina loggar...')) + '</li>';

  if (typeof ensureSupabaseAuth === 'function') {
    await ensureSupabaseAuth();
  }

  let allDrinks = [];
  if (window.sharedData && typeof window.sharedData.getDrinkLogs === 'function') {
    allDrinks = await window.sharedData.getDrinkLogs();
  } else {
    const { data, error } = await sb.from('drink_logs')
      .select('player_hash, drink_name, volume_ml, abv, grams_alcohol, consumed_at')
      .eq('player_hash', profile.id);
    if (error) {
      summary.innerHTML = '<p style="margin:0; color:#E74C3C; font-weight:bold;">' + (lang === 'zh' ? '无法获取记录。' : (lang === 'en' ? 'Could not fetch logs.' : 'Kunde inte hämta loggarna.')) + '</p>';
      return;
    }
    allDrinks = data || [];
  }

  const logs = (allDrinks || [])
    .filter(d => d.player_hash === profile.id)
    .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime());
  if (logs.length === 0) {
    summary.innerHTML = '<p style="margin:0; color:#5a6570; font-weight:bold;">' + (lang === 'zh' ? '您还没有记录任何饮品。' : (lang === 'en' ? 'You have no registered drinks yet.' : 'Du har inga registrerade drycker än.')) + '</p>';
    return;
  }

  const totalGrams = logs.reduce((sum, log) => sum + resolveDrinkGrams(log), 0);
  const totalCl = Math.abs(calculateCl(totalGrams));

  summary.innerHTML = `
    <div style="display:grid; gap:10px; text-align:left;">
      <div style="display:flex; align-items:center; gap:8px;"><strong>${lang === 'zh' ? '饮品数量:' : (lang === 'en' ? 'Number of units:' : 'Antal enheter:')}</strong> <span style="display:inline-block; background:#FF6FB5; color:#fff; border:1px solid rgba(44,62,80,0.15); border-radius:8px; padding:4px 10px; font-weight:900; box-shadow:0 1px 4px rgba(44,62,80,0.10);">${logs.length}</span></div>
      <div style="display:flex; align-items:center; gap:8px;"><strong>${lang === 'zh' ? '纯酒精:' : (lang === 'en' ? 'Pure alcohol:' : 'Ren alkohol:')}</strong> <span style="display:inline-block; background:#2ECC71; color:#fff; border:1px solid rgba(44,62,80,0.15); border-radius:8px; padding:4px 10px; font-weight:900; box-shadow:0 1px 4px rgba(44,62,80,0.10);">${totalCl.toFixed(1)} cl</span></div>
    </div>
  `;

  list.innerHTML = logs.map(renderDrinkLogItem).join('');
}

function closeHistoricalLogsPopup() {
  const modal = document.getElementById('historicalLogsModal');
  if (modal) modal.style.display = 'none';
}
