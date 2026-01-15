// Configuración para Control de Objetivos
window.ControlObjetivosConfig = {
    API: {
        //BASE_URL: 'https://granjarinconadadelsur.com/proyectos/backend',
        BASE_URL: 'http://localhost/ProyectoAlmacenComercial/backend',
        ENDPOINTS: {
            ALL: '/controlobjetivos/all',
            CREAR: '/controlobjetivos/crear',
            ACTUALIZAR: '/controlobjetivos/actualizar',
            ELIMINAR: '/controlobjetivos/borrar',
            FILTRO: '/controlobjetivos/filtro',
            SUBPROCESOS: '/controlobjetivos/{id}/subprocesos',
            SUBPROCESO_CREAR: '/subprocesos/crear',
            SUBPROCESO_ACTUALIZAR: '/subprocesos/actualizar',
            SUBPROCESO_ELIMINAR: '/subprocesos/borrar'
        }
    },
    ESTADOS: ['Pendiente', 'En Proceso', 'Completado'],
    MENSAJES: {
        EXITO: {
            GUARDADO: '✓ Objetivo guardado exitosamente',
            ACTUALIZADO: '✓ Objetivo actualizado exitosamente',
            ELIMINADO: '✓ Objetivo eliminado exitosamente',
            TAREA_GUARDADA: '✓ Tarea guardada exitosamente',
            TAREA_ELIMINADA: '✓ Tarea eliminada exitosamente'
        },
        ERROR: {
            CARGAR_DATOS: 'Error al cargar los datos',
            GUARDAR: 'Error al guardar el objetivo',
            ELIMINAR: 'Error al eliminar el objetivo',
            CONEXION: 'Error de conexión con el servidor'
        },
        CONFIRMACION: {
            ELIMINAR: '¿Estás seguro de eliminar este objetivo?\n\nSe eliminarán también todas las tareas asociadas.\nEsta acción no se puede deshacer.',
            ELIMINAR_TAREA: '¿Estás seguro de eliminar esta tarea?'
        }
    }
};
