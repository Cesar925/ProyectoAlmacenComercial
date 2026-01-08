// Session Controller - Gestión de sesión y autenticación
document.addEventListener('DOMContentLoaded', async function() {
    // Validar sesión al cargar
    try {
        const sesion = await AuthService.validarSesion();
        if (!sesion.success) {
            window.location.href = 'login.html';
            return;
        }
        
        // Cargar datos del usuario si existen
        const usuario = sesion.data;
        if (usuario) {
            const userNameElem = document.getElementById('userName');
            const rolUserElem = document.getElementById('rolUser');
            
            if (userNameElem) userNameElem.textContent = usuario.nombre || 'Usuario';
            if (rolUserElem) rolUserElem.textContent = usuario.rol || 'Usuario';
        }
    } catch (error) {
        console.error('Error validando sesión:', error);
        window.location.href = 'login.html';
    }

    // Event listener para cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                try {
                    await AuthService.logout();
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Intente nuevamente.');
                }
            }
        });
    }
});
