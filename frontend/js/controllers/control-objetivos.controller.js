class ControlObjetivosController {
    constructor() {
        this.service = new ControlObjetivosService();
        this.config = window.ControlObjetivosConfig;
        this.datos = [];
        this.registroSeleccionado = null;
        this.objetivoActual = null;
        this.tareasActuales = [];
        this.granjasDisponibles = [];
        this.pilotoActual = null;

        // Inicializar sub-controladores
        this.modal = new ModalController(this);
        this.table = new TableController(this);
        this.task = new TaskController(this);
        this.form = new FormController(this);
        this.filter = new FilterController(this);
    }

    async init() {
        this.setupEventListeners();
        this.setupToggleFiltros();
        this.setupColumnToggle();
        this.setupTableEventListeners();
        await this.cargarGranjas();
        await this.cargarDatos();
    }

    setupEventListeners() {
        const events = {
            'btnNuevo': () => this.modal.mostrarNuevo(),
            'btnExportar': () => this.exportarExcel(),
            'btnLimpiarFiltros': () => this.filter.limpiar(),
            'btnAplicarFiltros': () => this.filter.aplicar(),
            'btnCancelar': () => this.modal.cerrarObjetivo(),
            'btnCerrarSubprocesos': () => this.modal.cerrarSubprocesos(),
            'btnNuevaTarea': () => this.task.mostrarModalNueva(),
            'btnCancelarTarea': () => this.modal.cerrarTarea(),
            'btnCerrarTarea': () => this.modal.cerrarTarea()
        };

        Object.entries(events).forEach(([id, handler]) => {
            document.getElementById(id)?.addEventListener('click', handler);
        });

        document.getElementById('formObjetivo')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.form.guardar();
        });

        document.getElementById('formTarea')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.task.guardar();
        });

        ['tareaFechaInicio', 'tareaFechaFin'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.task.calcularDuracion());
        });

        document.getElementById('tareaTipo')?.addEventListener('change', () => this.task.onTipoChange());
    }

    setupTableEventListeners() {
        const tbody = document.getElementById('tbodyObjetivos');
        if (!tbody) return;

        tbody.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            e.preventDefault();
            e.stopPropagation();

            const { action, id, piloto } = button.dataset;
            const actions = {
                'ver-tareas': () => this.task.abrir(piloto, id),
                'ver-tareas-obj': () => this.task.abrir(piloto, id),
                'ver-tareas-meta': () => this.task.abrir(piloto, id),
                'editar': () => this.form.editar(piloto),
                'eliminar': () => this.form.eliminar(id, piloto)
            };

            actions[action]?.();
        });
    }

    setupToggleFiltros() {
        const btnToggle = document.getElementById('btnToggleFiltros');
        const filterContent = document.getElementById('filterContent');
        if (!btnToggle || !filterContent) return;

        btnToggle.addEventListener('click', () => {
            const isOpen = filterContent.classList.toggle('show');
            const icon = btnToggle.querySelector('i');
            icon.classList.toggle('fa-chevron-up', isOpen);
            icon.classList.toggle('fa-chevron-down', !isOpen);
        });
    }

    setupColumnToggle() {
        const btnToggle = document.getElementById('btnToggleColumns');
        const dropdown = document.getElementById('columnDropdown');

        btnToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!btnToggle?.contains(e.target)) {
                dropdown?.classList.remove('show');
            }
        });

        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const column = e.target.dataset.column;
                document.querySelectorAll(`[data-column="${column}"]`).forEach(el => {
                    el.style.display = e.target.checked ? '' : 'none';
                });
            });
        });
    }

    async cargarDatos() {
        try {
            this.mostrarCargando(true);
            const response = await this.service.getAll();
            this.datos = response.data || response || [];
            this.table.renderizar();
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.CARGAR, 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }

    async cargarGranjas() {
        try {
            const response = await fetch(`${this.config.API.BASE_URL}/api.php/granjas`);
            if (!response.ok) throw new Error('Error al cargar granjas');
            
            this.granjasDisponibles = await response.json();
        } catch (error) {
            console.error('Error al cargar granjas:', error);
            this.mostrarNotificacion('Error al cargar granjas', 'error');
        }
    }

    poblarSelectGranjas(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '<option value="">-- Seleccione granja --</option>';
        
        this.granjasDisponibles.forEach(granja => {
            const option = document.createElement('option');
            option.value = granja.codigo;
            option.textContent = `${granja.codigo} - ${granja.nombre}`;
            option.dataset.nombre = granja.nombre;
            selectElement.appendChild(option);
        });
    }

    async cargarGalponesParaSelect(granjaSelect) {
        const codigoGranja = granjaSelect.value;
        const galponSelect = granjaSelect.closest('.granja-galpon-item').querySelector('.galpon-select');
        
        if (!codigoGranja) {
            galponSelect.innerHTML = '<option value="">-- Seleccione granja primero --</option>';
            return;
        }

        try {
            galponSelect.innerHTML = '<option value="">Cargando...</option>';
            
            const response = await fetch(`${this.config.API.BASE_URL}/api.php/galpones/${codigoGranja}`);
            if (!response.ok) throw new Error('Error al cargar galpones');
            
            const galpones = await response.json();
            
            galponSelect.innerHTML = '<option value="">-- Seleccione galpón --</option>';
            
            galpones.forEach(galpon => {
                const option = document.createElement('option');
                option.value = galpon.tcodint;
                option.textContent = `${galpon.tcodint} - ${galpon.tnomcen}`;
                option.dataset.nombre = galpon.tnomcen;
                galponSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error cargando galpones:', error);
            galponSelect.innerHTML = '<option value="">Error cargando galpones</option>';
            this.mostrarNotificacion('Error al cargar galpones', 'error');
        }
    }

    editarTarea(idTarea) { this.task.editar(idTarea); }
    eliminarTarea(idTarea) { this.task.eliminar(idTarea); }

    mostrarCargando(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarNotificacion(mensaje, tipo = 'success') {
        const contenedor = document.getElementById('notificationContainer') || this.crearContenedorNotificaciones();
        
        const notificacion = document.createElement('div');
        notificacion.className = `notification notification-${tipo} transform transition-all duration-300 translate-x-full`;
        notificacion.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        contenedor.appendChild(notificacion);
        
        setTimeout(() => notificacion.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notificacion.classList.add('translate-x-full');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    crearContenedorNotificaciones() {
        const contenedor = document.createElement('div');
        contenedor.id = 'notificationContainer';
        contenedor.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(contenedor);
        return contenedor;
    }

    exportarExcel() {
        console.log('Exportar a Excel - Funcionalidad pendiente');
        this.mostrarNotificacion('Exportación a Excel en desarrollo', 'info');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.controller = new ControlObjetivosController();
    window.controller.init();
});
