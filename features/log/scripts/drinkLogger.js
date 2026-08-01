const listedDrinks = {
  beer_cider_33: [
    { name: 'Norrlands Guld', type: 'Lager', abv: 5.3, vol: 330 },
    { name: 'Pripps Blå', type: 'Lager', abv: 5.0, vol: 330 },
    { name: 'Brooklyn Lager', type: 'Lager', abv: 5.2, vol: 330 },
    { name: 'Ey Bro', type: 'Hard seltzer', abv: 4.5, vol: 330 },
    { name: 'Briska', type: 'Cider', abv: 4.5, vol: 330 },
    { name: 'Somersby', type: 'Cider', abv: 4.6, vol: 330 },
    { name: 'Melleruds', type: 'Lager', abv: 6.0, vol: 330 },
    { name: 'Kopparberg', type: 'Cider', abv: 4.5, vol: 330 },
    { name: 'Falcon', type: 'Lager', abv: 5.2, vol: 330 },
    { name: 'Mariestads', type: 'Strong lager', abv: 5.3, vol: 330 },
    { name: 'Carlsberg Hof', type: 'Lager', abv: 4.2, vol: 330 },
    { name: 'Heineken', type: 'Lager', abv: 5.0, vol: 330 },
    { name: 'The Bear', type: 'Lager', abv: 5.0, vol: 330 }
  ],
  beer_cider_40: [
    { name: 'Gränges', type: 'Lager', abv: 5.3, vol: 400 },
    { name: 'Norrlands Guld', type: 'Lager', abv: 5.3, vol: 400 },
    { name: 'Pripps Blå', type: 'Lager', abv: 5.0, vol: 400 },
    { name: 'Guinness', type: 'Stout', abv: 4.2, vol: 400 },
    { name: 'Mariestads', type: 'Strong lager', abv: 5.3, vol: 400 },
    { name: 'Sofiero', type: 'Lager', abv: 5.2, vol: 400 },
    { name: 'Falcon', type: 'Lager', abv: 5.2, vol: 400 }
  ],
  beer_cider_50: [
    { name: 'Norrlands Guld', type: 'Lager', abv: 5.3, vol: 500 },
    { name: 'Pripps Blå', type: 'Lager', abv: 5.0, vol: 500 },
    { name: 'Falcon', type: 'Lager', abv: 5.2, vol: 500 },
    { name: 'Mariestads', type: 'Lager', abv: 5.3, vol: 500 },
    { name: '1664 Blanc', type: 'Lager', abv: 5.0, vol: 500 },
    { name: 'Heineken', type: 'Lager', abv: 5.0, vol: 500 },
    { name: 'Guinness', type: 'Stout', abv: 4.2, vol: 500 },
    { name: 'Briska', type: 'Cider', abv: 4.5, vol: 500 },
    { name: 'Somersby', type: 'Cider', abv: 4.6, vol: 500 },
    { name: 'Ey Bro', type: 'Lager', abv: 4.5, vol: 500 },
    { name: 'Staropramen', type: 'Lager', abv: 5.0, vol: 500 },
    { name: 'Pilsner Urquell', type: 'Lager', abv: 4.4, vol: 500 },
    { name: 'Paulaner', type: 'Lager', abv: 5.0, vol: 500 }
  ],
  wine: [
    { name: 'Ett glas vittvin', type: 'Vitt', abv: 12.0, vol: 150 },
    { name: 'Ett glas rosé', type: 'Rosé', abv: 12.0, vol: 150 },
    { name: 'Ett glas rött', type: 'Rött', abv: 12.0, vol: 150 }
  ],
  sprit: [
    { name: 'Snaps', type: 'Spirit', abv: 38, vol: 40 },
    { name: 'Vodka (shot)', type: 'Spirit', abv: 40, vol: 40 },
    { name: 'Tequila (shot)', type: 'Spirit', abv: 38, vol: 40 },
    { name: 'Gin (shot)', type: 'Spirit', abv: 38.8, vol: 40 },
    { name: 'Whisky', type: 'Spirit', abv: 41.5, vol: 40 },
    { name: 'Rom', type: 'Spirit', abv: 38.8, vol: 40 },
    { name: 'Jägermeister', type: 'Liqueur', abv: 35, vol: 40 },
    { name: 'Bacardi (rum)', type: 'Spirit', abv: 38.8, vol: 40 },
  ],
  annat: [
    { name: 'En Näve Kir', type: 'Aperitif', abv: 12, vol: 700 },
    { name: 'Solbacka Kir', type: 'Aperitif', abv: 12, vol: 120 },
    { name: 'Champagne', type: 'Sparkling wine', abv: 12, vol: 150 },
    { name: 'Cava', type: 'Sparkling wine', abv: 11.5, vol: 150 },
    { name: 'Gin & Tonic', type: 'Drink (4cl sprit)', abv: 8.0, vol: 200 },
    { name: 'Vodka Cranberry', type: 'Drink (4cl sprit)', abv: 8.0, vol: 200 },
    { name: 'Red Bull Vodka', type: 'Drink (4cl sprit)', abv: 6.4, vol: 250 },
    { name: 'Aperol Spritz', type: 'Drink (4cl sprit)', abv: 6.4, vol: 250 },
  ]
};

function renderCategoryTiles(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const categories = [
    { id: 'beer_cider_33', text: 'Öl/cider 33 cl', icon: 'beer-33.svg' },
    { id: 'beer_cider_50', text: 'Öl/cider 50 cl', icon: 'beer-50.svg' },
    { id: 'beer_cider_40', text: 'Storstark 40 cl', icon: 'beer-50.svg' },
    { id: 'wine', text: 'Vin', icon: 'wine.svg' },
    { id: 'sprit', text: 'Sprit', icon: 'sprit.svg' },
    { id: 'annat', text: 'Annat', icon: 'other.svg' }
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
  const backBtn = document.createElement('button');
  backBtn.innerText = '< Gå tillbaka';
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
    if (drink.name === 'Tequila (shot)') {
      li.onclick = () => showTequilaConfirmation(drink);
    } else {
      li.onclick = () => selectDrinkAndAdd(drink);
    }
    const drinkTitle = document.createElement('div');
    drinkTitle.innerHTML = `<strong>${drink.name}</strong><br><span class="logger-drink-info">${drink.type}</span>`;
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
      ">Tequila shot!</h3>
      <p style="
        font-size:1.3rem;
        font-weight:900;
        color:#E74C3C;
        margin:0 0 24px 0;
        letter-spacing:0.5px;
      ">Är du säker?!?</p>
      <div style="display:flex;gap:12px;">
        <button id="tequilaConfirmYes" style="
          flex:1;
          padding:14px;
          background:#E74C3C;
          color:#fff;
          border:4px solid #2C3E50;
          box-shadow:4px 4px 0px #2C3E50;
          font-size:16px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          font-family:inherit;
        ">Ja, självklart!</button>
        <button id="tequilaConfirmNo" style="
          flex:1;
          padding:14px;
          background:#FFCC00;
          color:#2C3E50;
          border:4px solid #2C3E50;
          box-shadow:4px 4px 0px #2C3E50;
          font-size:16px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          font-family:inherit;
        ">Nej, ångrar mig</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showTequilaConfirmation(drink) {
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
