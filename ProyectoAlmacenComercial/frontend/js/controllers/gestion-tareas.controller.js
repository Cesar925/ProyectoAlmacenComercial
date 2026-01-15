/**
 * Controlador para la Página de Gestión de Tareas
 * Versión independiente (no modal) para gestión completa de tareas de un objetivo
 */

class GestionTareasController {
    constructor() {
        this.service = new ControlObjetivosService();
        this.objetivoActual = null;
        this.tareasActuales = [];
        this.tareaEditando = null;
        
        this.init();
    }

    init() {
        // Obtener ID del objetivo desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const objetivoId = urlParams.get('objetivo');
        const piloto = urlParams.get('piloto');

        if (!objetivoId) {
            this.mostrarNotificacion('No se especificó un objetivo', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard-control-objetivos.html';
            }, 2000);
            return;
        }

        this.cargarObjetivo(objetivoId, piloto);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btnNuevaTarea')?.addEventListener('click', () => this.mostrarModalNuevaTarea());
        document.getElementById('btnActualizar')?.addEventListener('click', () => this.cargarTareas());

        // Modal de tarea
        document.getElementById('btnCerrarTarea')?.addEventListener('click', () => this.cerrarModalTarea());
        document.getElementById('btnCancelarTarea')?.addEventListener('click', () => this.cerrarModalTarea());
        document.getElementById('formTarea')?.addEventListener('submit', (e) => this.guardarTarea(e));

        // Tipo de tarea
        document.getElementById('tareaTipo')?.addEventListener('change', () => this.onTipoTareaChange());

