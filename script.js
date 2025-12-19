// --- CONFIGURACIÓN ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZIOFgQMtPc_h5FVoQIMAcpkoyXs3vminjL7rSvr2VCLmmgykBsH1AJ13ZnBYSvg/pub?output=csv'; 

// Variables globales
let inventory = [];
let searchHistory = []; // Array para guardar el historial

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultContainer = document.getElementById('resultContainer');
const historyListDiv = document.getElementById('historyList');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// Cargar datos al iniciar
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
    searchInput.focus(); // Enfocar al abrir la app
    // Mantener el foco si se hace click fuera (opcional, agresivo)
    // document.addEventListener('click', () => searchInput.focus());
});

function fetchData() {
    loadingDiv.classList.remove('hidden');
    Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            inventory = results.data;
            loadingDiv.classList.add('hidden');
            console.log("Inventario cargado:", inventory.length);
        },
        error: function(err) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = "Error de conexión con Google Sheets.";
            errorDiv.classList.remove('hidden');
        }
    });
}

function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    // Limpiar input inmediatamente para el próximo escaneo
    searchInput.value = '';
    searchInput.focus(); // RE-ENFOCAR SIEMPRE

    if (query === '') return;

    // Lógica de filtrado
    const results = inventory.filter(item => {
        const code = item.Codigo ? item.Codigo.toLowerCase() : '';
        const desc = item.Descripcion ? item.Descripcion.toLowerCase() : '';
        // Búsqueda exacta para código (mejor para escáner) o parcial para nombre
        return code === query || (query.length > 3 && desc.includes(query));
    });

    displayResults(results);

    // Si encontramos un resultado único, lo agregamos al historial
    if (results.length === 1) {
        addToHistory(results[0]);
    }
}

function displayResults(products) {
    resultContainer.innerHTML = ''; 

    if (products.length === 0) {
        resultContainer.innerHTML = '<div class="placeholder-text">Producto no encontrado ❌</div>';
        return;
    }

    // Mostramos tarjeta del primer resultado (o lista si hay varios)
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const formatMoney = (val) => val ? '$' + val : '$0';

        // ORDEN CAMBIADO: Crédito/Lista PRIMERO, Efectivo SEGUNDO
        card.innerHTML = `
            <div class="product-title">${product.Descripcion || 'Art. Sin Nombre'}</div>
            
            <div class="price-box credit">
                <span class="price-label">Precio Lista / Tarjeta</span>
                <span class="price-value">${formatMoney(product.Credito)}</span>
            </div>

            <div class="price-box cash">
                <span class="price-label">Precio Efectivo</span>
                <span class="price-value">${formatMoney(product.Efectivo)}</span>
            </div>

            <div class="code-ref">${product.Codigo}</div>
        `;
        resultContainer.appendChild(card);
    });
}

// --- LÓGICA DE HISTORIAL ---
function addToHistory(product) {
    // Evitar duplicados consecutivos (opcional)
    if (searchHistory.length > 0 && searchHistory[0].Codigo === product.Codigo) {
        return;
    }

    // Agregar al principio del array
    searchHistory.unshift(product);

    // Mantener solo los últimos 10
    if (searchHistory.length > 10) {
        searchHistory.pop();
    }

    renderHistory();
}

function renderHistory() {
    historyListDiv.innerHTML = '';
    
    searchHistory.forEach(item => {
        const row = document.createElement('div');
        row.className = 'history-item';
        
        // Versión resumida para la lista
        row.innerHTML = `
            <div class="h-desc">${item.Descripcion}</div>
            <div class="h-prices">
                <div class="h-list">L: $${item.Credito}</div>
                <div class="h-cash">E: $${item.Efectivo}</div>
            </div>
        `;
        historyListDiv.appendChild(row);
    });
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    performSearch();
    searchInput.focus();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});