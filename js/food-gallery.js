/* ── APEIRON BUVETTE — FOOD GALLERY ─────────────────────── */
const FOODS = {
  items: [
    /* Fast Food & Snacks */
    { id: 'f_burger', name: 'Burger', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_pizza', name: 'Pizza', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_frites', name: 'Frites', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_hotdog', name: 'Hot-Dog', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_tacos', name: 'Tacos / Wrap', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_shawarma', name: 'Shawarma', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1615996001433-241f90a56e21?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_sandwich', name: 'Sandwich', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_nuggets', name: 'Nuggets / Poulet pané', cat: 'fastfood', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=300&q=80' },
    
    /* Plats Consistants & Locaux */
    { id: 'f_poulet', name: 'Poulet Rôti', cat: 'plats', url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_brochette', name: 'Grillades / Brochettes', cat: 'plats', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_viande', name: 'Viande Grillée', cat: 'plats', url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_poisson', name: 'Poisson Braisé', cat: 'plats', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_riz', name: 'Riz Plat', cat: 'plats', url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_pates', name: 'Pâtes', cat: 'plats', url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_spaghetti', name: 'Spaghetti & Omelette', cat: 'plats', url: 'https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_alloco', name: 'Alloco / Fritures', cat: 'plats', url: 'https://images.unsplash.com/photo-1604908177522-42171e21b8f0?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_soupe', name: 'Soupe / Bouillon', cat: 'plats', url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_salade', name: 'Salade', cat: 'plats', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_charcuterie', name: 'Planche Charcuterie', cat: 'plats', url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=300&q=80' },

    /* Petits déjeuners & Desserts */
    { id: 'f_omelette', name: 'Omelette', cat: 'plats', url: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_the', name: 'Thé / Déjeuner', cat: 'plats', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_viennoiserie', name: 'Viennoiserie / Croissant', cat: 'desserts', url: 'https://images.unsplash.com/photo-1495147466023-af5c1f0b0948?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_gateau', name: 'Gâteau Chocolat', cat: 'desserts', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_glace', name: 'Glace', cat: 'desserts', url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_crepe', name: 'Crêpes', cat: 'desserts', url: 'https://images.unsplash.com/photo-1519676860045-812e96d8ca68?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_gaufre', name: 'Gaufres', cat: 'desserts', url: 'https://images.unsplash.com/photo-1562376552-0d160a2f5cb3?auto=format&fit=crop&w=300&q=80' },
    { id: 'f_fruit', name: 'Fruits Frais', cat: 'desserts', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80' }
  ],

  byId(id) { return this.items.find(i => i.id === id) || null; },
  byCat(cat) { 
    if(!cat || cat==='all') return this.items;
    return this.items.filter(i => i.cat === cat);
  },

  renderGallery(container, selectedUrl = null, cat = 'all', query = '') {
    const list = this.byCat(cat).filter(i => 
      !query || i.name.toLowerCase().includes(query.toLowerCase())
    );
    if (!list.length) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Aucun plat trouvé</div>`;
      return;
    }
    container.innerHTML = list.map(i => `
      <div class="food-item ${i.url === selectedUrl ? 'on' : ''}" data-url="${i.url}" title="${i.name}" style="background-image:url('${i.url}');">
        <span class="food-label">${i.name}</span>
      </div>`).join('');
  }
};
