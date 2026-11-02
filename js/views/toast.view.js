// js/views/toast.view.js
export const showToast = (mensaje) => {
    let contenedor = document.getElementById('toastContenedor');
    
    // Si no existe en el HTML, lo creamos dinámicamente
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toastContenedor';
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = mensaje;
    
    contenedor.appendChild(toast);

    // Animación de entrada
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);

    // Ocultar y eliminar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
};