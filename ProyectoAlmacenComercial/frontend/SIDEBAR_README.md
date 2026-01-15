# Sidebar Colapsable - Documentación

## 📋 Descripción

Sistema de navegación lateral (sidebar) colapsable que se minimiza mostrando solo iconos. El contenido principal se expande automáticamente para ocupar el espacio disponible.

## ✨ Características

- **Colapsable**: Se minimiza a 80px mostrando solo iconos
- **Expansión automática**: El contenido principal se expande al colapsar el sidebar
- **Estado persistente**: Guarda el estado (colapsado/expandido) en localStorage
- **Tooltips**: Muestra el nombre del menú al pasar el mouse sobre los iconos
- **Responsive**: Se adapta a dispositivos móviles
- **Badges**: Soporte para notificaciones en items del menú
- **Rol-based**: Integración con sistema de permisos por rol
- **User info**: Sección de usuario con avatar, nombre y rol

## 🎨 Estados del Sidebar

### Expandido (260px)
```
┌─────────────────────────┐
│  [🎯] Sistema Gestión   │ ← Logo + Texto
├─────────────────────────┤
│  [🏠] Dashboard         │
│  [🎯] Objetivos         │ ← Icono + Texto
│  [✓]  Confirmación   [3]│ ← Con badge
└─────────────────────────┘
```

### Colapsado (80px)
```
┌───────┐
│  [🎯] │ ← Solo icono
├───────┤
│  [🏠] │
│  [🎯] │ ← Solo iconos
│  [✓]  │
└───────┘
   ↓
"Dashboard" ← Tooltip al hover
```

## 📁 Archivos Necesarios

```
frontend/
├── css/
│   └── sidebar-colapsable.css          # Estilos del sidebar
├── js/
│   └── components/
│       └── sidebar-colapsable.js       # Lógica del componente
└── dashboard-con-sidebar.html          # Ejemplo de uso
```

## 🚀 Instalación

### 1. Incluir archivos CSS y JS

```html
<head>
    <!-- CSS necesarios -->
    <link rel="stylesheet" href="css/output.css">
    <link rel="stylesheet" href="assets/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="css/sidebar-colapsable.css">
</head>

<body>
    <!-- Tu contenido -->
    
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="js/components/sidebar-colapsable.js"></script>
</body>
```

### 2. Estructura HTML del Sidebar

```html
<!-- Sidebar -->
<aside id="sidebar" class="sidebar">
    <!-- Toggle Button -->
    <button id="sidebarToggle" class="sidebar-toggle">
        <i class="fas fa-chevron-left"></i>
    </button>

    <!-- Logo -->
    <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
            <i class="fas fa-chart-line"></i>
        </div>
        <span class="sidebar-logo-text">Sistema Gestión</span>
    </div>

    <!-- Menu -->
    <nav class="sidebar-menu">
        <!-- Título de grupo (opcional) -->
        <div class="menu-group-title">Principal</div>
        
        <!-- Items del menú -->
        <a href="dashboard.html" class="menu-item" data-tooltip="Dashboard" data-menu-id="dashboard">
            <span class="menu-item-icon"><i class="fas fa-home"></i></span>
            <span class="menu-item-text">Dashboard</span>
        </a>

        <!-- Item con badge -->
        <a href="confirmacion.html" class="menu-item" data-tooltip="Confirmación" data-menu-id="confirmacion">
            <span class="menu-item-icon"><i class="fas fa-clipboard-check"></i></span>
            <span class="menu-item-text">Confirmación</span>
            <span class="menu-badge">3</span>
        </a>

        <!-- Divisor -->
        <div class="menu-divider"></div>
    </nav>

    <!-- User Section -->
    <div class="sidebar-user">
        <div class="sidebar-user-content">
            <div id="sidebarUserAvatar" class="sidebar-user-avatar">U</div>
            <div class="sidebar-user-info">
                <div id="sidebarUserName" class="sidebar-user-name">Usuario</div>
                <div id="sidebarUserRole" class="sidebar-user-role">Rol</div>
            </div>
            <button id="btnLogout" class="sidebar-user-logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    </div>
</aside>
```

### 3. Estructura del Contenido Principal

```html
<!-- Main Content -->
<main id="mainContent" class="main-content">
    <div class="container mx-auto px-4 py-6">
        <!-- Mobile Menu Toggle -->
        <button id="mobileMenuToggle" class="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg">
            <i class="fas fa-bars text-gray-700"></i>
        </button>

        <!-- Tu contenido aquí -->
        <h1>Dashboard</h1>
        <!-- ... -->
    </div>
</main>
```

