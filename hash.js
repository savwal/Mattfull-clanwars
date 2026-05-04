function generateUniqueHash() {
  // 4 tecken, alla symboler från ett svenskt tangentbord
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#¤%&/()=?@£$€{[]}\\*^~¨'_;:.,-<>|";
  let globalData = JSON.parse(localStorage.getItem('måttfull_global')) || { persons: {}, clans: {} };
  let hash = '';
  let exists = true;
  
  while (exists) {
    hash = '';
    for (let i = 0; i < 4; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = globalData.persons[hash] || globalData.clans[hash];
  }
  return hash;
}