// js/controllers/cart.controller.js
import { globalCart } from '../models/cart.model.js';
import { renderCartModal } from '../views/cart.view.js';
import { showToast } from '../views/toast.view.js';

export const initCart = () => {
    const rates = { PEN: 1, USD: 0.27, EUR: 0.25 };
    const symbols = { PEN: 'S/', USD: 'US$', EUR: '€' };
    
    let currentCurrency = 'PEN';
    const provinciaSelect = document.getElementById('clienteProvincia');
    const distritoSelect = document.getElementById('clienteDistrito');
    let zonasArequipa = {};
    const tarifasEnvio = {'Arequipa|Arequipa':5,'Arequipa|Yanahuara':7,'Arequipa|Cayma':8,'Arequipa|Cerro Colorado':10,'Arequipa|José Luis Bustamante y Rivero':6,'Arequipa|Paucarpata':7,'Arequipa|Socabaya':8,'Arequipa|Mariano Melgar':7,'Arequipa|Sachaca':10,'Arequipa|Jacobo Hunter':10};
    fetch('data/distritos_arequipa.json').then(r => r.json()).then(z => { zonasArequipa = z; if (provinciaSelect) provinciaSelect.disabled = false; }).catch(() => showToast('No se pudo cargar la lista de distritos.'));
    if (provinciaSelect && distritoSelect) {
        provinciaSelect.addEventListener('change', () => {
            distritoSelect.innerHTML = '<option value="" disabled selected>Selecciona tu distrito</option>';
            (zonasArequipa[provinciaSelect.value] || []).forEach(nombre => { const op=document.createElement('option'); op.value=nombre; op.textContent=nombre; const tarifa=tarifasEnvio[provinciaSelect.value+'|'+nombre]; op.dataset.costo=tarifa===undefined?'0':String(tarifa); op.textContent=tarifa===undefined?nombre+' (envío por cotizar)':nombre+' (S/ '+Number(tarifa).toFixed(2)+')'; distritoSelect.appendChild(op); });
            distritoSelect.disabled = false; updateView();
        });
    }

    const updateView = () => {
        const items = globalCart.getItems();
        const rawSubtotal = globalCart.getTotal();
        const rate = rates[currentCurrency] || 1;
        const symbol = symbols[currentCurrency] || 'S/';
        
        // Obtener costo de envío según el distrito seleccionado
        const selectDistrito = document.getElementById('clienteDistrito');
        let costoEnvioBase = 0;
        if (selectDistrito && selectDistrito.selectedIndex > 0) {
            const selectedOption = selectDistrito.options[selectDistrito.selectedIndex];
            costoEnvioBase = parseFloat(selectedOption.getAttribute('data-costo')) || 0;
        }

        const tarifaPendiente = !!(selectDistrito && selectDistrito.selectedIndex > 0 && costoEnvioBase === 0);
        const etiquetaTotal = document.getElementById('etiquetaTotalCheckout');
        if (etiquetaTotal) etiquetaTotal.textContent = tarifaPendiente ? 'Subtotal (envío pendiente):' : 'Total a pagar:';
        const costoEnvioConvertido = costoEnvioBase * rate;
        const rawTotal = rawSubtotal + costoEnvioBase;
        const convertedTotal = rawTotal * rate;
        
        const formattedItems = items.map(item => ({
            ...item,
            price: item.price * rate
        }));

        renderCartModal(formattedItems, convertedTotal, symbol);
        
        // Actualizar etiqueta visual del costo de envío en el modal
        const textoEnvioEl = document.getElementById('textoCostoEnvio');
        if (textoEnvioEl) {
            textoEnvioEl.textContent = tarifaPendiente ? 'Por cotizar' : `${symbol} ${costoEnvioConvertido.toFixed(2)}`;
        }

        updateCartCount(items);
    };

    const updateCartCount = (items) => {
        const countSpan = document.getElementById('cartCount');
        if (countSpan) {
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
            countSpan.textContent = totalItems;
        }
    };

    // Escuchar cambios en el distrito para recalcular el total en tiempo real
    const selectDistrito = document.getElementById('clienteDistrito');
    if (selectDistrito) {
        selectDistrito.addEventListener('change', () => {
            updateView();
        });
    }

    // Registrar el pedido en MySQL. El servidor recalcula precios y stock.
    const formCheckout = document.getElementById('formCheckout');
    if (formCheckout) {
        formCheckout.addEventListener('submit', async (e) => {
            e.preventDefault();
            const items = globalCart.getItems();
            if (!items.length) { showToast('Tu carrito está vacío.'); return; }
            if (items.some(item => !Number(item.id))) { showToast('Actualiza el catálogo desde la base de datos y vuelve a agregar los productos.'); return; }
            const payload = {
                nombre: document.getElementById('clienteNombre').value.trim(),
                direccion: document.getElementById('clienteDireccion').value.trim(),
                provincia: document.getElementById('clienteProvincia').value,
                distrito: document.getElementById('clienteDistrito').value,
                pago: document.getElementById('clientePago').value,
                items: items.map(item => ({id: Number(item.id), quantity: Number(item.quantity)}))
            };
            const submit = formCheckout.querySelector('button[type="submit"]');
            if (submit) submit.disabled = true;
            try {
                const response = await fetch('backend/guardar_pedido.php', {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload)});
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo registrar el pedido.');
                globalCart.clear(); updateView();
                showToast(data.envio_por_cotizar ? `¡Pedido #${data.pedido_id} registrado! Envío por cotizar; coordinaremos el costo contigo.` : `¡Pedido #${data.pedido_id} registrado! Total S/ ${data.total}. Revisa Mi cuenta para subir el comprobante si corresponde.`);
                const modal=document.getElementById('carritoModal'); if(modal) modal.classList.remove('activo');
                formCheckout.reset();
                setTimeout(()=>window.location.href='perfil.php',1200);
            } catch(error) {
                showToast(error.message || 'Error al registrar el pedido.');
                if ((error.message || '').toLowerCase().includes('inicia sesión')) {
                    const authModal = document.getElementById('authModal');
                    if (authModal) { authModal.classList.add('activo'); document.body.classList.add('modal-abierto'); }
                }
            }
            finally { if (submit) submit.disabled = false; }
        });
    }

    // Escuchar clics en los botones "Agregar al carrito" de las tarjetas principales
    document.querySelectorAll('.card').forEach(card => {
        const btnAdd = card.querySelector('.btn-carrito');
        if (btnAdd) {
            btnAdd.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se abra el modal de detalle al hacer clic
                const name = card.querySelector('h3').textContent;
                const priceText = card.querySelector('.precio').textContent;
                const image = card.querySelector('img').src;

                // Limpieza robusta del precio (ej: "S/ 2,399" -> 2399)
                const cleanPrice = parseFloat(priceText.replace('S/', '').replace(/,/g, '').trim());

                globalCart.addItem({ id: Number(card.dataset.productId || 0), name, price: cleanPrice, image });
                updateView();
                showToast(`Agregado al carrito: ${name}`);
            });
        }
    });

    // Abrir modal del carrito desde el Header
    const btnAbrir = document.getElementById('btnAbrirCarrito');
    const modal = document.getElementById('carritoModal');
    
    if (btnAbrir && modal) {
        btnAbrir.addEventListener('click', () => {
            updateView(); // Refresca los datos antes de abrir
            modal.classList.add('activo');
            document.body.classList.add('modal-abierto');
        });
    }

    // Cerrar modal del carrito
    const btnCerrar = document.getElementById('cerrarCarrito');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            modal.classList.remove('activo');
            document.body.classList.remove('modal-abierto');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('activo');
                document.body.classList.remove('modal-abierto');
            }
        });
    }

    // Vaciar carrito
    const btnVaciar = document.getElementById('vaciarCarrito');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            globalCart.clear();
            updateView();
            showToast("Se vació el carrito.");
        });
    }

    // Cambiar moneda
    const selectMoneda = document.getElementById('carritoMoneda');
    if (selectMoneda) {
        selectMoneda.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            updateView();
        });
    }

    // Controles CRUD dentro del modal (sumar, restar, eliminar)
    const contenidoModal = document.getElementById('carritoContenido');
    if (contenidoModal) {
        contenidoModal.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            if (!name) return;

            if (e.target.classList.contains('btn-sumar')) {
                globalCart.updateQuantity(name, 1);
            } else if (e.target.classList.contains('btn-restar')) {
                globalCart.updateQuantity(name, -1);
            } else if (e.target.classList.contains('btn-eliminar')) {
                globalCart.removeItem(name);
                showToast("Producto eliminado.");
            }
            updateView();
        });
    }

    // Actualizar vista y datos de entrega cuando cambie la sesión del cliente.
    window.addEventListener('cart:changed', updateView);
    window.addEventListener('cuenta:estado', (event) => {
        const user = event.detail?.user;
        if (!user) return;
        const nombre = document.getElementById('clienteNombre');
        const direccion = document.getElementById('clienteDireccion');
        const distrito = document.getElementById('clienteDistrito');
        if (nombre && !nombre.value) nombre.value = user.nombre || '';
        if (direccion && !direccion.value) direccion.value = user.direccion || '';
        if (distrito && user.distrito) {
            const option = [...distrito.options].find(o => o.value.toLowerCase() === String(user.distrito).toLowerCase() || o.text.toLowerCase().includes(String(user.distrito).toLowerCase()));
            if (option) distrito.value = option.value;
        }
        updateView();
    });

    // Inicializar vista al cargar la página
    updateView();
};