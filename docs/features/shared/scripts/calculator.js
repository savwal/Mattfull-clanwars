function getAbsorptionTime(abv) {
  if (abv <= 3.5) return 1.5;
  if (abv <= 6.0) return 1.0;
  if (abv <= 15.0) return 0.75;
  return 0.5;
}

function calculateBACAtTime(history, profile, targetTime) {
  if (!profile.weight || profile.weight <= 0 || history.length === 0) return 0.00;
  
  const r = profile.gender === 'kvinna' ? 0.55 : 0.68;
  const elimGramsPerMinute = (0.1 * profile.weight) / 60;
  let currentGrams = 0;
  
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
      currentGrams += absorbedGrams;
    }
    
    for (let i = 0; i < history.length; i++) {
      const drink = history[i];
      if (drink.grams < 0) {
        const drinkTime = new Date(drink.timestamp).getTime();
        if (Math.abs(currentTime - drinkTime) < 30000) {
          currentGrams += drink.grams;
        }
      }
    }

    if (currentGrams > 0) {
      currentGrams -= elimGramsPerMinute;
      if (currentGrams < 0) currentGrams = 0;
    }
  }
  
  const bac = currentGrams / (profile.weight * r);
  return bac > 0 ? bac : 0;
}