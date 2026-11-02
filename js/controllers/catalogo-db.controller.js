import { globalCart } from '../models/cart.model.js';
import { showToast } from '../views/toast.view.js';

const destinos = {
  'celulares': document.querySelector('#celulares .grid'),
  'audio y wearables': document.querySelector('#audio .grid'),
  'hogar': document.querySelector('#hogar .grid'),
  'accesorios': document.querySelector('#accesorios .grid')
};
const normalizar = (s='') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const urlImagen = (valor='') => {
  let url = String(valor || '').trim().replace(/^['\"]|['\"]$/g, '');
  if (!url) return '';
  if (url.startsWith('//')) return window.location.protocol + url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(data:|javascript:|vbscript:)/i.test(url)) return '';
  return new URL(url.replace(/^\.\//, ''), document.baseURI).href;
};
const escapar = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function tarjeta(p, imagenOriginal='') {
  const imagen = urlImagen(p.imagen) || urlImagen(imagenOriginal) || 'https://placehold.co/600x600?text=Xiaomi+Store';
  const respaldo = urlImagen(imagenOriginal);
  const precio = Number(p.precio).toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 2});
  const sinStock = Number(p.stock) < 1;
  return `<article class="card" data-product-id="${Number(p.id)}">
    <img src="${escapar(imagen)}" data-fallback="${escapar(respaldo)}" alt="${escapar(p.nombre)}" loading="lazy" onerror="if(this.dataset.fallback && this.dataset.fallback!==this.src){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.onerror=null;this.src='https://placehold.co/600x600?text=Producto';}">
    <div class="info"><h3>${escapar(p.nombre)}</h3><p class="desc">${escapar(p.descripcion || 'Consulta más detalles de este producto.')}</p>
    <div class="precio">S/ ${precio}</div><small class="rating-producto">${Number(p.total_resenas)>0 ? `★ ${Number(p.promedio_resenas).toFixed(1)} (${Number(p.total_resenas)} reseñas)` : 'Sin reseñas aún'}</small><small class="stock-producto">${sinStock ? 'Agotado' : `Stock: ${Number(p.stock)}`}</small>
    <div class="acciones-producto"><button type="button" class="btn btn-carrito" ${sinStock?'disabled':''}>${sinStock?'Agotado':'Agregar al carrito 🛒'}</button>
    <div class="fila-secundaria"><button type="button" class="btn btn-consultar-wsp" aria-label="Consultar este producto por WhatsApp">Consultar</button><button type="button" class="btn btn-favorito" aria-label="Agregar a favoritos">❤️</button></div></div></div></article>`;
}

export async function initCatalogoDB(reiniciarDetalle) {
  try {
    const response = await fetch('backend/obtener_productos.php', {credentials:'same-origin'});
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.products)) return;
    // Conserva la imagen original del HTML si una fila de MySQL tiene el campo imagen vacío
    // o si el servidor remoto rechaza la carga del enlace guardado.
    const imagenesOriginales = new Map();
    document.querySelectorAll('.card').forEach(card => {
      const nombre = normalizar(card.querySelector('h3')?.textContent || '');
      const src = card.querySelector('img')?.getAttribute('src') || '';
      if (nombre && src) imagenesOriginales.set(nombre, src);
    });
    const grupos = {'celulares':[], 'audio y wearables':[], 'hogar':[], 'accesorios':[]};
    data.products.forEach(p => {
      const categoria = normalizar(p.categoria);
      if (categoria.includes('celular')) grupos.celulares.push(p);
      else if (categoria.includes('audio') || categoria.includes('wearable')) grupos['audio y wearables'].push(p);
      else if (categoria.includes('hogar')) grupos.hogar.push(p);
      else grupos.accesorios.push(p);
    });
    Object.entries(destinos).forEach(([categoria, contenedor]) => {
      if (contenedor) contenedor.innerHTML = grupos[categoria].map(p => tarjeta(p, imagenesOriginales.get(normalizar(p.nombre)) || '')).join('') || '<p class="catalogo-vacio">Próximamente nuevos productos.</p>';
    });
    if (typeof reiniciarDetalle === 'function') reiniciarDetalle();
  } catch (error) {
    // Si la base de datos no está disponible, se conserva el catálogo HTML original.
    console.warn('No se pudo actualizar el catálogo desde la base de datos:', error);
  }

  document.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card || !card.dataset.productId) return;
    const name = card.querySelector('h3')?.textContent || '';
    const priceText = card.querySelector('.precio')?.textContent || 'S/ 0';
    const image = card.querySelector('img')?.src || '';
    if (e.target.closest('.btn-carrito')) {
      e.preventDefault(); e.stopPropagation();
      const price = Number(priceText.replace('S/','').replace(/,/g,'').trim());
      globalCart.addItem({id: Number(card.dataset.productId), name, price, image});
      const count = document.getElementById('cartCount');
      if (count) count.textContent = globalCart.getItems().reduce((sum,item)=>sum+item.quantity,0);
      showToast(`Agregado al carrito: ${name}`);
    }
    if (e.target.closest('.btn-consultar-wsp')) {
      e.preventDefault(); e.stopPropagation();
      const message = `¡Hola Mi Store Arequipa! Tengo una consulta sobre ${name}, precio ${priceText}. ¿Tienen disponibilidad?`;
      window.open(`https://wa.me/51927248132?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    }
  }, true);
}
