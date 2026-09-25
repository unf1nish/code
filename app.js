function normalize(str){
  return (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function escapeHtml(str){
  return (str || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function titleCase(str){
  return str.charAt(0) + str.slice(1).toLowerCase();
}

async function init(){
  const footNote = document.getElementById('footNote');
  let RAW;
  try{
    const res = await fetch('data.json');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    RAW = await res.json();
  }catch(err){
    footNote.textContent = 'No se pudieron cargar los datos (data.json). Si abriste el archivo directamente con doble clic, ejecútalo desde un servidor local o publícalo en GitHub Pages.';
    console.error(err);
    return;
  }
  footNote.textContent = 'Datos cargados localmente en el navegador · sin conexión a ningún servidor';

  const ciudades = Object.keys(RAW.ciudades);

  // ---- Stats ----
  const depTotal = ciudades.reduce((a,c)=>a+RAW.ciudades[c].d.length,0);
  const transTotal = ciudades.reduce((a,c)=>a+RAW.ciudades[c].t.length,0);
  document.getElementById('statPaises').textContent = RAW.paises.length;
  document.getElementById('statDepositos').textContent = depTotal;
  document.getElementById('statTransportadoras').textContent = transTotal;
  document.getElementById('statAduanas').textContent = ciudades.length;

  // ---- Populate aduana selects ----
  function populateSelect(sel){
    ciudades.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = titleCase(c);
      sel.appendChild(opt);
    });
  }
  const selectDepositos = document.getElementById('selectDepositos');
  const selectTransportadoras = document.getElementById('selectTransportadoras');
  populateSelect(selectDepositos);
  populateSelect(selectTransportadoras);

  // ---- Generic renderer ----
  // items: array of {codigo, descripcion, ciudad}
  function renderList({items, container, meta, query, showCity}){
    const q = normalize(query);
    if(!q){
      container.innerHTML = '<div class="empty-state">Escribe para buscar</div>';
      meta.textContent = '';
      return;
    }
    let matches = items.filter(it => normalize(it.descripcion).includes(q) || normalize(it.codigo).includes(q));
    matches.sort((a,b)=> normalize(a.descripcion).indexOf(q) - normalize(b.descripcion).indexOf(q));

    const MAX = 150;
    const shown = matches.slice(0, MAX);
    meta.textContent = matches.length === 0
      ? 'Sin resultados'
      : `${matches.length} resultado${matches.length===1?'':'s'}` + (matches.length>MAX ? ` · mostrando ${MAX}` : '');

    if(shown.length===0){
      container.innerHTML = '<div class="empty-state">No se encontraron coincidencias</div>';
      return;
    }
    container.innerHTML = shown.map(it => `
      <div class="row">
        <div class="desc">${escapeHtml(it.descripcion)}${showCity && it.ciudad ? `<span class="tag-city">${escapeHtml(titleCase(it.ciudad))}</span>` : ''}</div>
        <div class="code">${escapeHtml(it.codigo)}</div>
      </div>
    `).join('');
  }

  // ---- Países ----
  const paisesItems = RAW.paises.map(([codigo, descripcion]) => ({codigo, descripcion}));
  const inputPaises = document.getElementById('inputPaises');
  const resultsPaises = document.getElementById('resultsPaises');
  const metaPaises = document.getElementById('metaPaises');
  function renderPaises(){
    renderList({items: paisesItems, container: resultsPaises, meta: metaPaises, query: inputPaises.value, showCity:false});
  }
  inputPaises.addEventListener('input', renderPaises);
  renderPaises();

  // ---- Depósitos ----
  const inputDepositos = document.getElementById('inputDepositos');
  const resultsDepositos = document.getElementById('resultsDepositos');
  const metaDepositos = document.getElementById('metaDepositos');
  function toItems(pairs, ciudad){
    return pairs.map(([codigo, descripcion]) => ({codigo, descripcion, ciudad}));
  }
  function depositosItems(){
    const aduana = selectDepositos.value;
    if(aduana === 'TODAS'){
      return ciudades.flatMap(c => toItems(RAW.ciudades[c].d, c));
    }
    return toItems(RAW.ciudades[aduana].d, aduana);
  }
  function renderDepositos(){
    renderList({items: depositosItems(), container: resultsDepositos, meta: metaDepositos, query: inputDepositos.value, showCity: selectDepositos.value==='TODAS'});
  }
  inputDepositos.addEventListener('input', renderDepositos);
  selectDepositos.addEventListener('change', renderDepositos);
  renderDepositos();

  // ---- Transportadoras ----
  const inputTransportadoras = document.getElementById('inputTransportadoras');
  const resultsTransportadoras = document.getElementById('resultsTransportadoras');
  const metaTransportadoras = document.getElementById('metaTransportadoras');
  function transportadorasItems(){
    const aduana = selectTransportadoras.value;
    if(aduana === 'TODAS'){
      return ciudades.flatMap(c => toItems(RAW.ciudades[c].t, c));
    }
    return toItems(RAW.ciudades[aduana].t, aduana);
  }
  function renderTransportadoras(){
    renderList({items: transportadorasItems(), container: resultsTransportadoras, meta: metaTransportadoras, query: inputTransportadoras.value, showCity: selectTransportadoras.value==='TODAS'});
  }
  inputTransportadoras.addEventListener('input', renderTransportadoras);
  selectTransportadoras.addEventListener('change', renderTransportadoras);
  renderTransportadoras();
}

init();
