// Data structure for listed drinks
const listedDrinks = {
  beer_cider_33: [
    { name: 'Carlsberg Hof', type: 'Lager', abv: 4.2, vol: 330 },
    { name: 'Heineken', type: 'Lager', abv: 5.0, vol: 330 },
    { name: 'Briska', type: 'Cider', abv: 4.5, vol: 330 },
    { name: 'Somersby', type: 'Cider', abv: 4.6, vol: 330 },
    { name: 'Xider', type: 'Cider', abv: 4.5, vol: 330 },
    { name: 'Kopparberg', type: 'Cider', abv: 4.5, vol: 330 },
    { name: 'Ey Bro', type: 'Hard seltzer', abv: 4.5, vol: 330 }
  ],
  beer_cider_50: [
    { name: 'Norrlands Guld', type: 'Lager', abv: 5.3, vol: 500 },
    { name: 'Pripps Blå', type: 'Lager', abv: 5.0, vol: 500 },
    { name: 'Falcon', type: 'Lager', abv: 5.2, vol: 500 },
    { name: 'Mariestads', type: 'Strong lager', abv: 5.3, vol: 500 },
  ],
  wine: [
    { name: 'Ett Glas Vin', type: 'Rött/Vitt/Rosé', abv: 12.5, vol: 150 },
  ],
  drinkar: [
    { name: 'Gin & Tonic', type: 'Drink (4cl sprit)', abv: 8.0, vol: 200 },
    { name: 'Vodka Cranberry', type: 'Drink (4cl sprit)', abv: 8.0, vol: 200 },
    { name: 'Red Bull Vodka', type: 'Drink (4cl sprit)', abv: 6.4, vol: 250 }
  ],
  sprit: [
    { name: 'Vodka (shot)', type: 'Spirit', abv: 40, vol: 40 },
    { name: 'Tequila (shot)', type: 'Spirit', abv: 38, vol: 40 },
    { name: 'Gin (shot)', type: 'Spirit', abv: 38.8, vol: 40 },
    { name: 'Whisky', type: 'Spirit', abv: 41.5, vol: 40 },
    { name: 'Rum', type: 'Spirit', abv: 38.8, vol: 40 },
    { name: 'Jägermeister', type: 'Liqueur', abv: 35, vol: 40 },
    { name: 'Bacardi (rum)', type: 'Spirit', abv: 38.8, vol: 40 },
  ]
};

// Functions for managing the modal content
function renderCategoryTiles(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear previous content

  const categories = [
    { id: 'beer_cider_33', text: 'Öl/cider 33 cl', icon: 'beer-33.svg' },
    { id: 'beer_cider_50', text: 'Öl/cider 50 cl', icon: 'beer-50.svg' },
    { id: 'wine', text: 'Vin', icon: 'wine.svg' },
    { id: 'drinkar', text: 'Drinkar', icon: 'drink.svg' },
    { id: 'sprit', text: 'Sprit', icon: 'sprit.svg' }
  ];

  categories.forEach(category => {
    const tile = document.createElement('div');
    tile.className = 'logger-tile';
    tile.onclick = () => renderDrinkList(containerId, category.id);

    const img = document.createElement('img');
    // Använd en fallback om ikonen saknas så appen inte ser trasig ut
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
  if (!drinks) {
    const noDrinksText = document.createElement('p');
    noDrinksText.innerText = "Inga fördefinierade drycker hittades för denna kategori.";
    container.appendChild(noDrinksText);
    return;
  }

  const drinkList = document.createElement('ul');
  drinkList.className = 'logger-list';

  drinks.forEach(drink => {
    const li = document.createElement('li');
    li.className = 'logger-list-item';
    li.onclick = () => selectDrinkAndAdd(drink);

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

function selectDrinkAndAdd(drink) {
  const grams = parseFloat((drink.vol * (drink.abv / 100) * 0.789).toFixed(1));
  saveEntry(drink.name, drink.vol, drink.abv, grams);
  closeDrinkModal();
}

function closeDrinkModal() {
  document.getElementById('drinkModal').style.display = 'none';
}