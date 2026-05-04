function getAbsorptionTime(abv) {
  if (abv <= 3.5) return 1.5;
  if (abv <= 6.0) return 1.0;
  if (abv <= 15.0) return 0.75;
  return 0.5;
}

function calculateBACAtTime(history, profile, targetTime) {
  if (!profile.weight || profile.weight <= 0 || history.length === 0) return 0.00;
  const r = profile.gender === 'kvinna' ? 0.55 : 0.68;
  const betaPerMinute = 0.015 / 60;
  let bac = 0;
  
  const firstTime = new Date(history[0].timestamp).getTime();
  const totalMinutes = Math.floor((targetTime - firstTime) / 60000);
  if (totalMinutes < 0) return 0;

  for (let m = 0; m <= totalMinutes; m++) {
    const currentTime = firstTime + m * 60000;
    let absorbedGrams = 0;
    
    for (let i = 0; i < history.length; i++) {
      const drink = history[i];
      if (drink.grams < 0) continue; 
      const drinkTime = new Date(drink.timestamp).getTime();
      if (currentTime >= drinkTime) {
        const absTimeMs = getAbsorptionTime(drink.abv) * 3600000;
        const timeSince = currentTime - drinkTime;
        if (timeSince <= absTimeMs) {
          absorbedGrams += (drink.grams / (absTimeMs / 60000));
        }
      }
    }

    if (absorbedGrams > 0) {
      bac += absorbedGrams / (profile.weight * r);
    }
    
    for (let i = 0; i < history.length; i++) {
      const drink = history[i];
      if (drink.grams < 0) {
        const drinkTime = new Date(drink.timestamp).getTime();
        if (Math.abs(currentTime - drinkTime) < 30000) {
          bac += (drink.grams / (profile.weight * r));
        }
      }
    }

    if (bac > 0) {
      bac -= betaPerMinute;
      if (bac < 0) bac = 0;
    }
  }
  return bac;
}