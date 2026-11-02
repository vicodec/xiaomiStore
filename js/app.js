import { initCart } from './controllers/cart.controller.js';
import { initSearchAndFilter } from './controllers/search.controller.js';
import { initProductDetail } from './controllers/detalle.controller.js';
import { initWishlist } from './controllers/wishlist.controller.js';
import { initAuth } from './controllers/auth.controller.js';
import { globalCart } from './models/cart.model.js';
import { showToast } from './views/toast.view.js';
import { initCatalogoDB } from './controllers/catalogo-db.controller.js';
import { initCuentaSync } from './models/cuenta-sync.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("Mi Store Arequipa inicializado con éxito 🚀");
    
    initCart();
    initSearchAndFilter();
    initAuth();
    initCuentaSync();

    // Helper unificado para agregar productos de forma segura
    const agregarAlCarritoHelper = (product) => {
        let rawPrice = product.priceText || product.price.toString();
        // Limpieza robusta de precios (remueve "S/", espacios y comas ej: "S/ 2,399" -> 2399)
        const cleanPrice = parseFloat(rawPrice.replace('S/', '').replace(/,/g, '').trim());

        globalCart.addItem({
            id: Number(product.id || 0),
            name: product.name,
            price: cleanPrice,
            image: product.image
        });
        
        showToast(`Agregado al carrito: ${product.name}`);
        
        // Actualizar contador global de la interfaz
        const countSpan = document.getElementById('cartCount');
        if (countSpan) {
            const items = globalCart.getItems();
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
            countSpan.textContent = totalItems;
        }
    };

    // Inicializar Detalle y Favoritos compartiendo el helper
    initProductDetail(agregarAlCarritoHelper);
    initWishlist(agregarAlCarritoHelper);
    // El catálogo público se sincroniza con MySQL; si falla la conexión se conserva el HTML original.
    initCatalogoDB(() => initProductDetail(agregarAlCarritoHelper));

    // Activar el botón de consulta directa por WhatsApp en cada tarjeta
    document.querySelectorAll('.card').forEach(card => {
        const btnConsultar = card.querySelector('.btn-consultar-wsp');
        if (btnConsultar) {
            btnConsultar.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const nombre = card.querySelector('h3').textContent;
                const precio = card.querySelector('.precio').textContent;

                let mensaje = `*¡HOLA MI STORE AREQUIPA!* 👋\n\n`;
                mensaje += `Tengo una consulta sobre el siguiente producto:\n`;
                mensaje += `📱 *Producto:* ${nombre}\n`;
                mensaje += `💰 *Precio:* ${precio}\n\n`;
                mensaje += `_¿Tienen stock o tienda física disponible en Arequipa?_`;

                const telefono = "51927248132";
                const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

                window.open(url, '_blank');
            });
        }
    });
});