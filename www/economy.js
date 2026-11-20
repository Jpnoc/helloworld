// Void Crystals (soft currency), boosters, and the daily reward. Saved on the device.
const Economy = (() => {
  const E = CONFIG.ECONOMY;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const yesterday = () => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  let s = null;
  try { s = JSON.parse(localStorage.getItem('vs_economy') || 'null'); } catch (e) {}
  if (!s) s = { crystals: E.startCrystals, boosters: Object.assign({}, E.startBoosters), lastDaily: '', streak: 0, adDay: '', adCount: 0 };
  const listeners = [];
  function save() { try { localStorage.setItem('vs_economy', JSON.stringify(s)); } catch (e) {} listeners.forEach(f => f()); }

  return {
    get crystals() { return s.crystals; },
    boosters: name => s.boosters[name] || 0,
    onChange(f) { listeners.push(f); },
    add(n) { s.crystals += n; save(); },
    spend(n) { if (s.crystals < n) return false; s.crystals -= n; save(); return true; },
    useBooster(name) { if (!s.boosters[name]) return false; s.boosters[name]--; save(); return true; },
    buyBooster(name) { const p = E.prices[name]; if (s.crystals < p) return false; s.crystals -= p; s.boosters[name] = (s.boosters[name] || 0) + 1; save(); return true; },
    winReward(stars, firstClear) { const n = E.winBase + E.winPerStar * stars + (firstClear ? E.firstClearBonus : 0); s.crystals += n; save(); return n; },
    dailyAvailable: () => s.lastDaily !== today(),
    claimDaily() {
      if (s.lastDaily === today()) return 0;
      s.streak = s.lastDaily === yesterday() ? Math.min(7, s.streak + 1) : 1;
      s.lastDaily = today();
      const n = E.dailyBase + E.dailyStep * (s.streak - 1);
      s.crystals += n; save(); return n;
    },
    get streak() { return s.streak; },
    adCrystalsLeft() { return s.adDay === today() ? Math.max(0, E.adCrystalsPerDay - s.adCount) : E.adCrystalsPerDay; },
    grantAdCrystals() { if (s.adDay !== today()) { s.adDay = today(); s.adCount = 0; } s.adCount++; s.crystals += E.adCrystals; save(); return E.adCrystals; },
  };
})();
