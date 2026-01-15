class AuthService {
    static async login(usuario, password, ubicacion_gps) {
        const url = `${AppConfig.API.BASE_URL}${AppConfig.API.ENDPOINTS.AUTH.LOGIN}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', //  necesario para mantener sesión
            body: JSON.stringify({ usuario, password, ubicacion_gps })
        });
        return await response.json();
    }

    static async validarSesion() {
        const url = `${AppConfig.API.BASE_URL}${AppConfig.API.ENDPOINTS.AUTH.VALIDAR}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        return await response.json();
    }

    static async logout() {
        const url = `${AppConfig.API.BASE_URL}${AppConfig.API.ENDPOINTS.AUTH.LOGOUT}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        return await response.json();
    }

}

window.AuthService = AuthService;
