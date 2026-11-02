// js/views/cart.view.js
export const renderCartModal = (items, total, currencySymbol) => {
    const container = document.getElementById('carritoContenido');
    const totalElement = document.getElementById('carritoTotal');
    
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="carrito-vacio">
                <span>🛒</span>
                <p>Tu carrito está vacío.</p>
            </div>`;
    } else {
        container.innerHTML = items.map(item => `
            <div class="item-carrito">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-datos">
                    <h3>${item.name}</h3>
                    <span>${currencySymbol} ${item.price.toFixed(2)} c/u</span>
                    <div class="cantidad-control">
                        <button type="button" class="btn-restar" data-name="${item.name}">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="btn-sumar" data-name="${item.name}">+</button>
                        <button type="button" class="btn-eliminar" data-name="${item.name}">Eliminar</button>
                    </div>
                </div>
                <div class="item-subtotal">
                    ${currencySymbol} ${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    if (totalElement) {
        totalElement.textContent = `${currencySymbol} ${total.toFixed(2)}`;
    }
};