# 🧪 Guía de Configuración del Entorno de Pruebas

## 📋 Resumen de Correcciones Implementadas

### ✅ Problema Identificado
El sistema no guardaba ni devolvía el ROL del usuario en la sesión, causando que:
- El rol no se mostrara en la UI
- No se pudieran verificar permisos
- Los cambios de rol en BD no se reflejaran (esto es intencional)

### ✅ Solución Implementada

#### 1. Backend - Repository
**Archivo:** `backend/repositories/UsuarioRepository.php`

**Cambio:**
```php
// ANTES
$sql = "SELECT u.codigo, u.nombre ...

// DESPUÉS  
$sql = "SELECT u.codigo, u.nombre, u.rol ...
```

✅ Ahora el query obtiene el rol de la tabla usuario

#### 2. Backend - Controller
**Archivo:** `backend/controllers/UsuarioController.php`

**Cambio:**
```php
// AGREGADO
$_SESSION['rol'] = $resultado['data']['rol'] ?? 'USER';
```

✅ Guarda el rol en la sesión PHP

#### 3. Backend - API Router
**Archivo:** `backend/routers/api.php`

**Cambio:**
```php
// AGREGADO en validarSesion
'rol' => $_SESSION['rol'] ?? 'USER'
```

✅ Devuelve el rol al validar sesión

#### 4. Frontend - Session Controller
**Archivo:** `frontend/js/controllers/session.controller.js`

**Cambio:**
```javascript
// AGREGADO
sessionStorage.setItem('userCode', usuario.codigo);
sessionStorage.setItem('userName', usuario.nombre);
sessionStorage.setItem('userRole', usuario.rol || 'USER');
```

✅ Guarda el rol en sessionStorage para acceso rápido

#### 5. Nuevo - Role Manager
**Archivo:** `frontend/js/utils/role-manager.js`

✅ Utilidad completa para gestión de roles:
- Verificar permisos
- Mostrar/ocultar elementos según rol
- Métodos helper (isAdmin, canEdit, canDelete, etc.)
- Inicialización automática de UI

#### 6. Nuevo - Test de Roles
**Archivo:** `frontend/test-roles.html`

✅ Página completa de testing:
- Test de login
- Test de validación
- Test de permisos
- Simulación de cambio de rol
- Documentación integrada

#### 7. Nuevo - Documentación
**Archivo:** `ROLES_PERMISOS_README.md`

✅ Documentación completa del sistema

---

## 🚀 Configurar Entorno de Pruebas

### Opción 1: Servidor PHP Local (Recomendado)

#### Requisitos
- PHP 7.4 o superior
- Extensiones: PDO, pdo_mysql
- MySQL/MariaDB

#### Instalación de PHP

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install php php-cli php-pdo php-mysql
```

**macOS (con Homebrew):**
```bash
brew install php
```

**Windows:**
- Descargar PHP desde https://windows.php.net/download/
- O instalar XAMPP: https://www.apachefriends.org/

#### Configuración

1. **Clonar el repositorio:**
```bash
git clone https://github.com/Cesar925/ProyectoAlmacenComercial.git
cd ProyectoAlmacenComercial
git checkout tes
```

2. **Configurar base de datos:**

Editar `backend/config/database.php`:
```php
<?php
class Database {
    private $host = 'localhost';        // Tu host
    private $db_name = 'tu_database';   // Tu base de datos
    private $username = 'tu_usuario';   // Tu usuario
    private $password = 'tu_password';  // Tu contraseña
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
```

3. **Verificar estructura de BD:**

Asegúrate de que la tabla `usuario` tenga la columna `rol`:
```sql
-- Verificar estructura
DESCRIBE usuario;

-- Si no existe la columna, agregarla
ALTER TABLE usuario ADD COLUMN rol VARCHAR(50) DEFAULT 'USER';

-- Actualizar algunos usuarios de prueba
UPDATE usuario SET rol = 'ADMIN' WHERE codigo = 'admin';
UPDATE usuario SET rol = 'SUPERVISOR' WHERE codigo LIKE 'sup%';
UPDATE usuario SET rol = 'USER' WHERE rol IS NULL;
```

4. **Iniciar servidor de desarrollo:**

```bash
# Desde el directorio raíz del proyecto
php -S localhost:8000 -t .
```

5. **Probar la aplicación:**

- **Login:** http://localhost:8000/frontend/login.html
- **Test de Roles:** http://localhost:8000/frontend/test-roles.html
- **Dashboard:** http://localhost:8000/frontend/dashboard.html

### Opción 2: Con Apache/Nginx

#### Apache

1. Configurar VirtualHost:
```apache
<VirtualHost *:80>
    ServerName proyecto-almacen.local
    DocumentRoot /ruta/a/ProyectoAlmacenComercial
    
