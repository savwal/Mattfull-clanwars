const listedDrinks = {
  beer_cider_33: [
    { name: 'Norrlands Guld', name_zh: '诺兰德金牌', type: 'Lager', type_zh: '淡色啤酒', abv: 5.3, vol: 330 },
    { name: 'Pripps Blå', name_zh: '普里普斯蓝', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 330 },
    { name: 'Brooklyn Lager', name_zh: '布鲁克林拉格', type: 'Lager', type_zh: '淡色啤酒', abv: 5.2, vol: 330 },
    { name: 'Ey Bro', name_zh: 'Ey Bro', type: 'Hard seltzer', type_zh: '硬苏打水', abv: 4.5, vol: 330 },
    { name: 'Briska', name_zh: '布里斯卡', type: 'Cider', type_zh: '苹果酒', abv: 4.5, vol: 330 },
    { name: 'Somersby', name_zh: '萨默斯比', type: 'Cider', type_zh: '苹果酒', abv: 4.6, vol: 330 },
    { name: 'Melleruds', name_zh: '梅勒鲁兹', type: 'Lager', type_zh: '淡色啤酒', abv: 6.0, vol: 330 },
    { name: 'Kopparberg', name_zh: '科帕伯格', type: 'Cider', type_zh: '苹果酒', abv: 4.5, vol: 330 },
    { name: 'Falcon', name_zh: '猎鹰', type: 'Lager', type_zh: '淡色啤酒', abv: 5.2, vol: 330 },
    { name: 'Mariestads', name_zh: '玛丽斯塔德', type: 'Strong lager', type_zh: '烈性啤酒', abv: 5.3, vol: 330 },
    { name: 'Carlsberg Hof', name_zh: '嘉士伯', type: 'Lager', type_zh: '淡色啤酒', abv: 4.2, vol: 330 },
    { name: 'Heineken', name_zh: '喜力', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 330 },
    { name: 'The Bear', name_zh: '熊牌', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 330 }
  ],
  beer_cider_40: [
    { name: 'Gränges', name_zh: '格兰格斯', type: 'Lager', type_zh: '淡色啤酒', abv: 5.3, vol: 400 },
    { name: 'Norrlands Guld', name_zh: '诺兰德金牌', type: 'Lager', type_zh: '淡色啤酒', abv: 5.3, vol: 400 },
    { name: 'Pripps Blå', name_zh: '普里普斯蓝', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 400 },
    { name: 'Guinness', name_zh: '健力士', type: 'Stout', type_zh: '黑啤酒', abv: 4.2, vol: 400 },
    { name: 'Mariestads', name_zh: '玛丽斯塔德', type: 'Strong lager', type_zh: '烈性啤酒', abv: 5.3, vol: 400 },
    { name: 'Sofiero', name_zh: '索菲艾洛', type: 'Lager', type_zh: '淡色啤酒', abv: 5.2, vol: 400 },
    { name: 'Falcon', name_zh: '猎鹰', type: 'Lager', type_zh: '淡色啤酒', abv: 5.2, vol: 400 }
  ],
  beer_cider_50: [
    { name: 'Norrlands Guld', name_zh: '诺兰德金牌', type: 'Lager', type_zh: '淡色啤酒', abv: 5.3, vol: 500 },
    { name: 'Pripps Blå', name_zh: '普里普斯蓝', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 500 },
    { name: 'Falcon', name_zh: '猎鹰', type: 'Lager', type_zh: '淡色啤酒', abv: 5.2, vol: 500 },
    { name: 'Mariestads', name_zh: '玛丽斯塔德', type: 'Lager', type_zh: '淡色啤酒', abv: 5.3, vol: 500 },
    { name: '1664 Blanc', name_zh: '1664 白啤', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 500 },
    { name: 'Heineken', name_zh: '喜力', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 500 },
    { name: 'Guinness', name_zh: '健力士', type: 'Stout', type_zh: '黑啤酒', abv: 4.2, vol: 500 },
    { name: 'Briska', name_zh: '布里斯卡', type: 'Cider', type_zh: '苹果酒', abv: 4.5, vol: 500 },
    { name: 'Somersby', name_zh: '萨默斯比', type: 'Cider', type_zh: '苹果酒', abv: 4.6, vol: 500 },
    { name: 'Ey Bro', name_zh: 'Ey Bro', type: 'Lager', type_zh: '淡色啤酒', abv: 4.5, vol: 500 },
    { name: 'Staropramen', name_zh: '捷克老城', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 500 },
    { name: 'Pilsner Urquell', name_zh: '皮尔森欧颇', type: 'Lager', type_zh: '淡色啤酒', abv: 4.4, vol: 500 },
    { name: 'Paulaner', name_zh: '柏龙', type: 'Lager', type_zh: '淡色啤酒', abv: 5.0, vol: 500 }
  ],
  wine: [
    { name: 'Ett glas vittvin', name_zh: '一杯白葡萄酒', type: 'Vitt', type_zh: '白葡萄酒', abv: 12.0, vol: 150 },
    { name: 'Ett glas rosé', name_zh: '一杯玫瑰红酒', type: 'Rosé', type_zh: '玫瑰红酒', abv: 12.0, vol: 150 },
    { name: 'Ett glas rött', name_zh: '一杯红葡萄酒', type: 'Rött', type_zh: '红葡萄酒', abv: 12.0, vol: 150 }
  ],
  sprit: [
    { name: 'Snaps', name_zh: '瑞典烈酒', type: 'Spirit', type_zh: '烈酒', abv: 38, vol: 40 },
    { name: 'Vodka (shot)', name_zh: '伏特加 (一杯)', type: 'Spirit', type_zh: '烈酒', abv: 40, vol: 40 },
    { name: 'Tequila (shot)', name_zh: '龙舌兰 (一杯)', type: 'Spirit', type_zh: '烈酒', abv: 38, vol: 40 },
    { name: 'Gin (shot)', name_zh: '金酒 (一杯)', type: 'Spirit', type_zh: '烈酒', abv: 38.8, vol: 40 },
    { name: 'Whisky', name_zh: '威士忌', type: 'Spirit', type_zh: '烈酒', abv: 41.5, vol: 40 },
    { name: 'Rom', name_zh: '朗姆酒', type: 'Spirit', type_zh: '烈酒', abv: 38.8, vol: 40 },
    { name: 'Jägermeister', name_zh: '野格', type: 'Liqueur', type_zh: '利口酒', abv: 35, vol: 40 },
    { name: 'Bacardi (rum)', name_zh: '百加得 (朗姆酒)', type: 'Spirit', type_zh: '烈酒', abv: 38.8, vol: 40 },
  ],
  annat: [
    { name: 'En Näve Kir', name_zh: '一把基尔', type: 'Aperitif', type_zh: '开胃酒', abv: 12, vol: 700 },
    { name: 'Solbacka Kir', name_zh: '索尔巴卡基尔', type: 'Aperitif', type_zh: '开胃酒', abv: 12, vol: 120 },
    { name: 'Champagne', name_zh: '香槟', type: 'Sparkling wine', type_zh: '起泡酒', abv: 12, vol: 150 },
    { name: 'Cava', name_zh: '卡瓦', type: 'Sparkling wine', type_zh: '起泡酒', abv: 11.5, vol: 150 },
    { name: 'Gin & Tonic', name_zh: '金汤力', type: 'Drink (4cl sprit)', type_zh: '鸡尾酒 (4cl烈酒)', abv: 8.0, vol: 200 },
    { name: 'Vodka Cranberry', name_zh: '伏特加蔓越莓', type: 'Drink (4cl sprit)', type_zh: '鸡尾酒 (4cl烈酒)', abv: 8.0, vol: 200 },
    { name: 'Red Bull Vodka', name_zh: '红牛伏特加', type: 'Drink (4cl sprit)', type_zh: '鸡尾酒 (4cl烈酒)', abv: 6.4, vol: 250 },
    { name: 'Aperol Spritz', name_zh: '阿贝罗喷趣', type: 'Drink (4cl sprit)', type_zh: '鸡尾酒 (4cl烈酒)', abv: 6.4, vol: 250 },
  ]
};

