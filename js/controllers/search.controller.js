// js/controllers/search.controller.js
export const initSearchAndFilter = () => {
    const inputBuscar = document.getElementById('inputBuscar');
    const cards = document.querySelectorAll('.card');
    const categoriasLinks = document.querySelectorAll('.categorias .cat');

    // 1. Filtrado por texto en tiempo real
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().trim();

            cards.forEach(card => {
                const titulo = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('.desc').textContent.toLowerCase();

                if (titulo.includes(termino) || desc.includes(termino)) {
                    card.classList.remove('oculto');
                } else {
                    card.classList.add('oculto');
                }
            });
        });
    }

    // 2. Filtrado rápido al hacer clic en las tarjetas de categorías superiores
    categoriasLinks.forEach(cat => {
        cat.addEventListener('click', (e) => {
            // El comportamiento predeterminado del enlace ancla (#celulares, etc.) sigue funcionando,
            // pero limpiamos el buscador para evitar confusiones al saltar de categoría.
            if (inputBuscar) {
                inputBuscar.value = '';
                cards.forEach(card => card.classList.remove('oculto'));
            }
        });
    });
};