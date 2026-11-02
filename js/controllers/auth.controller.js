import { showToast } from '../views/toast.view.js';
import { actualizarSesionCuenta, limpiarSesionLocal, getUsuarioActual } from '../models/cuenta-sync.js';

export const initAuth = () => {
    const modal = document.getElementById('modalAuth');
    const btnAbrir = document.getElementById('btnAbrirAuth');
    const btnCerrar = document.getElementById('cerrarAuth');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const textoUsuarioHeader = document.getElementById('textoUsuarioHeader');

    const cerrarModal = () => {
        if (modal) modal.classList.remove('activo');
        document.body.classList.remove('modal-abierto');
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('sesion') === 'cerrada') {
        showToast('Sesión cerrada correctamente.');
        params.delete('sesion');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash);
    }

    if (btnAbrir) btnAbrir.addEventListener('click', async (e) => {
        e.preventDefault();
        const user = getUsuarioActual();
        if (user) {
            if (!confirm(`¿Deseas cerrar la sesión de ${user.nombre}?`)) return;
            try {
                const response = await fetch('backend/logout.php', {method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json'}});
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo cerrar la sesión.');
                limpiarSesionLocal();
                showToast(data.message || 'Sesión cerrada correctamente.');
            } catch (error) { showToast(error.message || 'No se pudo conectar para cerrar la sesión.'); }
        } else if (modal) {
            modal.classList.add('activo');
            document.body.classList.add('modal-abierto');
        }
    });

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

    if (tabLogin && tabRegistro && formLogin && formRegistro) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('activo'); tabRegistro.classList.remove('activo');
            formLogin.classList.add('activo'); formRegistro.classList.remove('activo');
        });
        tabRegistro.addEventListener('click', () => {
            tabRegistro.classList.add('activo'); tabLogin.classList.remove('activo');
            formRegistro.classList.add('activo'); formLogin.classList.remove('activo');
        });
    }

    if (formLogin) formLogin.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submit = formLogin.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const response = await fetch('backend/login.php', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email,password})});
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo iniciar sesión.');
            await actualizarSesionCuenta({fusionarLocal:true});
            showToast(data.message || 'Sesión iniciada correctamente.');
            cerrarModal();
            formLogin.reset();
        } catch (error) { showToast(error.message || 'Error de conexión con el servidor local.'); }
        finally { if (submit) submit.disabled = false; }
    });

    if (formRegistro) formRegistro.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            nombre: document.getElementById('regNombre').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            password: document.getElementById('regPassword').value,
            telefono: document.getElementById('regTelefono')?.value.trim() || '',
            direccion: document.getElementById('regDireccion')?.value.trim() || '',
            distrito: document.getElementById('regDistrito')?.value || ''
        };
        try {
            const response = await fetch('backend/registro.php', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo completar el registro.');
            showToast(data.message || 'Registro exitoso. Ya puedes iniciar sesión.');
            if (tabLogin) tabLogin.click();
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) loginEmail.value = payload.email;
            formRegistro.reset();
        } catch (error) { showToast(error.message || 'Error de conexión con el servidor local.'); }
    });
};
