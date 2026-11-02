// js/controllers/wishlist.controller.js
import { showToast } from '../views/toast.view.js';

export const initWishlist = (onAddToCart) => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist_arequipa')) || [];

    const saveWishlist = () => {
        localStorage.setItem('wishlist_arequipa', JSON.stringify(wishlist));
        updateWishlistBadge();
        window.dispatchEvent(new CustomEvent('wishlist:changed'));
    };

    window.addEventListener('wishlist:loaded', (event) => {
        wishlist = Array.isArray(event.detail?.items) ? event.detail.items : [];
        updateWishlistBadge();
        renderWishlistModal();
        actualizarVisualesTarjetas();
    });

    const updateWishlistBadge = () => {
        const badge = document.getElementById('wishlistCount');
        if (badge) {
            badge.textContent = wishlist.length;
        }
    };

    const actualizarVisualesTarjetas = () => {
        document.querySelectorAll('.card').forEach(card => {
            const h3 = card.querySelector('h3');
            const btnFav = card.querySelector('.btn-favorito');
            if (!h3 || !btnFav) return;

            const name = h3.textContent;
            const estaEnFavoritos = wishlist.some(item => item.name === name);
            if (estaEnFavoritos) {
                btnFav.classList.add('activo');
            } else {
                btnFav.classList.remove('activo');
            }
        });
    };

    const renderWishlistModal = () => {
        const contenedor = document.getElementById('favoritosContenido');
        if (!contenedor) return;

        if (wishlist.length === 0) {
            contenedor.innerHTML = `<div class="carrito-vacio"><span>💔</span><p>No tienes productos guardados en favoritos.</p></div>`;
            return;
        }

        contenedor.innerHTML = wishlist.map(item => `
            <div class="item-carrito">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-datos">
                    <h3>${item.name}</h3>
                    <span>${item.priceText}</span>
                </div>
                <div>
                    <button type="button" class="btn btn-carrito btn-mover-carrito" data-name="${item.name}" style="padding: 6px 10px; font-size: 0.8rem; margin-bottom: 4px;">Mover al carrito 🛒</button>
                    <button type="button" class="btn btn-vaciar btn-quitar-fav" data-name="${item.name}" style="padding: 4px 8px; font-size: 0.75rem; width: 100%;">Quitar</button>
                </div>
            </div>
        `).join('');
    };

    // FUNCIÓN CENTRAL PARA ABRIR EL MODAL
    const abrirModalFavoritos = (e) => {
        if (e) e.preventDefault();
        const modal = document.getElementById('favoritosModal');
        if (modal) {
            renderWishlistModal();
            modal.classList.add('activo');
            document.body.classList.add('modal-abierto');
            console.log("❤️ Modal de favoritos abierto exitosamente.");
        } else {
            console.error("❌ No se encontró el elemento #favoritosModal en el DOM.");
        }
    };

    // 1. Enlace directo al botón del header si ya existe
    const btnAbrir = document.getElementById('btnAbrirFavoritos');
    if (btnAbrir) {
        btnAbrir.addEventListener('click', abrirModalFavoritos);
    }

    // 2. Delegación global de seguridad (por si el botón se renderiza tarde)
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('favoritosModal');

        // Abrir al hacer clic en el botón de favoritos del header o sus hijos (icono/contador)
        if (e.target.closest('#btnAbrirFavoritos')) {
            abrirModalFavoritos(e);
            return;
        }

        // Cerrar con el botón 'X'
        if (e.target.closest('#cerrarFavoritos')) {
            if (modal) {
                modal.classList.remove('activo');
                document.body.classList.remove('modal-abierto');
            }
            return;
        }

        // Cerrar haciendo clic fuera del modal (overlay oscuro)
        if (modal && e.target === modal) {
            modal.classList.remove('activo');
            document.body.classList.remove('modal-abierto');
            return;
        }

        // Agregar / quitar de favoritos desde las tarjetas de productos
        const btnFav = e.target.closest('.btn-favorito');
        if (btnFav) {
            e.stopPropagation();
            const card = btnFav.closest('.card');
            if (card) {
                const h3 = card.querySelector('h3');
                const precio = card.querySelector('.precio');
                const img = card.querySelector('img');

                if (h3 && precio && img) {
                    const name = h3.textContent;
                    const id = Number(card.dataset.productId || 0);
                    const priceText = precio.textContent;
                    const image = img.src;

                    const index = wishlist.findIndex(item => item.name === name);
                    if (index > -1) {
                        wishlist.splice(index, 1);
                        showToast(`Quitado de favoritos: ${name}`);
                    } else {
                        wishlist.push({ id, name, priceText, image });
                        showToast(`Guardado en favoritos ❤️: ${name}`);
                    }
                    saveWishlist();
                    actualizarVisualesTarjetas();
                }
            }
        }
    });

    // Gestionar botones internos del modal de favoritos (Quitar / Mover al carrito)
    const contenedor = document.getElementById('favoritosContenido');
    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            if (!name) return;

            if (e.target.classList.contains('btn-quitar-fav')) {
                wishlist = wishlist.filter(item => item.name !== name);
                saveWishlist();
                renderWishlistModal();
                actualizarVisualesTarjetas();
                showToast("Producto quitado de favoritos.");
            } else if (e.target.classList.contains('btn-mover-carrito')) {
                const item = wishlist.find(i => i.name === name);
                if (item) {
                    onAddToCart(item);
                    wishlist = wishlist.filter(i => i.name !== name);
                    saveWishlist();
                    renderWishlistModal();
                    actualizarVisualesTarjetas();
                }
            }
        });
    }

    updateWishlistBadge();
    actualizarVisualesTarjetas();
};