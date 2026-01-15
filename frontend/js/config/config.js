const AppConfig = {
    API: {
        BASE_URL: 'http://localhost/ProyectoAlmacenComercial/backend',
        ENDPOINTS: {
            AUTH: {
                LOGIN: '/usuario/login',
                VALIDAR: '/usuario/validarSesion',
                LOGOUT: '/usuario/logout'
            },
        }
    }
};

window.AppConfig = AppConfig;
