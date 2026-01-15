// Helper para SweetAlert2 - Agregar al inicio del controlador

const Swal = window.Swal;

// Configuración global de SweetAlert2
const SwalConfig = {
    position: 'top-start',
    toast: true,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
};

// Funciones helper para notificaciones
const showSuccess = (message) => {
    Swal.fire({
        ...SwalConfig,
        icon: 'success',
        title: message
    });
};

const showError = (message) => {
    Swal.fire({
        ...SwalConfig,
        icon: 'error',
        title: message
    });
};

const showWarning = (message) => {
    Swal.fire({
        ...SwalConfig,
        icon: 'warning',
        title: message
    });
};

const showConfirm = async (title, text) => {
    try {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: false, // Evita cerrar clickeando fuera
            allowEscapeKey: false,    // Evita cerrar con ESC
            reverseButtons: false,    // Botón confirmar a la izquierda
            focusCancel: false,       // Focus en confirmar por defecto
            backdrop: true
        });
        
        console.log('🔍 SweetAlert resultado completo:', result);
        console.log('🔍 isConfirmed:', result.isConfirmed);
        console.log('🔍 isDenied:', result.isDenied);
        console.log('🔍 isDismissed:', result.isDismissed);
        
        // Solo retorna true si explícitamente presionó "Sí, confirmar"
        return result.isConfirmed === true;
    } catch (error) {
        console.error('❌ Error en SweetAlert confirmación:', error);
        return false; // En caso de error, no confirmar
    }
};

window.SwalHelpers = { showSuccess, showError, showWarning, showConfirm };