function renderCategoryTiles(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  const categories = [
    { id: 'beer_cider_33', text: lang === 'zh' ? '啤酒/苹果酒 33cl' : (lang === 'en' ? 'Beer/Cider 33cl' : 'Öl/cider 33 cl'), icon: 'beer-33.svg' },
    { id: 'beer_cider_50', text: lang === 'zh' ? '啤酒/苹果酒 50cl' : (lang === 'en' ? 'Beer/Cider 50cl' : 'Öl/cider 50 cl'), icon: 'beer-50.svg' },
    { id: 'beer_cider_40', text: lang === 'zh' ? '大杯啤酒 40cl' : (lang === 'en' ? 'Large beer 40cl' : 'Storstark 40 cl'), icon: 'beer-50.svg' },
    { id: 'wine', text: lang === 'zh' ? '葡萄酒' : (lang === 'en' ? 'Wine' : 'Vin'), icon: 'wine.svg' },
    { id: 'sprit', text: lang === 'zh' ? '烈酒' : (lang === 'en' ? 'Spirits' : 'Sprit'), icon: 'sprit.svg' },
    { id: 'annat', text: lang === 'zh' ? '其他' : (lang === 'en' ? 'Other' : 'Annat'), icon: 'other.svg' }
  ];

  categories.forEach(category => {
    const tile = document.createElement('div');
    tile.className = 'logger-tile';
    tile.onclick = () => renderDrinkList(containerId, category.id);
    const img = document.createElement('img');
    img.src = `icons/${category.icon}`;
    img.onerror = () => { img.style.display = 'none'; };
    img.alt = category.text;
    img.className = 'logger-icon';
    const textSpan = document.createElement('span');
    textSpan.innerText = category.text;
    textSpan.className = 'logger-text';
    tile.appendChild(img);
    tile.appendChild(textSpan);
    container.appendChild(tile);
  });
}

