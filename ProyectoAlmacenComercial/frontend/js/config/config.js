const AppConfig = {
    API: {
        //BASE_URL: 'https://granjarinconadadelsur.com/proyectos/backend',
        //BASE_URL: 'http://localhost/ProyectoAlmacenComercial/backend',
        // Usar ruta relativa para que funcione en cualquier entorno
        BASE_URL: '../backend',
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
