/**
 * SidebarColapsable - Componente para sidebar colapsable
 * Permite minimizar el sidebar mostrando solo iconos
 */
class SidebarColapsable {
    constructor() {
        this.sidebar = null;
        this.mainContent = null;
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.init();
    }

    init() {
        // Buscar elementos del DOM
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('mainContent');
        
        if (!this.sidebar) {
            console.warn('Sidebar element not found');
            return;
        }

        // Aplicar estado inicial
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
            if (this.mainContent) {
                this.mainContent.classList.add('expanded');
            }
        }

        // Event listeners
        this.attachEventListeners();
        
        // Marcar item activo según la URL
        this.markActiveMenuItem();
        
        // Mobile menu
        this.setupMobileMenu();
    }

    attachEventListeners() {
        // Toggle button
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // No prevenir default para que la navegación funcione
                this.setActiveMenuItem(item);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    toggle() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
            if (this.mainContent) {
                this.mainContent.classList.add('expanded');
            }
        } else {
            this.sidebar.classList.remove('collapsed');
            if (this.mainContent) {
                this.mainContent.classList.remove('expanded');
            }
        }

        // Guardar estado en localStorage
        localStorage.setItem('sidebarCollapsed', this.isCollapsed);

        // Disparar evento para que otros componentes puedan reaccionar
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
            detail: { collapsed: this.isCollapsed }
        }));
    }

    collapse() {
        if (!this.isCollapsed) {
            this.toggle();
        }
    }

    expand() {
        if (this.isCollapsed) {
            this.toggle();
        }
    }

    markActiveMenuItem() {
        const currentPath = window.location.pathname;
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('?')[0])) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setActiveMenuItem(clickedItem) {
        // Remover active de todos
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Agregar active al clickeado
        clickedItem.classList.add('active');
    }

    setupMobileMenu() {
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.id = 'sidebarBackdrop';
        document.body.appendChild(backdrop);

        // Mobile toggle (puede ser un botón hamburguesa en el header)
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('show');
                backdrop.classList.toggle('show');
            });
        }

        // Cerrar al hacer click en backdrop
        backdrop.addEventListener('click', () => {
            this.sidebar.classList.remove('show');
            backdrop.classList.remove('show');
        });

        // Cerrar al seleccionar un item en mobile
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.sidebar.classList.remove('show');
                    backdrop.classList.remove('show');
                });
            });
        }
    }

    async logout() {
        try {
            // Confirmar logout
            const confirmLogout = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que deseas cerrar sesión?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280'
            });

            if (confirmLogout.isConfirmed) {
                // Llamar al servicio de logout si existe
                if (typeof AuthService !== 'undefined') {
                    await AuthService.logout();
                }

                // Limpiar storage
                sessionStorage.clear();
                localStorage.removeItem('userCode');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');

                // Redirigir al login
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al cerrar sesión',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Método para actualizar info del usuario
    updateUserInfo(userName, userRole) {
        const nameElement = document.getElementById('sidebarUserName');
        const roleElement = document.getElementById('sidebarUserRole');
        const avatarElement = document.getElementById('sidebarUserAvatar');

        if (nameElement) nameElement.textContent = userName;
        if (roleElement) roleElement.textContent = userRole;
        if (avatarElement && userName) {
            // Mostrar iniciales
            const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatarElement.textContent = initials;
        }
    }

    // Método para actualizar badges de notificaciones
    updateBadge(menuItemId, count) {
        const menuItem = document.querySelector(`[data-menu-id="${menuItemId}"]`);
        if (menuItem) {
            let badge = menuItem.querySelector('.menu-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'menu-badge';
                    menuItem.appendChild(badge);
                }
                badge.textContent = count;
            } else if (badge) {
                badge.remove();
            }
        }
    }
}

// Inicializar sidebar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.sidebarInstance = new SidebarColapsable();
    
    // Si hay información de usuario en sessionStorage, actualizar
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');
    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    
    if (userName && window.sidebarInstance) {
        window.sidebarInstance.updateUserInfo(userName, userRole || 'Usuario');
    }
});

// Exponer globalmente
window.SidebarColapsable = SidebarColapsable;