function renderDrinkList(containerId, categoryId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  const backBtn = document.createElement('button');
  backBtn.innerText = lang === 'zh' ? '← 返回' : (lang === 'en' ? '← Go back' : '← Gå tillbaka');
  backBtn.className = 'logger-back-btn';
  backBtn.onclick = () => renderCategoryTiles(containerId);
  container.appendChild(backBtn);

  const drinks = listedDrinks[categoryId];
  if (!drinks) return;

  const drinkList = document.createElement('ul');
  drinkList.className = 'logger-list';

  drinks.forEach(drink => {
    const li = document.createElement('li');
    li.className = 'logger-list-item';
    const displayName = lang === 'zh' ? (drink.name_zh || drink.name) : drink.name;
    const displayType = lang === 'zh' ? (drink.type_zh || drink.type) : drink.type;
    if (drink.name === 'Tequila (shot)') {
      li.onclick = () => showTequilaConfirmation(drink);
    } else {
      li.onclick = () => selectDrinkAndAdd(drink);
    }
    const drinkTitle = document.createElement('div');
    drinkTitle.innerHTML = `<strong>${displayName}</strong><br><span class="logger-drink-info">${displayType}</span>`;
    const drinkStats = document.createElement('div');
    drinkStats.className = 'logger-drink-stats';
    drinkStats.innerHTML = `<span class="logger-drink-info">${drink.abv}% abv, ${drink.vol} ml</span>`;
    li.appendChild(drinkTitle);
    li.appendChild(drinkStats);
    drinkList.appendChild(li);
  });

  container.appendChild(drinkList);
}

var _selectDrinkLock = false;
function selectDrinkAndAdd(drink) {
  if (_selectDrinkLock) return;
  _selectDrinkLock = true;
  setTimeout(function () { _selectDrinkLock = false; }, 1500);
  var grams = parseFloat((drink.vol * (drink.abv / 100) * 0.789).toFixed(1));
  saveEntry(drink.name, drink.vol, drink.abv, grams);
  closeDrinkModal();
}

