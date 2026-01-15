document.addEventListener('DOMContentLoaded', function() {
	const loginForm = document.getElementById('loginForm');
	const errorMessage = document.getElementById('errorMessage');
	const loading = document.getElementById('loading');
	const togglePassword = document.getElementById('togglePassword');
	const passwordInput = document.getElementById('password');

	// Mostrar / ocultar contraseña
	if (togglePassword && passwordInput) {
		togglePassword.addEventListener('click', function() {
			const type = passwordInput.type === 'password' ? 'text' : 'password';
			passwordInput.type = type;
			togglePassword.innerHTML = type === 'password'
				? '<i class="fas fa-eye"></i>'
				: '<i class="fas fa-eye-slash"></i>';
		});
	}

	// Manejar envío del formulario
	if (loginForm) {
		loginForm.addEventListener('submit', async function(e) {
			e.preventDefault();
			errorMessage?.classList.add('hidden');

			const usuario = document.getElementById('usuario').value.trim();
			const password = document.getElementById('password').value.trim();
			const ubicacion = await obtenerUbicacion();
			try {
				if (loading) loading.style.display = 'flex';

				const data = await AuthService.login(usuario, password, ubicacion);

				if (data && data.success) {
					sessionStorage.setItem('usuario', JSON.stringify(data.data));
					window.location.href = 'index.html';
				} else {
					errorMessage?.classList.remove('hidden');
				}
			} catch (error) {
				console.error('Error:', error);
				errorMessage?.classList.remove('hidden');
			} finally {
				if (loading) loading.style.display = 'none';
			}
		});
	}
});
document.addEventListener("DOMContentLoaded", async () => {
    const usuario = sessionStorage.getItem('usuario');
    // Solo redirigir si hay usuario con rol definido
    if (usuario) {
        try {
            const usuarioObj = JSON.parse(usuario);
            if (usuarioObj.rol) {
                const sesion = await AuthService.validarSesion();
                if (sesion.success) {
                    window.location.href = "index.html";
                }
            }
        } catch (e) {
            // Si hay error, permitir que el usuario reintente login
        }
    }
});

function obtenerUbicacion() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            pos => {
                resolve(`${pos.coords.latitude},${pos.coords.longitude}`);
            },
            err => {
                resolve(null); // Usuario negó permiso o error
            }
        );
    });
}

