export const renderProducts = (products, containerElement) => {
    if (!containerElement) return;

    containerElement.innerHTML = "";

    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");
        
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="category">${product.category}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="btn-add" data-id="${product.id}">Agregar al Carrito</button>
        `;
        
        containerElement.appendChild(productCard);
    });
};