function closeDrinkModal() {
  document.getElementById('drinkModal').style.display = 'none';
}

// ── Tequila shot confirmation ──────────────────────────────────────────────────
function ensureTequilaModal() {
  if (document.getElementById('tequilaConfirmModal')) return;
  var lang = window.i18n ? window.i18n.getLang() : 'sv';
  const overlay = document.createElement('div');
  overlay.id = 'tequilaConfirmModal';
  overlay.style.cssText = [
    'display:none',
    'position:fixed',
    'z-index:9999',
    'left:0',
    'top:0',
    'width:100%',
    'height:100%',
    'background:rgba(0,0,0,0.7)',
    '-webkit-backdrop-filter:blur(6px)',
    'backdrop-filter:blur(6px)',
    'align-items:center',
    'justify-content:center'
  ].join(';');

  const heading = lang === 'zh' ? '龙舌兰！' : 'Tequila shot!';
  const question = lang === 'zh' ? '你确定吗？！' : (lang === 'en' ? 'Are you sure?!?' : 'Är du säker?!?');
  const yesText = lang === 'zh' ? '当然！' : (lang === 'en' ? 'Yes, obviously!' : 'Ja, självklart!');
  const noText = lang === 'zh' ? '不，算了' : (lang === 'en' ? 'No, never mind' : 'Nej, ångrar mig');

  overlay.innerHTML = `
    <div style="
      background:#fff;
      border:6px solid #2C3E50;
      box-shadow:8px 8px 0px #2C3E50;
      padding:30px 24px 24px;
      max-width:340px;
      width:90%;
      text-align:center;
      font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
    ">
      <div style="font-size:3rem;margin-bottom:12px;">🍋🥃</div>
      <h3 style="
        font-family:'Arial Black',Impact,sans-serif;
        text-transform:uppercase;
        font-size:1.5rem;
        color:#2C3E50;
        margin:0 0 10px 0;
        letter-spacing:1px;
      ">${heading}</h3>
      <p style="
        font-size:1.3rem;
        font-weight:900;
        color:#E74C3C;
        margin:0 0 24px 0;
        letter-spacing:0.5px;
      ">${question}</p>
      <div style="display:flex;gap:12px;">
        <button id="tequilaConfirmYes" style="
          flex:1;
          padding:14px;
          background:#E74C3C;
          color:#fff;
          border:1px solid rgba(44,62,80,0.15);
          border-radius:10px;
          box-shadow:0 2px 6px rgba(44,62,80,0.12);
          font-size:16px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          font-family:inherit;
          transition:all 0.15s ease;
        ">${yesText}</button>
        <button id="tequilaConfirmNo" style="
          flex:1;
          padding:14px;
          background:#FFCC00;
          color:#2C3E50;
          border:1px solid rgba(44,62,80,0.15);
          border-radius:10px;
          box-shadow:0 2px 6px rgba(44,62,80,0.12);
          font-size:16px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          font-family:inherit;
          transition:all 0.15s ease;
        ">${noText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showTequilaConfirmation(drink) {
  // Remove cached modal so it rebuilds with current lang each time
  const existing = document.getElementById('tequilaConfirmModal');
  if (existing) existing.remove();
  ensureTequilaModal();
  const modal = document.getElementById('tequilaConfirmModal');
  modal.style.display = 'flex';

  const yesBtn = document.getElementById('tequilaConfirmYes');
  const noBtn = document.getElementById('tequilaConfirmNo');

  // Clone nodes to remove any previous event listeners
  const newYes = yesBtn.cloneNode(true);
  const newNo = noBtn.cloneNode(true);
  yesBtn.replaceWith(newYes);
  noBtn.replaceWith(newNo);

  newYes.addEventListener('click', () => {
    modal.style.display = 'none';
    selectDrinkAndAdd(drink);
  });
  newNo.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}
