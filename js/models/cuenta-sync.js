import { globalCart } from './cart.model.js';

let usuarioActual = null;
let colaSync = Promise.resolve();
let inicializado = false;
const CART_KEY = 'cart_arequipa';
const WISHLIST_KEY = 'wishlist_arequipa';

const leerJSON = (key, fallback = []) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; }
  catch (_) { return fallback; }
};
const porId = (items) => {
  const map = new Map();
  items.forEach(item => {
    const id = Number(item.id || item.producto_id || 0);
    if (!id) return;
    if (map.has(id)) map.get(id).quantity += Number(item.quantity || 1);
    else map.set(id, { id, name: item.name || item.nombre || '', price: Number(item.price ?? item.precio ?? 0), image: item.image || item.imagen || '', quantity: Number(item.quantity || 1) });
  });
  return [...map.values()];
};
const actualizarHeader = () => {
  const label = document.getElementById('textoUsuarioHeader');
  if (label) label.textContent = usuarioActual ? `Hola, ${(usuarioActual.nombre || 'cliente').split(' ')[0]}` : 'Iniciar Sesión';
  const link = document.querySelector('.btn-cuenta');
  if (link) link.textContent = usuarioActual ? 'Mi cuenta' : 'Mi cuenta';
};

export const getUsuarioActual = () => usuarioActual;

export async function sincronizarCuenta() {
  if (!usuarioActual) return;
  const cart = porId(globalCart.getItems()).map(({id,quantity}) => ({id,quantity:Math.min(20,quantity)}));
  const wishlist = leerJSON(WISHLIST_KEY).map(item => Number(item.id || 0)).filter(Boolean);
  const body = JSON.stringify({cart, wishlist});
  colaSync = colaSync.then(async () => {
    const response = await fetch('backend/sincronizar_cuenta.php', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body});
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo sincronizar tu cuenta.');
  }).catch(error => console.warn('Sincronización de cuenta:', error));
  return colaSync;
}

export async function actualizarSesionCuenta({fusionarLocal = true} = {}) {
  try {
    const response = await fetch('backend/cuenta_datos.php', {credentials:'same-origin',headers:{'Accept':'application/json'}});
    if (response.status === 401) {
      usuarioActual = null;
      localStorage.removeItem('usuario_arequipa');
      actualizarHeader();
      window.dispatchEvent(new CustomEvent('cuenta:estado', {detail:{user:null}}));
      return null;
    }
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo cargar la cuenta.');
    usuarioActual = data.user;
    localStorage.setItem('usuario_arequipa', JSON.stringify(data.user));

    const localCart = fusionarLocal ? leerJSON(CART_KEY) : [];
    const serverCart = (data.cart || []).map(item => ({id:Number(item.id),name:item.nombre,price:Number(item.precio),image:item.imagen || '',quantity:Number(item.quantity)}));
    const mergedCart = porId([...serverCart, ...localCart]);
    localStorage.setItem(CART_KEY, JSON.stringify(mergedCart));
    globalCart.replaceItems(mergedCart);

    const localWishlist = fusionarLocal ? leerJSON(WISHLIST_KEY) : [];
    const serverWishlist = (data.wishlist || []).map(item => ({id:Number(item.id),name:item.nombre,price:Number(item.precio),priceText:`S/ ${Number(item.precio).toFixed(2)}`,image:item.imagen || ''}));
    const mergedWishlist = [...new Map([...serverWishlist,...localWishlist].filter(item => Number(item.id)>0).map(item => [Number(item.id),item])).values()];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(mergedWishlist));
    actualizarHeader();
    window.dispatchEvent(new CustomEvent('wishlist:loaded', {detail:{items:mergedWishlist}}));
    window.dispatchEvent(new CustomEvent('cuenta:estado', {detail:{user:usuarioActual}}));
    if (fusionarLocal) await sincronizarCuenta();
    return usuarioActual;
  } catch (error) {
    console.warn('No se pudo sincronizar la cuenta:', error);
    return null;
  }
}

export function limpiarSesionLocal() {
  usuarioActual = null;
  localStorage.removeItem('usuario_arequipa');
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(WISHLIST_KEY);
  globalCart.replaceItems([]);
  actualizarHeader();
  window.dispatchEvent(new CustomEvent('wishlist:loaded', {detail:{items:[]}}));
  window.dispatchEvent(new CustomEvent('cuenta:estado', {detail:{user:null}}));
}

export function initCuentaSync() {
  if (inicializado) return;
  inicializado = true;
  window.addEventListener('cart:changed', () => sincronizarCuenta());
  window.addEventListener('wishlist:changed', () => sincronizarCuenta());
  actualizarSesionCuenta({fusionarLocal:true});
}