    <Directory /ruta/a/ProyectoAlmacenComercial>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/proyecto-almacen-error.log
    CustomLog ${APACHE_LOG_DIR}/proyecto-almacen-access.log combined
</VirtualHost>
```

2. Habilitar módulos necesarios:
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

3. Agregar a `/etc/hosts`:
```
127.0.0.1    proyecto-almacen.local
```

#### Nginx

1. Configurar sitio:
```nginx
server {
    listen 80;
    server_name proyecto-almacen.local;
    root /ruta/a/ProyectoAlmacenComercial;
    
    index index.html index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## 🧪 Guía de Pruebas

### Test 1: Verificar Login con Rol

1. Abre: `http://localhost:8000/frontend/test-roles.html`
2. Ingresa credenciales de prueba
3. Haz clic en "Probar Login"
4. **Resultado esperado:**
   - ✅ Login exitoso
   - ✅ Muestra código, nombre y **ROL**
   - ✅ El badge del rol tiene el color correcto

### Test 2: Verificar Sesión

1. Después del login, haz clic en "Validar Sesión Actual"
2. **Resultado esperado:**
   - ✅ Sesión válida
   - ✅ Muestra todos los datos incluyendo **ROL**

### Test 3: Verificar Permisos

1. Haz clic en "Verificar Permisos"
2. **Resultado esperado según tu rol:**

**Si eres ADMIN:**
- ✅ Es Admin: true
- ✅ Puede Crear: true
- ✅ Puede Editar: true
- ✅ Puede Eliminar: true

**Si eres SUPERVISOR:**
- ❌ Es Admin: false
- ✅ Es Supervisor: true
- ✅ Puede Crear: true
- ✅ Puede Editar: true
- ❌ Puede Eliminar: false

**Si eres USER:**
- ❌ Es Admin: false
- ❌ Es Supervisor: false
- ✅ Es User: true
- ❌ Puede Crear: false
- ❌ Puede Editar: false
- ❌ Puede Eliminar: false

### Test 4: UI según Rol

Observa los botones en la sección "Test 4":

**ADMIN ve:**
- ✅ Botón solo para ADMIN (rojo)
- ✅ Botón para ADMIN y SUPERVISOR (amarillo)
- ✅ Oculto para VIEWER (verde)
- ✅ Deshabilitado para VIEWER (gris, habilitado)

**SUPERVISOR ve:**
- ❌ Botón solo para ADMIN (oculto)
- ✅ Botón para ADMIN y SUPERVISOR (amarillo)
- ✅ Oculto para VIEWER (verde)
- ✅ Deshabilitado para VIEWER (gris, habilitado)

**USER ve:**
- ❌ Botón solo para ADMIN (oculto)
- ❌ Botón para ADMIN y SUPERVISOR (oculto)
- ✅ Oculto para VIEWER (verde)
- ✅ Deshabilitado para VIEWER (gris, habilitado)

**VIEWER ve:**
- ❌ Botón solo para ADMIN (oculto)
- ❌ Botón para ADMIN y SUPERVISOR (oculto)
- ❌ Oculto para VIEWER (oculto)
- ✅ Deshabilitado para VIEWER (gris, deshabilitado)

### Test 5: Simular Cambio de Rol

1. Haz clic en "Simular Cambio de Rol"
2. Lee la explicación del comportamiento
3. **Para probar realmente:**
   ```sql
   -- En MySQL
   UPDATE usuario SET rol = 'ADMIN' WHERE codigo = 'TU_USUARIO';
   ```
4. Refresca la página (F5)
5. Haz clic en "Validar Sesión"
6. **Resultado:** Sigues viendo el rol anterior
7. Haz clic en "Cerrar Sesión"
8. Vuelve a hacer login
9. **Resultado:** Ahora ves el nuevo rol ✅

### Test 6: Logout

1. Haz clic en "Cerrar Sesión"
2. **Resultado esperado:**
   - ✅ Sesión cerrada correctamente
   - ✅ Los datos del usuario desaparecen

---

## 🔧 Debugging

### Backend (PHP)

**Ver sesiones activas:**
```php
// Agregar al inicio de api.php temporalmente
session_start();
error_log(print_r($_SESSION, true));
```

**Ver logs:**
```bash
# Linux/Mac
tail -f /var/log/apache2/error.log
# O
tail -f /var/log/php-fpm/error.log

# Con PHP built-in server
# Los errores aparecen en la terminal
```

### Frontend (JavaScript)

**Consola del navegador:**
```javascript
// Ver sessionStorage
console.log('User Role:', sessionStorage.getItem('userRole'));
console.log('User Code:', sessionStorage.getItem('userCode'));
console.log('User Name:', sessionStorage.getItem('userName'));

// Probar RoleManager
console.log('Current Role:', RoleManager.getCurrentRole());
console.log('Is Admin:', RoleManager.isAdmin());
console.log('Can Edit:', RoleManager.canEdit());

// Validar sesión manualmente
AuthService.validarSesion().then(r => console.log(r));
```

### Base de Datos

**Verificar usuarios y roles:**
```sql
SELECT codigo, nombre, rol 
FROM usuario 
ORDER BY rol, nombre;
```

**Ver usuarios sin rol:**
```sql
SELECT codigo, nombre, rol 
FROM usuario 
WHERE rol IS NULL OR rol = '';
```

---

## 📦 Archivos Modificados/Creados

### ✏️ Modificados
1. `backend/repositories/UsuarioRepository.php`
2. `backend/controllers/UsuarioController.php`
3. `backend/routers/api.php`
4. `frontend/js/controllers/session.controller.js`

### ✨ Nuevos
1. `ROLES_PERMISOS_README.md` - Documentación completa
2. `frontend/js/utils/role-manager.js` - Utilidad de gestión de roles
3. `frontend/test-roles.html` - Página de testing
4. `ENTORNO_PRUEBAS.md` - Esta guía

---

## 🎯 Checklist de Deployment a Producción

- [ ] Actualizar `backend/config/database.php` con credenciales de producción
- [ ] Ejecutar migración para agregar columna `rol` si no existe
- [ ] Actualizar roles de usuarios existentes
- [ ] Verificar permisos de archivos (backend debe ser escribible para sesiones)
- [ ] Configurar CORS correctamente
- [ ] Habilitar HTTPS en producción
- [ ] Configurar sesiones PHP seguras (httponly, secure flags)
- [ ] Probar login con diferentes roles
- [ ] Verificar que los permisos UI funcionen correctamente
- [ ] Documentar roles disponibles para administradores

---

## 🤝 Soporte

Si encuentras problemas:

1. **Revisar logs** de PHP y servidor web
2. **Verificar** estructura de BD (columna `rol` debe existir)
3. **Comprobar** configuración de sesiones PHP
4. **Usar** `test-roles.html` para debugging
5. **Revisar** consola del navegador (Network tab)

---

**Última actualización:** 2026-01-08  
**Versión:** 1.0  
**Autor:** GenSpark AI Developer
