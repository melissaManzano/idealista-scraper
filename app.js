document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = '726e47603da4d0786dda4215609ff78d';

  let propiedadesGuardadas = [];
  let urlBase = 'https://www.idealista.com/alquiler-viviendas/madrid-madrid/';
  let urlOrdenada = urlBase + '?ordenado-por=precios-asc'; // default

  // Cargar registro local
  const userInfoDiv = document.getElementById('userInfo');
  const registroForm = document.getElementById('registroForm');
  const modalRegistro = new bootstrap.Modal(document.getElementById('registroModal'));
  const nombreInput = document.getElementById('nombreUsuario');
  const emailInput = document.getElementById('emailUsuario');

  function mostrarUsuario() {
    const user = JSON.parse(localStorage.getItem('usuarioRegistrado'));
    if (user) {
      userInfoDiv.innerHTML = `Registrado como: <strong>${user.nombre}</strong> (${user.email})`;
    } else {
      userInfoDiv.innerHTML = '';
    }
  }

  mostrarUsuario();

  registroForm.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();

    if (nombre && email) {
      localStorage.setItem('usuarioRegistrado', JSON.stringify({ nombre, email }));
      mostrarUsuario();
      modalRegistro.hide();
      registroForm.reset();
    }
  });

  // Función para cargar datos con ScraperAPI
  function cargarDatos(urlIdealista) {
    const URL = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(urlIdealista)}`;
    propiedadesGuardadas = [];
    document.getElementById('propiedades').innerHTML =
      `<tr><td colspan="5" class="text-center">Cargando...</td></tr>`;

    fetch(URL)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const propiedades = doc.querySelectorAll('.item');
        propiedadesGuardadas = [];

        propiedades.forEach(prop => {
          const titulo = prop.querySelector('.item-link')?.textContent.trim() || 'Sin título';
          const precioTexto = prop.querySelector('.item-price')?.textContent.trim() || '';
          const precioNum = parseInt(precioTexto.replace(/[^\d]/g, '')) || 0;

          const imgEl = prop.querySelector('.item-multimedia img');
          const imagen = imgEl?.getAttribute('src') || 'https://via.placeholder.com/100x75?text=Sin+Imagen';

          const detalleTexto = prop.querySelector('.item-detail-char')?.textContent.trim()
            || prop.querySelector('.item-detail')?.textContent.trim()
            || '';

          let habitaciones = 'No disponible';
          let metros = 'No disponible';

          const habMatch = detalleTexto.match(/(\d+)\s*hab/);
          const m2Match = detalleTexto.match(/(\d+)\s*m²/);

          if (habMatch) habitaciones = parseInt(habMatch[1]);
          if (m2Match) metros = parseInt(m2Match[1]);

          propiedadesGuardadas.push({ titulo, precio: precioNum, imagen, habitaciones, metros });
        });

        aplicarFiltros();
      })
      .catch(error => {
        console.error('Error al hacer scraping:', error);
        document.getElementById('propiedades').innerHTML =
          `<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>`;
      });
  }

  // Función para aplicar filtros a las propiedades guardadas y mostrar tabla
  function aplicarFiltros() {
    const habs = document.getElementById('filtroHabitaciones').value;
    const precioMin = parseInt(document.getElementById('precioMin').value) || 0;
    const precioMaxInput = document.getElementById('precioMax').value;
    const precioMax = precioMaxInput ? parseInt(precioMaxInput) : Infinity;
    const metrosMin = parseInt(document.getElementById('metrosMin').value) || 0;

    const filtradas = propiedadesGuardadas.filter(p => {
      const hab = typeof p.habitaciones === 'number' ? p.habitaciones : 0;
      const m2 = typeof p.metros === 'number' ? p.metros : 0;
      const condHabs = habs ? (habs === '4' ? hab >= 4 : hab == habs) : true;
      const condPrecio = p.precio >= precioMin && p.precio <= precioMax;
      const condMetros = m2 >= metrosMin;
      return condHabs && condPrecio && condMetros;
    });

    mostrarTabla(filtradas);
  }

  // Mostrar tabla de propiedades
  function mostrarTabla(props) {
    const tbody = document.getElementById('propiedades');
    if (props.length === 0) {
      tbody.innerHTML =
        `<tr><td colspan="5" class="text-center">No hay propiedades que coincidan con los filtros.</td></tr>`;
      return;
    }

    tbody.innerHTML = props.map(p => `
      <tr>
        <td><img src="${p.imagen}" alt="Imagen" style="width:100px; height:auto;"></td>
        <td>${p.titulo}</td>
        <td>€${p.precio.toLocaleString()}</td>
        <td>${p.habitaciones}</td>
        <td>${p.metros}</td>
      </tr>
    `).join('');
  }

  // Eventos filtros
  document.getElementById('filtroHabitaciones').addEventListener('change', aplicarFiltros);
  document.getElementById('precioMin').addEventListener('input', aplicarFiltros);
  document.getElementById('precioMax').addEventListener('input', aplicarFiltros);
  const metrosMinInput = document.getElementById('metrosMin');
  const metrosMinValor = document.getElementById('metrosMinValor');
  metrosMinInput.addEventListener('input', () => {
    metrosMinValor.textContent = metrosMinInput.value;
    aplicarFiltros();
  });

  // Eventos botones orden
  document.querySelectorAll('.orden-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.orden-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      urlOrdenada = btn.getAttribute('data-url');
      cargarDatos(urlOrdenada);
    });
  });

  // Cargar datos iniciales
  cargarDatos(urlOrdenada);
});
