function generateUniqueHash(length = 5) {
  // Valfri längd, alla symboler från ett svenskt tangentbord
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#¤%&/()=?@£$€{[]}\\*^~¨'_;:.,-<>|";
  let globalData = JSON.parse(localStorage.getItem('måttfull_global')) || { persons: {}, clans: {} };
  let hash = '';
  let exists = true;
  
  while (exists) {
    hash = '';
    for (let i = 0; i < length; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = globalData.persons[hash] || globalData.clans[hash];
  }
  return hash;
}