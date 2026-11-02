import { productsData } from '../models/product.model.js';
import { renderProducts } from '../views/product.view.js';

export const initProducts = () => {
    // Asegúrate de tener un contenedor con id="product-list" en tu index.html
    const productContainer = document.getElementById("product-list");
    
    // Renderizamos los productos al iniciar
    renderProducts(productsData, productContainer);
};