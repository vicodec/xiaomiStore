// js/models/cart.model.js
class CartModel {
    constructor() {
        this.storageKey = 'cart_arequipa';
        this.items = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        window.dispatchEvent(new CustomEvent('cart:changed'));
    }

    replaceItems(items) {
        this.items = Array.isArray(items) ? items : [];
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        window.dispatchEvent(new CustomEvent('cart:changed'));
    }

    getItems() {
        return this.items;
    }

    addItem(product) {
        const existing = this.items.find(item => (product.id && Number(item.id) === Number(product.id)) || item.name === product.name);
        if (existing) {
            existing.quantity += 1;
            if (product.id && !existing.id) existing.id = product.id;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.save();
    }

    removeItem(name) {
        this.items = this.items.filter(item => item.name !== name);
        this.save();
    }

    updateQuantity(name, delta) {
        const item = this.items.find(item => item.name === name);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(name);
            } else {
                this.save();
            }
        }
    }

    clear() {
        this.items = [];
        this.save();
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
}

// Exportamos una única instancia compartida globalmente
export const globalCart = new CartModel();