        // Fechas para calcular duración
        document.getElementById('tareaFechaInicio')?.addEventListener('change', () => this.calcularDuracion());
        document.getElementById('tareaFechaFin')?.addEventListener('change', () => this.calcularDuracion());
    }

    async cargarObjetivo(objetivoId, piloto) {
        try {
            // Mostrar loading
            this.mostrarLoading();

            // Cargar datos del objetivo
            const objetivo = await this.service.getById(objetivoId);
            
            if (!objetivo) {
                throw new Error('Objetivo no encontrado');
            }

            this.objetivoActual = objetivo;
            this.renderizarInfoObjetivo(objetivo);
            
            // Cargar tareas
            await this.cargarTareas();
            
            this.ocultarLoading();
        } catch (error) {
            console.error('Error al cargar objetivo:', error);
            this.mostrarNotificacion('Error al cargar el objetivo', 'error');
            this.ocultarLoading();
        }
    }

    renderizarInfoObjetivo(objetivo) {
        document.getElementById('infoPiloto').textContent = objetivo.piloto || '-';
        document.getElementById('infoGranja').textContent = objetivo.granja || '-';
        document.getElementById('infoGalpon').textContent = objetivo.galpon || '-';
        document.getElementById('infoObjetivo').textContent = objetivo.objetivo || '-';
        document.getElementById('infoMeta').textContent = objetivo.meta || '-';
        
        const estadoSpan = document.getElementById('infoEstado');
        estadoSpan.textContent = objetivo.estado || '-';
        estadoSpan.className = `px-3 py-1 rounded-full text-xs font-semibold ${this.getEstadoClass(objetivo.estado)}`;
    }

    async cargarTareas() {
        if (!this.objetivoActual || !this.objetivoActual.id) {
            this.mostrarNotificacion('No hay objetivo seleccionado', 'error');
            return;
        }

        try {
            const tareas = await this.service.getSubprocesos(this.objetivoActual.id);
            this.tareasActuales = Array.isArray(tareas) ? tareas : [];
            this.renderizarTareas(this.tareasActuales);
            this.actualizarEstadisticas(this.tareasActuales);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.tareasActuales = [];
            this.renderizarTareas([]);
            this.mostrarNotificacion('Error al cargar las tareas', 'error');
        }
    }

    renderizarTareas(tareas) {
        const tbody = document.getElementById('tbodyTareas');
        document.getElementById('totalTareas').textContent = tareas.length;

        if (tareas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>No hay tareas registradas</p>
                        <button onclick="controller.mostrarModalNuevaTarea()" 
                            class="mt-3 text-blue-600 hover:text-blue-800 font-semibold">
                            <i class="fas fa-plus mr-1"></i>Crear primera tarea
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        const arbolTareas = this.construirArbol(tareas);
        tbody.innerHTML = arbolTareas.map((tarea, idx) => 
            this.renderizarConHijos(tarea, [], idx + 1)
        ).join('');
    }

    renderizarConHijos(tarea, numeracion, numeroEnNivel) {
        const nuevaNumeracion = numeracion.length === 0 ? [numeroEnNivel] : [...numeracion, numeroEnNivel];
        const nivel = nuevaNumeracion.length - 1;
        const estadoClass = this.getEstadoClass(tarea.estado_completado_pendiente);
        
        const iconos = [
            'fa-star text-yellow-500',
            'fa-angle-right text-blue-500',
            'fa-angle-double-right text-indigo-500'
        ];
        const icono = iconos[nivel] || 'fa-chevron-right text-gray-400';
        
        const bgClass = nivel === 0 ? 'bg-blue-50 font-medium' : '';
        
        let html = `
            <tr class="hover:bg-gray-50 ${bgClass} border-b border-gray-100 transition">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2" style="padding-left: ${nivel * 24}px">
                        <span class="text-sm min-w-[50px] ${nivel === 0 ? 'font-bold text-blue-800' : 'text-gray-600'}">
                            ${nuevaNumeracion.join('.')}
                        </span>
                        <i class="fas ${icono} mr-1"></i>
                        <span class="${nivel === 0 ? 'font-bold' : ''}">${tarea.nombre_tarea}</span>
                        ${tarea.hijos?.length > 0 ? `
                            <span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                ${tarea.hijos.length}
                            </span>
                        ` : ''}
                    </div>
                </td>
                <td class="px-4 py-3 text-center text-sm">${tarea.duracion_dias || '-'}</td>
                <td class="px-4 py-3 text-sm">${this.formatDate(tarea.fecha_inicio)}</td>
                <td class="px-4 py-3 text-sm">${this.formatDate(tarea.fecha_fin)}</td>
                <td class="px-4 py-3 text-sm">${tarea.predecesoras || '-'}</td>
                <td class="px-4 py-3 text-sm">${tarea.nombres_recursos || '-'}</td>
                <td class="px-4 py-3 text-right text-sm font-semibold">
                    ${(tarea.presupuesto !== undefined && tarea.presupuesto !== null && tarea.presupuesto !== '') 
                        ? `S/ ${Number(tarea.presupuesto).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '-'}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="estado-badge ${estadoClass} text-xs px-3 py-1 rounded-full font-semibold">
                        ${tarea.estado_completado_pendiente}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="controller.editarTarea('${tarea.id_tarea}')" 
                            class="text-blue-600 hover:text-blue-800 transition p-2" title="Editar">
                            <i class="fas fa-edit text-lg"></i>
                        </button>
                        <button onclick="controller.eliminarTarea('${tarea.id_tarea}')" 
                            class="text-red-600 hover:text-red-800 transition p-2" title="Eliminar">
                            <i class="fas fa-trash text-lg"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        if (tarea.hijos?.length > 0) {
            html += tarea.hijos.map((hijo, idx) => 
                this.renderizarConHijos(hijo, nuevaNumeracion, idx + 1)
            ).join('');
        }

        return html;
    }

    construirArbol(tareas) {
        const tareasMap = new Map();
        const raices = [];
        
        tareas.forEach(tarea => {
            tareasMap.set(tarea.id_tarea, { ...tarea, hijos: [] });
        });
        
        tareas.forEach(tarea => {
            const nodo = tareasMap.get(tarea.id_tarea);
            if (tarea.id_tarea_padre && tareasMap.has(tarea.id_tarea_padre)) {
                tareasMap.get(tarea.id_tarea_padre).hijos.push(nodo);
            } else {
                raices.push(nodo);
            }
        });
        
        return raices;
    }

    actualizarEstadisticas(tareas) {
        const stats = {
            pendientes: 0,
            enProceso: 0,
            completadas: 0,
            presupuestoTotal: 0
        };

        tareas.forEach(tarea => {
            const estado = tarea.estado_completado_pendiente || '';
            if (estado === 'Pendiente') stats.pendientes++;
            else if (estado === 'En Proceso') stats.enProceso++;
            else if (estado === 'Completado') stats.completadas++;

            const presupuesto = parseFloat(tarea.presupuesto) || 0;
            stats.presupuestoTotal += presupuesto;
        });

        document.getElementById('statPendientes').textContent = stats.pendientes;
        document.getElementById('statEnProceso').textContent = stats.enProceso;
        document.getElementById('statCompletadas').textContent = stats.completadas;
        document.getElementById('statPresupuesto').textContent = 
            `S/ ${stats.presupuestoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    }

    // === MODAL DE TAREA ===

    mostrarModalNuevaTarea() {
        if (!this.objetivoActual || !this.objetivoActual.id) {
            this.mostrarNotificacion('No hay objetivo seleccionado', 'error');
            return;
        }

        this.tareaEditando = null;
        document.getElementById('modalTareaTitle').innerHTML = '<i class="fas fa-tasks mr-2"></i>Nueva Tarea';
        document.getElementById('formTarea').reset();
        document.getElementById('tareaId').value = '';
        document.getElementById('tareaTipo').value = 'principal';
        document.getElementById('tareaEstado').value = 'Pendiente';
        this.onTipoTareaChange();
        this.mostrarModal('modalTarea');
    }

    async editarTarea(tareaId) {
        const tarea = this.tareasActuales.find(t => t.id_tarea === tareaId);
        if (!tarea) {
            this.mostrarNotificacion('Tarea no encontrada', 'error');
            return;
        }

        this.tareaEditando = tarea;
        document.getElementById('modalTareaTitle').innerHTML = '<i class="fas fa-edit mr-2"></i>Editar Tarea';
        document.getElementById('tareaId').value = tarea.id_tarea;
        document.getElementById('tareaNombre').value = tarea.nombre_tarea || '';
        document.getElementById('tareaFechaInicio').value = tarea.fecha_inicio || '';
        document.getElementById('tareaFechaFin').value = tarea.fecha_fin || '';
        document.getElementById('tareaDuracion').value = tarea.duracion_dias || '';
        document.getElementById('tareaPredesesoras').value = tarea.predecesoras || '';
        document.getElementById('tareaRecursos').value = tarea.nombres_recursos || '';
        document.getElementById('tareaPresupuesto').value = tarea.presupuesto || '';
        document.getElementById('tareaEstado').value = tarea.estado_completado_pendiente || 'Pendiente';
        
        // Configurar tipo
        if (tarea.id_tarea_padre) {
            document.getElementById('tareaTipo').value = 'subtarea';
            document.getElementById('tareaPadre').value = tarea.id_tarea_padre;
        } else {
            document.getElementById('tareaTipo').value = 'principal';
        }
        
        this.onTipoTareaChange();
        this.cargarTareasEnSelector();
        this.mostrarModal('modalTarea');
    }

    async eliminarTarea(tareaId) {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await this.service.deleteSubproceso(tareaId);
            this.mostrarNotificacion('Tarea eliminada correctamente', 'success');
            await this.cargarTareas();
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            this.mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    }

    async guardarTarea(e) {
        e.preventDefault();

        const tareaId = document.getElementById('tareaId').value;
        const datos = {
            nombre_tarea: document.getElementById('tareaNombre').value,
            fecha_inicio: document.getElementById('tareaFechaInicio').value,
            fecha_fin: document.getElementById('tareaFechaFin').value,
            duracion_dias: document.getElementById('tareaDuracion').value || null,
            predecesoras: document.getElementById('tareaPredesesoras').value || null,
            nombres_recursos: document.getElementById('tareaRecursos').value || null,
            presupuesto: document.getElementById('tareaPresupuesto').value || null,
            estado_completado_pendiente: document.getElementById('tareaEstado').value,
            id_objetivo: this.objetivoActual.id
        };

        // Tarea padre
        const tareaTipo = document.getElementById('tareaTipo').value;
        if (tareaTipo === 'subtarea') {
            datos.id_tarea_padre = document.getElementById('tareaPadre').value || null;
        } else {
            datos.id_tarea_padre = null;
        }

        try {
            if (tareaId) {
                // Editar
                datos.id_tarea = tareaId;
                await this.service.updateSubproceso(datos);
                this.mostrarNotificacion('Tarea actualizada correctamente', 'success');
            } else {
                // Crear
                await this.service.createSubproceso(datos);
                this.mostrarNotificacion('Tarea creada correctamente', 'success');
            }

            this.cerrarModalTarea();
            await this.cargarTareas();
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            this.mostrarNotificacion('Error al guardar la tarea', 'error');
        }
    }

    onTipoTareaChange() {
        const tipo = document.getElementById('tareaTipo').value;
        const contenedorPadre = document.getElementById('contenedorTareaPadre');
        const tareaPadre = document.getElementById('tareaPadre');

        if (tipo === 'subtarea') {
            contenedorPadre.classList.remove('hidden');
            this.cargarTareasEnSelector();
        } else {
            contenedorPadre.classList.add('hidden');
            tareaPadre.value = '';
        }
    }

    cargarTareasEnSelector() {
        const select = document.getElementById('tareaPadre');
        select.innerHTML = '<option value="">-- Seleccione tarea padre --</option>';

        const tareaEditandoId = document.getElementById('tareaId').value;
        
        this.tareasActuales
            .filter(t => t.id_tarea !== tareaEditandoId)
            .forEach(tarea => {
                const option = document.createElement('option');
                option.value = tarea.id_tarea;
                option.textContent = tarea.nombre_tarea;
                select.appendChild(option);
            });
    }

    calcularDuracion() {
        const inicio = document.getElementById('tareaFechaInicio').value;
        const fin = document.getElementById('tareaFechaFin').value;

        if (inicio && fin) {
            const fechaInicio = new Date(inicio);
            const fechaFin = new Date(fin);
            const diffTime = fechaFin - fechaInicio;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            document.getElementById('tareaDuracion').value = diffDays >= 0 ? diffDays : 0;
        }
    }

    // === UTILIDADES ===

    mostrarModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    cerrarModalTarea() {
        const modal = document.getElementById('modalTarea');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    getEstadoClass(estado) {
        const classes = {
            'Pendiente': 'bg-orange-100 text-orange-800 border border-orange-300',
            'En Proceso': 'bg-blue-100 text-blue-800 border border-blue-300',
            'Completado': 'bg-green-100 text-green-800 border border-green-300'
        };
        return classes[estado] || 'bg-gray-100 text-gray-800 border border-gray-300';
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES');
        } catch (e) {
            return dateStr;
        }
    }

    mostrarLoading() {
        // Implementar si necesitas un indicador de carga
    }

    ocultarLoading() {
        // Implementar si necesitas un indicador de carga
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const iconos = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        Swal.fire({
            icon: iconos[tipo] || 'info',
            title: mensaje,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}

// Inicializar controlador al cargar la página
let controller;
document.addEventListener('DOMContentLoaded', () => {
    controller = new GestionTareasController();
});

// Hacer disponible globalmente
window.controller = controller;
