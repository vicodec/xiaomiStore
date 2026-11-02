// js/controllers/detalle.controller.js
export const initProductDetail = (onAddToCart) => {
    const modal = document.getElementById('modalDetalle');
    const btnCerrar = document.getElementById('cerrarDetalle');
    
    const imgEl = document.getElementById('detalleImg');
    const tituloEl = document.getElementById('detalleTitulo');
    const precioEl = document.getElementById('detallePrecio');
    const descEl = document.getElementById('detalleDesc');
    const btnAgregar = document.getElementById('detalleBtnAgregar');

    // Elementos de la sección de reseñas en el modal
    const ratingEl = document.getElementById('detalleRating');
    const listaComentariosEl = document.querySelector('.lista-comentarios');

    let productoActual = null;

    // Banco de reseñas simuladas para darle dinamismo según el tipo de producto
    const generarReseñasSimuladas = (nombreProducto) => {
        return [
            { autor: "Carlos M. (Cercado)", texto: `¡Excelente ${nombreProducto}! 100% original y sellado.` },
            { autor: "Lucía P. (Yanahuara)", texto: "La entrega en Arequipa fue rapidísima, muy recomendado." },
            { autor: "Diego R. (Cayma)", texto: "Funciona de maravilla, excelente relación calidad-precio." }
        ];
    };

    // Abrir modal al hacer clic en la tarjeta (excepto en los botones directos)
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Si hace clic directamente en los botones de acción rápida, no abrir el detalle
            if (e.target.closest('button')) return;

            const name = card.querySelector('h3').textContent;
            const priceText = card.querySelector('.precio').textContent;
            const desc = card.querySelector('.desc') ? card.querySelector('.desc').textContent : "Sin descripción adicional.";
            const image = card.querySelector('img').src;

            productoActual = { id: Number(card.dataset.productId || 0), name, priceText, image };

            imgEl.src = image;
            tituloEl.textContent = name;
            precioEl.textContent = priceText;
            descEl.textContent = desc;

            // Generar calificación aleatoria realista (entre 4.7 y 5.0) y comentarios dinámicos
            if (ratingEl) {
                const ratingAleatorio = (4.7 + Math.random() * 0.3).toFixed(1);
                ratingEl.textContent = ratingAleatorio;
            }

            if (listaComentariosEl) {
                const comentarios = generarReseñasSimuladas(name);
                listaComentariosEl.innerHTML = comentarios.map(c => `
                    <div class="comentario-item">
                        <div class="comentario-autor">${c.autor}</div>
                        <div class="comentario-texto">"${c.texto}"</div>
                    </div>
                `).join('');
            }

            modal.classList.add('activo');
            document.body.classList.add('modal-abierto');
        });
    });

    // Cerrar modal
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            modal.classList.remove('activo');
            document.body.classList.remove('modal-abierto');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('activo');
            document.body.classList.remove('modal-abierto');
        }
    });

    // Botón de agregar al carrito desde el detalle
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            if (productoActual) {
                onAddToCart(productoActual);
                modal.classList.remove('activo');
                document.body.classList.remove('modal-abierto');
            }
        });
    }
};