/**
 * Role Manager - Gestión de roles y permisos en frontend
 * 
 * Este módulo proporciona funciones para verificar roles y permisos
 * del usuario actual en sessionStorage.
 */

class RoleManager {
    
    /**
     * Roles disponibles en el sistema
     */
    static ROLES = {
        ADMIN: 'ADMIN',
        SUPERVISOR: 'SUPERVISOR',
        USER: 'USER',
        VIEWER: 'VIEWER'
    };

    /**
     * Obtiene el rol actual del usuario desde sessionStorage
     * @returns {string} Rol del usuario o 'USER' por defecto
     */
    static getCurrentRole() {
        return sessionStorage.getItem('userRole') || 'USER';
    }

    /**
     * Obtiene el código del usuario actual
     * @returns {string|null} Código del usuario o null
     */
    static getCurrentUserCode() {
        return sessionStorage.getItem('userCode');
    }

    /**
     * Obtiene el nombre del usuario actual
     * @returns {string|null} Nombre del usuario o null
     */
    static getCurrentUserName() {
        return sessionStorage.getItem('userName');
    }

    /**
     * Verifica si el usuario tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {boolean} true si el usuario tiene ese rol
     */
    static hasRole(role) {
        return this.getCurrentRole() === role;
    }

    /**
     * Verifica si el usuario es Admin
     * @returns {boolean}
     */
    static isAdmin() {
        return this.hasRole(this.ROLES.ADMIN);
    }

    /**
     * Verifica si el usuario es Supervisor
     * @returns {boolean}
     */
    static isSupervisor() {
        return this.hasRole(this.ROLES.SUPERVISOR);
    }

    /**
     * Verifica si el usuario es Usuario normal
     * @returns {boolean}
     */
    static isUser() {
        return this.hasRole(this.ROLES.USER);
    }

    /**
     * Verifica si el usuario es Viewer (solo lectura)
     * @returns {boolean}
     */
    static isViewer() {
        return this.hasRole(this.ROLES.VIEWER);
    }

    /**
     * Verifica si el usuario tiene al menos uno de los roles especificados
     * @param {string[]} roles - Array de roles a verificar
     * @returns {boolean} true si tiene al menos uno de los roles
     */
    static hasAnyRole(roles) {
        const currentRole = this.getCurrentRole();
        return roles.includes(currentRole);
    }

    /**
     * Verifica si el usuario puede editar (ADMIN o SUPERVISOR)
     * @returns {boolean}
     */
    static canEdit() {
        return this.hasAnyRole([this.ROLES.ADMIN, this.ROLES.SUPERVISOR]);
    }

    /**
     * Verifica si el usuario puede eliminar (solo ADMIN)
     * @returns {boolean}
     */
    static canDelete() {
        return this.isAdmin();
    }

    /**
     * Verifica si el usuario puede crear (ADMIN o SUPERVISOR)
     * @returns {boolean}
     */
    static canCreate() {
        return this.hasAnyRole([this.ROLES.ADMIN, this.ROLES.SUPERVISOR]);
    }

    /**
     * Muestra/oculta elementos según el rol del usuario
     * @param {string} elementId - ID del elemento HTML
     * @param {string[]} allowedRoles - Roles que pueden ver el elemento
     */
    static toggleElementByRole(elementId, allowedRoles) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (this.hasAnyRole(allowedRoles)) {
            element.style.display = '';
            element.classList.remove('d-none', 'hidden');
        } else {
            element.style.display = 'none';
            element.classList.add('d-none');
        }
    }

    /**
     * Muestra/oculta múltiples elementos según rol
     * @param {Object} elements - Objeto con elementId como key y allowedRoles como value
     * Ejemplo: { 'btnDelete': ['ADMIN'], 'btnEdit': ['ADMIN', 'SUPERVISOR'] }
     */
    static toggleMultipleElements(elements) {
        Object.entries(elements).forEach(([elementId, allowedRoles]) => {
            this.toggleElementByRole(elementId, allowedRoles);
        });
    }

    /**
     * Deshabilita botones según permisos
     * @param {string} elementId - ID del elemento
     * @param {string[]} allowedRoles - Roles permitidos
     */
    static disableElementByRole(elementId, allowedRoles) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (!this.hasAnyRole(allowedRoles)) {
            element.disabled = true;
            element.classList.add('disabled');
            element.title = 'No tienes permisos para esta acción';
        }
    }

    /**
     * Inicializa la UI según el rol del usuario
     * Oculta/muestra elementos automáticamente según atributos data-role
     * 
     * Uso en HTML:
     * <button data-role-required="ADMIN,SUPERVISOR">Editar</button>
     * <div data-role-hide="VIEWER">Solo visible para no-viewers</div>
     */
    static initializeUI() {
        // Elementos que requieren ciertos roles para verse
        document.querySelectorAll('[data-role-required]').forEach(element => {
            const requiredRoles = element.getAttribute('data-role-required').split(',');
            if (!this.hasAnyRole(requiredRoles)) {
                element.style.display = 'none';
                element.classList.add('d-none');
            }
        });

        // Elementos que se ocultan para ciertos roles
        document.querySelectorAll('[data-role-hide]').forEach(element => {
            const hiddenForRoles = element.getAttribute('data-role-hide').split(',');
            if (this.hasAnyRole(hiddenForRoles)) {
                element.style.display = 'none';
                element.classList.add('d-none');
            }
        });

        // Botones que se deshabilitan para ciertos roles
        document.querySelectorAll('[data-role-disable]').forEach(element => {
            const disableForRoles = element.getAttribute('data-role-disable').split(',');
            if (this.hasAnyRole(disableForRoles)) {
                element.disabled = true;
                element.classList.add('disabled');
            }
        });
    }

    /**
     * Obtiene mensaje personalizado según el rol
     * @returns {string}
     */
    static getRoleMessage() {
        const messages = {
            'ADMIN': '👑 Administrador - Acceso total al sistema',
            'SUPERVISOR': '👨‍💼 Supervisor - Gestión y supervisión',
            'USER': '👤 Usuario - Acceso estándar',
            'VIEWER': '👁️ Visualizador - Solo lectura'
        };
        return messages[this.getCurrentRole()] || 'Usuario';
    }

    /**
     * Limpia los datos de rol (usar al hacer logout)
     */
    static clearRoleData() {
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userCode');
        sessionStorage.removeItem('userName');
    }
}

// Hacer disponible globalmente
window.RoleManager = RoleManager;

// Inicializar UI automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RoleManager.initializeUI());
} else {
    RoleManager.initializeUI();
}
