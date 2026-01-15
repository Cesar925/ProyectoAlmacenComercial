class ModalTareaFormController {
    constructor(mainController) {
        this.main = mainController;
        this.modalId = 'modalTarea';
        this.setupEventListeners();
    }

    setupEventListeners() {
        ['tareaFechaInicio', 'tareaFechaFin'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this.modal_tarea_calcularDuracion();
            });
        });
        
        document.getElementById('tareaTipo')?.addEventListener('change', () => {
            this.modal_tarea_onTipoChange();
        });
    }

    modal_tarea_toggle(show) {
        const modal = document.getElementById(this.modalId);
        modal?.classList.toggle('hidden', !show);
        if (show) {
            modal?.classList.add('flex');
        } else {
            modal?.classList.remove('flex');
        }
    }

    modal_tarea_cerrar() {
        this.modal_tarea_toggle(false);
    }

    modal_tarea_mostrarModalNueva() {
        if (!this.main.objetivoActual || !this.main.objetivoActual.id) {
            this.main.mostrarNotificacion(
                'Primero debe abrir las tareas de un objetivo específico',
                'error'
            );
            return;
        }

        const modalTitle = document.getElementById('modalTareaTitle');
        const formTarea = document.getElementById('formTarea');
        const tareaId = document.getElementById('tareaId');
        const tareaTipo = document.getElementById('tareaTipo');
        const tareaPadre = document.getElementById('tareaPadre'); // ✅ CORREGIDO
        
        if (!formTarea) {
            console.error('No se encontró el formulario #formTarea');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'Nueva Tarea';
        formTarea.reset();
        if (tareaId) tareaId.value = '';
        if (tareaTipo) tareaTipo.value = 'principal';
        
        if (tareaPadre) {
            tareaPadre.disabled = true;
            tareaPadre.value = '';
        }
        
        // Ocultar contenedor de tarea padre inicialmente
        const contenedorPadre = document.getElementById('contenedorTareaPadre');
        if (contenedorPadre) {
            contenedorPadre.classList.add('hidden');
        }
        
        this.modal_tarea_toggle(true);
    }

    /**
     * Carga TODAS las tareas (principales y sub-tareas)
     * Permite jerarquía infinita: 1 → 1.1 → 1.1.1 → 1.1.1.1 → ∞
     */
    modal_tarea_cargarTodasLasTareasEnSelector() {
        const select = document.getElementById('tareaPadre');
        
        if (!select) {
            console.error('❌ No se encontró el select #tareaPadre en el HTML');
            this.main.mostrarNotificacion(
                'Error: Falta el campo de selección de tarea padre',
                'error'
            );
            return;
        }
        
        // Limpiar select
        select.innerHTML = '<option value="">-- Seleccione tarea padre (puede ser cualquier tarea) --</option>';
        
        // Validar que haya tareas
        if (!this.main.tareasActuales || this.main.tareasActuales.length === 0) {
            select.innerHTML = '<option value="">-- No hay tareas disponibles --</option>';
            return;
        }
        
        // Construir árbol jerárquico
        const arbolTareas = this.main.modalTareas.modal_tareas_construirArbol(this.main.tareasActuales);
        
        // Obtener ID de la tarea que se está editando
        const tareaId = document.getElementById('tareaPadre');
        const tareaEditandoId = tareaId ? tareaId.value : '';
        
        // Renderizar opciones con indentación jerárquica
        this.modal_tarea_renderizarOpcionesJerarquicas(
            arbolTareas, 
            select, 
            tareaEditandoId, 
            0
        );
    }

    /**
     * Renderiza el árbol completo con indentación
     * Excluye solo la tarea actual y sus descendientes (previene ciclos)
     */
    modal_tarea_renderizarOpcionesJerarquicas(tareas, select, tareaEditandoId, nivel) {
        tareas.forEach(tarea => {
            // ⚠️ IMPORTANTE: Evitar seleccionar la misma tarea o sus descendientes
            if (tareaEditandoId && this.modal_tarea_esDescendienteOSiMisma(tarea, tareaEditandoId)) {
                return; // No mostrar esta tarea
            }
            
            // Crear indentación visual según el nivel
            const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(nivel);
            
            // Iconos según nivel (infinitos)
            const iconos = {
                0: '⭐',  // Principal
                1: '▸',   // Sub-tarea nivel 1
                2: '▸▸',  // Sub-tarea nivel 2
                3: '▸▸▸', // Sub-tarea nivel 3
            };
            const icono = iconos[nivel] || '▸'.repeat(Math.min(nivel, 5)); // Hasta 5 flechas
            
            // Crear opción
            const option = document.createElement('option');
            option.value = tarea.idtarea; // ✅ Sin guiones bajos
            
            // Agregar badge de nivel
            const badge = nivel > 0 ? `[Nivel ${nivel}]` : '[Principal]';
            option.innerHTML = `${indent}${icono} ${tarea.nombretarea} ${badge}`;
            
            select.appendChild(option);
            
            // ✅ RECURSIÓN INFINITA: Procesar hijos (sub-sub-tareas, etc.)
            if (tarea.hijos && tarea.hijos.length > 0) {
                this.modal_tarea_renderizarOpcionesJerarquicas(
                    tarea.hijos, 
                    select, 
                    tareaEditandoId, 
                    nivel + 1 // ⬅️ Incrementar nivel infinitamente
                );
            }
        });
    }

    /**
     * ✅ VALIDACIÓN: Previene ciclos (una tarea no puede ser padre de sí misma o de sus ancestros)
     */
    modal_tarea_esDescendienteOSiMisma(tareaActual, idTareaBuscada) {
        // Comparar IDs
        if (String(tareaActual.idtarea) === String(idTareaBuscada)) {
            return true;
        }
        
        // Buscar recursivamente en hijos
        if (tareaActual.hijos && tareaActual.hijos.length > 0) {
            for (const hijo of tareaActual.hijos) {
                if (this.modal_tarea_esDescendienteOSiMisma(hijo, idTareaBuscada)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    modal_tarea_onTipoChange() {
        const tareaTipo = document.getElementById('tareaTipo');
        const tareaPadre = document.getElementById('tareaPadre');
        const contenedorPadre = document.getElementById('contenedorTareaPadre');
        
        if (!tareaTipo) return;
        
        const tipo = tareaTipo.value;
        
        if (tipo === 'subtarea') {
            // Mostrar y habilitar selector
            if (contenedorPadre) contenedorPadre.classList.remove('hidden');
            if (tareaPadre) tareaPadre.disabled = false;
            
            // Cargar todas las tareas disponibles
            this.modal_tarea_cargarTodasLasTareasEnSelector();
        } else {
            // Ocultar y deshabilitar selector
            if (contenedorPadre) contenedorPadre.classList.add('hidden');
            if (tareaPadre) {
                tareaPadre.disabled = true;
                tareaPadre.value = '';
            }
        }
    }

    modal_tarea_editar(idTarea) {
        const tarea = this.main.tareasActuales.find(t => 
            String(t.idtarea) === String(idTarea)
        );
        
        if (!tarea) {
            console.error('No se encontró la tarea con ID:', idTarea);
            return;
        }

        const modalTitle = document.getElementById('modalTareaTitle');
        const tareaId = document.getElementById('tareaId');
        const tareaNombre = document.getElementById('tareaNombre');
        const tareaFechaInicio = document.getElementById('tareaFechaInicio');
        const tareaFechaFin = document.getElementById('tareaFechaFin');
        const tareaDuracion = document.getElementById('tareaDuracion');
        const tareaRecursos = document.getElementById('tareaRecursos');
        const tareaPresupuesto = document.getElementById('tareaPresupuesto');
        const tareaEstado = document.getElementById('tareaEstado');
        const tareaTipo = document.getElementById('tareaTipo');
        const tareaPadre = document.getElementById('tareaPadre');
        const contenedorPadre = document.getElementById('contenedorTareaPadre');
        
        if (modalTitle) modalTitle.textContent = 'Editar Tarea';
        if (tareaId) tareaId.value = tarea.idtarea || '';
        if (tareaNombre) tareaNombre.value = tarea.nombretarea || '';
        if (tareaFechaInicio) tareaFechaInicio.value = tarea.fechainicio || '';
        if (tareaFechaFin) tareaFechaFin.value = tarea.fechafin || '';
        if (tareaDuracion) tareaDuracion.value = tarea.duraciondias || '';
        if (tareaRecursos) tareaRecursos.value = tarea.nombresrecursos || '';
        if (tareaPresupuesto) tareaPresupuesto.value = tarea.presupuesto || '';
        if (tareaEstado) tareaEstado.value = tarea.estadocompletadopendiente || 'Pendiente';
        
        const esPrincipal = !tarea.idtareapadre;
        if (tareaTipo) tareaTipo.value = esPrincipal ? 'principal' : 'subtarea';
        
        if (esPrincipal) {
            if (contenedorPadre) contenedorPadre.classList.add('hidden');
            if (tareaPadre) tareaPadre.disabled = true;
        } else {
            if (contenedorPadre) contenedorPadre.classList.remove('hidden');
            if (tareaPadre) {
                tareaPadre.disabled = false;
                this.modal_tarea_cargarTodasLasTareasEnSelector();
                setTimeout(() => {
                    if (tareaPadre) tareaPadre.value = tarea.idtareapadre || '';
                }, 100);
            }
        }
        
        this.modal_tarea_toggle(true);
    }

    modal_tarea_calcularDuracion() {
        const fechaInicio = document.getElementById('tareaFechaInicio');
        const fechaFin = document.getElementById('tareaFechaFin');
        const duracion = document.getElementById('tareaDuracion');
        
        if (!fechaInicio || !fechaFin || !duracion) return;
        
        const inicio = fechaInicio.value;
        const fin = fechaFin.value;
        
        if (inicio && fin) {
            const dias = Math.ceil((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
            duracion.value = dias > 0 ? dias : 1;
        }
    }

    async modal_tarea_guardar() {
        try {
            const tareaTipo = document.getElementById('tareaTipo');
            const tareaNombre = document.getElementById('tareaNombre');
            const tareaFechaInicio = document.getElementById('tareaFechaInicio');
            const tareaFechaFin = document.getElementById('tareaFechaFin');
            const tareaDuracion = document.getElementById('tareaDuracion');
            const tareaRecursos = document.getElementById('tareaRecursos');
            const tareaPresupuesto = document.getElementById('tareaPresupuesto');
            const tareaEstado = document.getElementById('tareaEstado');
            const tareaPadre = document.getElementById('tareaPadre');
            const tareaId = document.getElementById('tareaId');
            
            if (!tareaNombre || !tareaNombre.value.trim()) {
                this.main.mostrarNotificacion('El nombre de la tarea es obligatorio', 'error');
                return;
            }
            
            if (!tareaFechaInicio || !tareaFechaInicio.value) {
                this.main.mostrarNotificacion('La fecha de inicio es obligatoria', 'error');
                return;
            }
            
            if (!tareaFechaFin || !tareaFechaFin.value) {
                this.main.mostrarNotificacion('La fecha fin es obligatoria', 'error');
                return;
            }
            
            const esPrincipal = tareaTipo ? tareaTipo.value === 'principal' : true;
            
            const payload = {
                idobjetivo: this.main.objetivoActual.id,
                nombretarea: tareaNombre.value.trim(),
                fechainicio: tareaFechaInicio.value,
                fechafin: tareaFechaFin.value,
                duraciondias: tareaDuracion ? tareaDuracion.value : null,
                nombresrecursos: tareaRecursos ? tareaRecursos.value : '',
                presupuesto: tareaPresupuesto ? tareaPresupuesto.value || null : null,
                estadocompletadopendiente: tareaEstado ? tareaEstado.value : 'Pendiente',
                estareaprincipal: esPrincipal ? 1 : 0,
                idtareapadre: esPrincipal ? null : (tareaPadre ? tareaPadre.value || null : null)
            };
            
            const idTarea = tareaId ? tareaId.value : null;
            
            if (idTarea) {
                await this.main.service.updateSubproceso({ idtarea: idTarea, ...payload });
                this.main.mostrarNotificacion('Tarea actualizada correctamente', 'success');
            } else {
                await this.main.service.createSubproceso(payload);
                this.main.mostrarNotificacion('Tarea creada correctamente', 'success');
            }
            
            this.modal_tarea_cerrar();
            await this.main.modalTareas.modal_tareas_cargarPorRegistro(this.main.objetivoActual.id);
            
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            this.main.mostrarNotificacion('Error al guardar la tarea: ' + error.message, 'error');
        }
    }

    async modal_tarea_eliminar(idTarea) {
        if (!confirm('¿Está seguro de eliminar esta tarea y todas sus sub-tareas?')) return;
        
        try {
            await this.main.service.deleteSubproceso(idTarea);
            this.main.mostrarNotificacion('Tarea eliminada correctamente', 'success');
            await this.main.modalTareas.modal_tareas_cargarPorRegistro(this.main.objetivoActual.id);
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            this.main.mostrarNotificacion('Error al eliminar la tarea: ' + error.message, 'error');
        }
    }
}