## 🎯 Uso de JavaScript

### Inicialización Automática

El componente se inicializa automáticamente cuando el DOM está listo:

```javascript
// No es necesario hacer nada, se inicializa automáticamente
```

### Métodos Disponibles

```javascript
// Acceder a la instancia global
const sidebar = window.sidebarInstance;

// Toggle manual
sidebar.toggle();

// Colapsar
sidebar.collapse();

// Expandir
sidebar.expand();

// Actualizar info del usuario
sidebar.updateUserInfo('Juan Pérez', 'ADMIN');

// Actualizar badge de notificaciones
sidebar.updateBadge('confirmacion', 5);  // Muestra "5"
sidebar.updateBadge('confirmacion', 0);  // Oculta el badge
```

### Eventos

```javascript
// Escuchar cambios en el sidebar
window.addEventListener('sidebarToggle', function(event) {
    const isCollapsed = event.detail.collapsed;
    console.log('Sidebar collapsed:', isCollapsed);
    
    // Aquí puedes ejecutar código cuando el sidebar cambia
    // Por ejemplo, reajustar gráficos, tablas, etc.
});
```

## 🎨 Personalización

### Colores del Sidebar

Editar `sidebar-colapsable.css`:

```css
.sidebar {
    /* Cambiar gradiente de fondo */
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}

.sidebar-logo-icon {
    /* Cambiar color del icono del logo */
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.menu-item.active {
    /* Cambiar color del item activo */
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
}
```

### Ancho del Sidebar

```css
.sidebar {
    width: 260px;  /* Expandido */
}

.sidebar.collapsed {
    width: 80px;   /* Colapsado */
}
```

### Íconos Personalizados

Usa cualquier ícono de Font Awesome:

```html
<a href="#" class="menu-item" data-tooltip="Mi Sección">
    <span class="menu-item-icon"><i class="fas fa-star"></i></span>
    <span class="menu-item-text">Mi Sección</span>
</a>
```

## 📱 Responsive

En móviles (< 768px):
- El sidebar se oculta por defecto
- Aparece un botón hamburguesa para abrirlo
- Se muestra un backdrop oscuro cuando está abierto
- Se cierra automáticamente al seleccionar un item

## 🔐 Integración con Sistema de Roles

Los items del menú pueden tener restricciones por rol:

```html
<!-- Solo visible para ADMIN -->
<a href="#" class="menu-item" data-role-required="ADMIN">
    <span class="menu-item-icon"><i class="fas fa-users"></i></span>
    <span class="menu-item-text">Usuarios</span>
</a>

<!-- Visible para ADMIN y SUPERVISOR -->
<a href="#" class="menu-item" data-role-required="ADMIN,SUPERVISOR">
    <span class="menu-item-icon"><i class="fas fa-cog"></i></span>
    <span class="menu-item-text">Configuración</span>
</a>
```

## 💾 Estado Persistente

El estado del sidebar (colapsado/expandido) se guarda en `localStorage`:

```javascript
// Guardar
localStorage.setItem('sidebarCollapsed', 'true');

// Leer
const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
```

## 📊 Ejemplo Completo

Ver archivo: `dashboard-con-sidebar.html`

## 🐛 Troubleshooting

### El sidebar no se muestra
- Verificar que los archivos CSS estén incluidos
- Verificar que el `id="sidebar"` esté presente

### El toggle no funciona
- Verificar que el JS esté incluido
- Verificar que el botón tenga `id="sidebarToggle"`

### El contenido no se expande
- Verificar que el main tenga `id="mainContent"`
- Verificar que la clase `main-content` esté presente

### Los tooltips no aparecen
- Verificar que los items tengan el atributo `data-tooltip`
- Solo aparecen cuando el sidebar está colapsado

## 📝 Notas

1. **Font Awesome**: Requiere Font Awesome 6+ para los iconos
2. **SweetAlert2**: Usado para el modal de confirmación de logout
3. **Tailwind CSS**: Recomendado pero no obligatorio para el contenido principal
4. **localStorage**: Usado para persistir el estado del sidebar

## 🔄 Actualizaciones Futuras

- [ ] Soporte para sub-menús desplegables
- [ ] Animaciones más suaves
- [ ] Temas claro/oscuro
- [ ] Más opciones de personalización
- [ ] Modo compacto adicional (40px)

---

**Versión**: 1.0.0  
**Autor**: Sistema de Gestión  
**Fecha**: 2024
