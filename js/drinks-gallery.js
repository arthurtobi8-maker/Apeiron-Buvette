/* ── APEIRON BUVETTE — DRINKS GALLERY ─────────────────────── */
const DRINKS = {

  brands: [
    /* ── SOFTS ── */
    { id:'coca-cola',   name:'Coca-Cola',   cat:'soft',    lines:['COCA','COLA'],    p:'#E8312A', s:'#9B1B14', rim:'#CC1E1E', t:'#fff' },
    { id:'pepsi',       name:'Pepsi',       cat:'soft',    lines:['PEPSI'],          p:'#003087', s:'#001F5B', rim:'#CC1E1E', t:'#fff' },
    { id:'sprite',      name:'Sprite',      cat:'soft',    lines:['SPRITE'],         p:'#1DA462', s:'#0F6B40', rim:'#F5C400', t:'#fff' },
    { id:'fanta',       name:'Fanta',       cat:'soft',    lines:['FANTA'],          p:'#F47C20', s:'#C05A06', rim:'#E8312A', t:'#fff' },
    { id:'7up',         name:'7UP',         cat:'soft',    lines:['7UP'],            p:'#029A04', s:'#016602', rim:'#E8312A', t:'#fff' },
    { id:'schweppes',   name:'Schweppes',   cat:'soft',    lines:['SCHW','EPPES'],   p:'#F5C400', s:'#C09B00', rim:'#1a1a1a', t:'#1a1a1a' },
    { id:'malta',       name:'Malta',       cat:'soft',    lines:['MALTA'],          p:'#5C3317', s:'#3B1F0D', rim:'#D4A017', t:'#F5C400' },
    { id:'mirinda',     name:'Mirinda',     cat:'soft',    lines:['MIRIN','DA'],     p:'#E87102', s:'#A54E01', rim:'#6200EA', t:'#fff' },
    { id:'youki',       name:'Youki',       cat:'soft',    lines:['YOUKI'],          p:'#0066CC', s:'#004499', rim:'#F5C400', t:'#fff' },
    { id:'top',         name:'Top',         cat:'soft',    lines:['TOP'],            p:'#CC0000', s:'#990000', rim:'#F5C400', t:'#fff' },
    { id:'redbull',     name:'Red Bull',    cat:'soft',    lines:['RED','BULL'],     p:'#CC1E1E', s:'#004B93', rim:'#F5C400', t:'#fff' },
    { id:'monster',     name:'Monster',     cat:'soft',    lines:['MONSTR'],         p:'#1a1a1a', s:'#000',    rim:'#00D100', t:'#00d100' },
    { id:'volvic',      name:'Volvic',      cat:'soft',    lines:['VOLVIC'],         p:'#0059a6', s:'#003d7a', rim:'#29b6f6', t:'#fff' },
    { id:'evian',       name:'Evian',       cat:'soft',    lines:['EVIAN'],          p:'#29b6f6', s:'#0288d1', rim:'#fff',    t:'#fff' },
    { id:'real',        name:'Réal',        cat:'soft',    lines:['RÉAL'],           p:'#e84118', s:'#b02f10', rim:'#F5C400', t:'#fff' },
    { id:'pamplemousse',name:'Pamplemousse',cat:'soft',    lines:['PAMP','MOUSS'],   p:'#F48FB1', s:'#D81B60', rim:'#FCE4EC', t:'#fff' },
    { id:'xxl',         name:'XXL',         cat:'soft',    lines:['XXL'],            p:'#111',    s:'#000',    rim:'#F5C400', t:'#E8312A' },
    { id:'oasis',       name:'Oasis',       cat:'soft',    lines:['OASIS'],          p:'#FFA500', s:'#D84315', rim:'#03A9F4', t:'#fff' },
    { id:'orangina',    name:'Orangina',    cat:'soft',    lines:['ORAN','GINA'],    p:'#2196F3', s:'#1976D2', rim:'#FFEB3B', t:'#FFEB3B' },
    { id:'youki-pomme', name:'Youki Pomme', cat:'soft',    lines:['YOUKI','POMME'],  p:'#4CAF50', s:'#2E7D32', rim:'#F5C400', t:'#fff' },
    { id:'youki-moca',  name:'Youki Moca',  cat:'soft',    lines:['YOUKI','MOCA'],   p:'#5D4037', s:'#3E2723', rim:'#F5C400', t:'#fff' },
    { id:'youki-tonic', name:'Youki Tonic', cat:'soft',    lines:['YOUKI','TONIC'],  p:'#03A9F4', s:'#0288D1', rim:'#F5C400', t:'#fff' },
    { id:'youki-cocktail',name:'Youki Cocktail',cat:'soft',lines:['YOUKI','CTAIL'],  p:'#FF5252', s:'#D32F2F', rim:'#F5C400', t:'#fff' },
    /* ── ALCOOLS ── */
    { id:'heineken',    name:'Heineken',    cat:'alcohol', lines:['HEINE','KEN'],    p:'#008200', s:'#005500', rim:'#F5C400', t:'#fff' },
    { id:'flag',        name:'Flag',        cat:'alcohol', lines:['FLAG'],           p:'#005500', s:'#003300', rim:'#D4A017', t:'#D4A017' },
    { id:'guinness',    name:'Guinness',    cat:'alcohol', lines:['GUINN','ESS'],    p:'#1C1C1C', s:'#000',    rim:'#D4A017', t:'#D4A017' },
    { id:'castel',      name:'Castel',      cat:'alcohol', lines:['CASTEL'],         p:'#003D82', s:'#002550', rim:'#D4A017', t:'#fff' },
    { id:'33export',    name:'33 Export',   cat:'alcohol', lines:['33','EXPORT'],    p:'#D4A017', s:'#A07812', rim:'#CC1E1E', t:'#1a1a1a' },
    { id:'amstel',      name:'Amstel',      cat:'alcohol', lines:['AMSTEL'],         p:'#CC0000', s:'#990000', rim:'#F5C400', t:'#fff' },
    { id:'primus',      name:'Primus',      cat:'alcohol', lines:['PRIMUS'],         p:'#004D00', s:'#002B00', rim:'#D4A017', t:'#D4A017' },
    { id:'skol',        name:'Skol',        cat:'alcohol', lines:['SKOL'],           p:'#C8A400', s:'#8F7400', rim:'#CC1E1E', t:'#fff' },
    { id:'mutzig',      name:'Mutzig',      cat:'alcohol', lines:['MUTZIG'],         p:'#1A1A5E', s:'#0D0D3B', rim:'#D4A017', t:'#D4A017' },
    { id:'1664',        name:'1664',        cat:'alcohol', lines:['16','64'],         p:'#1A3A5C', s:'#102540', rim:'#D4A017', t:'#D4A017' },
    { id:'corona',      name:'Corona',      cat:'alcohol', lines:['CORONA'],         p:'#F7C948', s:'#C89A20', rim:'#004D00', t:'#1a1a1a' },
    { id:'desperados',  name:'Desperados',  cat:'alcohol', lines:['DESPE','RADOS'],  p:'#F5C400', s:'#C09B00', rim:'#CC1E1E', t:'#1a1a1a' },
    { id:'bock',        name:'Bock',        cat:'alcohol', lines:['BOCK'],           p:'#8B4513', s:'#5C2D0A', rim:'#D4A017', t:'#D4A017' },
    { id:'champagne',   name:'Champagne',   cat:'alcohol', lines:['CHAM','PAGNE'],   p:'#D4A017', s:'#A07812', rim:'#c5a028', t:'#fff' },
    { id:'vin-rouge',   name:'Vin Rouge',   cat:'alcohol', lines:['VIN','ROUGE'],    p:'#722F37', s:'#4A1C23', rim:'#D4A017', t:'#fff' },
    { id:'vin-blanc',   name:'Vin Blanc',   cat:'alcohol', lines:['VIN','BLANC'],    p:'#C8B46A', s:'#A08A40', rim:'#1a4d1a', t:'#1a1a1a' },
    { id:'baileys',     name:'Baileys',     cat:'alcohol', lines:['BAILE','YS'],     p:'#6B3D2E', s:'#3D1F14', rim:'#D4A017', t:'#D4A017' },
    { id:'jack',        name:"Jack D.",     cat:'alcohol', lines:['JACK','D.'],      p:'#1a1a1a', s:'#000',    rim:'#D4A017', t:'#D4A017' },
    { id:'beninoise',   name:'Béninoise',   cat:'alcohol', lines:['BÉNI','NOISE'],   p:'#F5C400', s:'#C09B00', rim:'#005500', t:'#1a1a1a' },
    { id:'pils',        name:'Pils',        cat:'alcohol', lines:['PILS'],           p:'#F7C948', s:'#D4A017', rim:'#111',    t:'#111' },
    { id:'awooyo',      name:'Awooyo',      cat:'alcohol', lines:['AWOOYO'],         p:'#3B1F0D', s:'#1A0A02', rim:'#D4A017', t:'#D4A017' },
    { id:'kanpke',      name:'Kanpké',      cat:'alcohol', lines:['KANPKÉ'],         p:'#4A0000', s:'#2A0000', rim:'#D4A017', t:'#fff' },
    { id:'hagbe',       name:'Hagbe',       cat:'alcohol', lines:['HAGBE'],          p:'#1C1C1C', s:'#0A0A0A', rim:'#1DA462', t:'#fff' },
    { id:'beaufort',    name:'Beaufort',    cat:'alcohol', lines:['BEAU','FORT'],    p:'#E0F7FA', s:'#B2EBF2', rim:'#003D82', t:'#002550' },
    { id:'dopel',       name:'Dopel',       cat:'alcohol', lines:['DOPEL'],          p:'#212121', s:'#000',    rim:'#CC1E1E', t:'#CC1E1E' },
    { id:'valmont',     name:'Valmont',     cat:'alcohol', lines:['VALMONT'],        p:'#722F37', s:'#4A1C23', rim:'#fff',    t:'#fff' },
    { id:'eku',         name:'Eku',         cat:'alcohol', lines:['EKU'],            p:'#CC1E1E', s:'#990000', rim:'#D4A017', t:'#fff' },
    { id:'panache',     name:'Panaché',     cat:'alcohol', lines:['PANA','CHÉ'],     p:'#F5C400', s:'#C09B00', rim:'#1DA462', t:'#1DA462' },
    { id:'vody',        name:'Vody',        cat:'alcohol', lines:['VODY'],           p:'#003D82', s:'#001F5B', rim:'#CC1E1E', t:'#fff' },
    { id:'ivoire',      name:'Ivoire',      cat:'alcohol', lines:['IVOIRE'],         p:'#1DA462', s:'#004D00', rim:'#D4A017', t:'#fff' },
    { id:'djama',       name:'Djama',       cat:'alcohol', lines:['DJAMA'],          p:'#2E7D32', s:'#1B5E20', rim:'#F44336', t:'#F44336' },
    { id:'chill',       name:'Chill',       cat:'alcohol', lines:['CHILL'],          p:'#1565C0', s:'#0D47A1', rim:'#E0E0E0', t:'#E0E0E0' },
    { id:'tequila',     name:'Tequila',     cat:'alcohol', lines:['TEQUI','LA'],     p:'#FFC107', s:'#FFA000', rim:'#212121', t:'#212121' },
    /* ── CHAUDS ── */
    { id:'nescafe',     name:'Nescafé',     cat:'hot',     lines:['NESCA','FÉ'],     p:'#C52126', s:'#8B1519', rim:'#D4A017', t:'#fff' },
    { id:'cafe',        name:'Café',        cat:'hot',     lines:['CAFÉ'],           p:'#3D1C02', s:'#200E01', rim:'#D4A017', t:'#D4A017' },
    { id:'the',         name:'Thé',         cat:'hot',     lines:['THÉ'],            p:'#8B5E3C', s:'#5C3B22', rim:'#1DA462', t:'#fff' },
    { id:'milo',        name:'Milo',        cat:'hot',     lines:['MILO'],           p:'#1A5C15', s:'#0D3B0A', rim:'#D4A017', t:'#D4A017' },
    { id:'lipton',      name:'Lipton',      cat:'hot',     lines:['LIPTON'],         p:'#E8C310', s:'#B89A0C', rim:'#CC1E1E', t:'#1a1a1a' },
    { id:'ovomaltine',  name:'Ovomaltine',  cat:'hot',     lines:['OVO','MALT'],     p:'#4A2A00', s:'#2D1A00', rim:'#D4A017', t:'#D4A017' },
    { id:'cappuccino',  name:'Cappuccino',  cat:'hot',     lines:['CAPPU','CCINO'],  p:'#7B4E2D', s:'#4E2F16', rim:'#D4A017', t:'#fff' },
    { id:'chocolat',    name:'Chocolat',    cat:'hot',     lines:['CHOCO','LAT'],    p:'#3C1A0A', s:'#1E0B04', rim:'#8B4513', t:'#D4A017' },
  ],

  /* Generate bottle-cap SVG */
  svg(brand, size = 80) {
    const { p, s, rim, t, lines } = brand;
    const cx = size / 2, cy = size / 2;
    const outerR = size * 0.485, mainR = size * 0.41, innerRimR = size * 0.41;

    /* Ridge dots */
    const N = 24, ridges = [];
    for (let i = 0; i < N; i++) {
      const a = (i * 360 / N - 90) * Math.PI / 180;
      ridges.push(`<circle cx="${(cx + outerR * Math.cos(a)).toFixed(2)}" cy="${(cy + outerR * Math.sin(a)).toFixed(2)}" r="${(size * 0.038).toFixed(1)}" fill="${s}"/>`);
    }

    /* Text */
    const fontSize = (str) => str.length > 6 ? size * 0.135 : str.length > 4 ? size * 0.155 : size * 0.18;
    let textSVG = '';
    if (lines.length === 1) {
      const fs = fontSize(lines[0]);
      textSVG = `<text x="${cx}" y="${cy + fs * 0.38}" text-anchor="middle" font-family="Outfit,Arial,sans-serif" font-weight="900" font-size="${fs.toFixed(1)}" fill="${t}" letter-spacing="0.5">${lines[0]}</text>`;
    } else {
      const fs0 = fontSize(lines[0]), fs1 = fontSize(lines[1]);
      const gap = size * 0.16;
      textSVG = `
        <text x="${cx}" y="${cy - gap * 0.15}" text-anchor="middle" font-family="Outfit,Arial,sans-serif" font-weight="900" font-size="${fs0.toFixed(1)}" fill="${t}" letter-spacing="0.5">${lines[0]}</text>
        <text x="${cx}" y="${cy + gap * 1.05}" text-anchor="middle" font-family="Outfit,Arial,sans-serif" font-weight="900" font-size="${fs1.toFixed(1)}" fill="${t}" letter-spacing="0.5">${lines[1]}</text>`;
    }

    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${ridges.join('')}
      <circle cx="${cx}" cy="${cy + 2}" r="${mainR}" fill="rgba(0,0,0,0.28)"/>
      <circle cx="${cx}" cy="${cy}" r="${mainR}" fill="${p}"/>
      <circle cx="${cx}" cy="${cy}" r="${innerRimR}" fill="none" stroke="${rim}" stroke-width="${(size * 0.036).toFixed(1)}" opacity="0.65"/>
      <ellipse cx="${(cx - size * 0.1).toFixed(1)}" cy="${(cy - size * 0.14).toFixed(1)}" rx="${(size * 0.13).toFixed(1)}" ry="${(size * 0.085).toFixed(1)}" fill="rgba(255,255,255,0.18)" transform="rotate(-30 ${cx} ${cy})"/>
      ${textSVG}
    </svg>`;
  },

  byId(id) { return this.brands.find(b => b.id === id) || null; },

  byCat(cat) {
    if (!cat || cat === 'all') return this.brands;
    return this.brands.filter(b => b.cat === cat);
  },

  renderGallery(container, selectedId = null, cat = 'all', query = '') {
    const list = this.byCat(cat).filter(b =>
      !query || b.name.toLowerCase().includes(query.toLowerCase())
    );
    if (!list.length) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Aucun résultat</div>`;
      return;
    }
    container.innerHTML = list.map(b => `
      <div class="cap-item ${b.id === selectedId ? 'on' : ''}" data-id="${b.id}" title="${b.name}">
        ${this.svg(b, 80)}
        <span class="cap-label">${b.name}</span>
      </div>`).join('');
  },
};
