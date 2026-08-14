function openWrapped(type) {
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  const profile = getActiveProfile();
  if (!profile || !profile.id) {
    alert(lang === 'zh' ? '缺少活动个人资料。' : (lang === 'en' ? 'Missing active profile.' : 'Saknar aktiv profil.'));
    return;
  }

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  if (currentDay < 24) {
    alert(lang === 'zh' ? '总结尚未发布！将于24日发布。' : (lang === 'en' ? 'Wrapped is not available yet! It is released on the 24th.' : 'Wrapped är inte tillgängligt ännu! Det släpps den 24:e.'));
    return;
  }
  if (type === 'yearly' && currentMonth !== 11) {
    alert(lang === 'zh' ? '年度总结将于12月24日发布！' : (lang === 'en' ? 'Yearly Wrapped is released on December 24th!' : 'Årets Wrapped släpps den 24:e December!'));
    return;
  }
  loadWrapped(profile.id, type);
}

async function loadWrapped(playerHash, type) {
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  if (!sb) {
    alert(lang === 'zh' ? '无法加载数据库。' : (lang === 'en' ? 'Database could not be loaded.' : 'Databasen kunde inte laddas.'));
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
    alert(lang === 'zh' ? '无法读取总结数据。' : (lang === 'en' ? 'Could not load wrapped data.' : 'Kunde inte läsa wrapped-data.'));
    return;
  }

  const history = (logs || []).map(item => ({
    name: item.drink_name || (lang === 'zh' ? '未知饮品' : (lang === 'en' ? 'Unknown drink' : 'Okänd dryck')),
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

  var yearlyTitle = lang === 'zh' ? '年度总结 🥂' : (lang === 'en' ? 'Yearly Wrapped 🥂' : 'Årets Wrapped 🥂');
  var monthlyTitle = lang === 'zh' ? '月度总结 🔥' : (lang === 'en' ? 'Monthly Wrapped 🔥' : 'Månadens Wrapped 🔥');
  var totalVolSuffix = lang === 'zh' ? 'cl 总饮用量' : (lang === 'en' ? 'cl total drink volume' : 'cl totalt dryckesvolym');
  var pureAlcSuffix = lang === 'zh' ? 'cl 纯酒精' : (lang === 'en' ? 'cl pure alcohol' : 'cl ren alkohol');

  document.getElementById('wrappedTitle').innerText = type === 'yearly' ? yearlyTitle : monthlyTitle;
  document.getElementById('wrappedGrams').innerText = `${totalCl.toFixed(1)} ${totalVolSuffix}`;
  document.getElementById('wrappedElo').innerText = `${alcoholCl.toFixed(1)} ${pureAlcSuffix}`;
  document.getElementById('wrappedBeer').innerText = beerCount;
  document.getElementById('wrappedWine').innerText = wineCount;
  document.getElementById('wrappedSprit').innerText = spritCount;
  document.getElementById('wrappedModal').style.display = 'block';
}
function closeWrapped() {
  document.getElementById('wrappedModal').style.display = 'none';
}