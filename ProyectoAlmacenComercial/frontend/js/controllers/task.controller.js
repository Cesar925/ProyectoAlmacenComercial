class TaskController {
    constructor(mainController) {
        this.main = mainController;
    }

    async abrir(piloto, idObjetivo) {
        const idBuscado = String(idObjetivo);
        this.main.objetivoActual = this.main.datos.find(d => String(d.id) === idBuscado);
        
        if (!this.main.objetivoActual) {
            this.main.mostrarNotificacion('No se encontró el objetivo', 'error');
            return;
        }
        
        const titulo = this.main.objetivoActual.objetivo || this.main.objetivoActual.meta || this.main.objetivoActual.piloto || 'Sin piloto';
        document.getElementById('modalSubTitle').textContent = `Tareas de: ${titulo}`;
        document.getElementById('subprocesosInfo').innerHTML = this.generarInfo(this.main.objetivoActual);
        
        await this.cargarPorRegistro(idBuscado);
        this.main.modal.toggle('modalSubprocesos', true);
    }

    generarInfo(registro) {
        const campos = [
            { label: 'Piloto', valor: registro.piloto },
            { label: 'Granja', valor: registro.granja },
            { label: 'Galpón', valor: registro.galpon },
            { label: 'Objetivo', valor: registro.objetivo },
            { label: 'Meta', valor: registro.meta }
        ].filter(c => c.valor);

        return `
            <div class="flex flex-wrap items-center gap-4 text-sm">
                ${campos.map((c, idx) => `
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-700">${c.label}:</span>
                        <span class="text-gray-900">${c.valor}</span>
                    </div>
                    ${idx < campos.length - 1 ? '<div class="h-4 w-px bg-gray-300"></div>' : ''}
                `).join('')}
            </div>
        `;
    }

    async cargarPorRegistro(idObjetivo) {
        try {
            const tareas = await this.main.service.getSubprocesos(idObjetivo);
            this.main.tareasActuales = Array.isArray(tareas) ? tareas : [];
            this.renderizar(this.main.tareasActuales);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.main.tareasActuales = [];
            this.renderizar([]);
        }
    }

    renderizar(tareas) {
        const tbody = document.getElementById('tbodySubprocesos');

        if (tareas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No hay tareas registradas</td></tr>';
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
        const estadoClass = this.main.table.getEstadoClass(tarea.estado_completado_pendiente);
        
        const iconos = ['fa-star text-yellow-500', 'fa-angle-right text-blue-400', 'fa-angle-double-right text-indigo-400'];
        const icono = iconos[nivel] || 'fa-chevron-right text-gray-400';
        
        let html = `
            <tr class="hover:bg-gray-50 ${nivel === 0 ? 'bg-blue-50' : ''} border-b border-gray-100">
                <td class="px-3 py-2">
                    <div class="flex items-center gap-1" style="padding-left: ${nivel * 24}px">
                        <span class="text-sm min-w-[40px] ${nivel === 0 ? 'font-bold text-blue-800' : 'text-gray-600'}">${nuevaNumeracion.join('.')}</span>
                        <i class="fas ${icono} mr-1"></i>
                        <span class="${nivel === 0 ? 'font-bold' : ''}">${tarea.nombre_tarea}</span>
                        ${tarea.hijos?.length > 0 ? `<span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${tarea.hijos.length}</span>` : ''}
                    </div>
                </td>
                <td class="px-3 py-2 text-center text-sm">${tarea.duracion_dias || '-'}</td>
                <td class="px-3 py-2 text-sm">${this.main.table.formatDate(tarea.fecha_inicio)}</td>
                <td class="px-3 py-2 text-sm">${this.main.table.formatDate(tarea.fecha_fin)}</td>
                <td class="px-3 py-2 text-sm">${tarea.nombres_recursos || '-'}</td>
                <td class="px-3 py-2 text-right text-sm">${(tarea.presupuesto !== undefined && tarea.presupuesto !== null && tarea.presupuesto !== '') ? `$${Number(tarea.presupuesto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                <td class="px-3 py-2 text-center">
                    <span class="estado-badge ${estadoClass} text-xs">${tarea.estado_completado_pendiente}</span>
                </td>
                <td class="px-3 py-2 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="controller.editarTarea('${tarea.id_tarea}')" 
                            class="text-blue-600 hover:text-blue-800 transition" title="Editar">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="controller.eliminarTarea('${tarea.id_tarea}')" 
                            class="text-red-600 hover:text-red-800 transition" title="Eliminar">
                            <i class="fas fa-trash text-sm"></i>
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

    mostrarModalNueva() {
        document.getElementById('modalTareaTitle').textContent = 'Nueva Tarea';
        document.getElementById('formTarea').reset();
        document.getElementById('tareaId').value = '';
        document.getElementById('tareaTipo').value = 'principal';
        document.getElementById('tareaTareaPadre').disabled = true;
        document.getElementById('tareaTareaPadre').value = '';
        
        this.cargarPrincipalesEnSelector();
        this.main.modal.toggle('modalTarea', true);
    }

    cargarPrincipalesEnSelector() {
        const select = document.getElementById('tareaTareaPadre');
        select.innerHTML = '<option value="">-- Seleccione tarea principal --</option>';
        
        const arbolTareas = this.construirArbol(this.main.tareasActuales);
        const tareaEditandoId = document.getElementById('tareaId').value;
        
        this.renderizarOpcionesJerarquicas(arbolTareas, select, tareaEditandoId, 0);
    }

    renderizarOpcionesJerarquicas(tareas, select, tareaEditandoId, nivel) {
        tareas.forEach(tarea => {
            if (tareaEditandoId && this.esDescendienteOSiMisma(tarea, tareaEditandoId)) {
                return;
            }
            
            const indent = '&nbsp;&nbsp;'.repeat(nivel * 2);
            const iconos = ['⭐', '▸', '▸▸'];
            const icono = iconos[nivel] || '▸';
            
            const option = document.createElement('option');
            option.value = tarea.id_tarea;
            option.innerHTML = `${indent}${icono} ${tarea.nombre_tarea}`;
            select.appendChild(option);
            
            if (tarea.hijos?.length > 0) {
                this.renderizarOpcionesJerarquicas(tarea.hijos, select, tareaEditandoId, nivel + 1);
            }
        });
    }

    esDescendienteOSiMisma(tareaActual, idPadrePropuesto) {
        if (tareaActual.id_tarea === idPadrePropuesto) return true;
        
        if (tareaActual.hijos?.length > 0) {
            for (const hijo of tareaActual.hijos) {
                if (this.esDescendienteOSiMisma(hijo, idPadrePropuesto)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    onTipoChange() {
        const tipo = document.getElementById('tareaTipo').value;
        const selectPadre = document.getElementById('tareaTareaPadre');
        
        if (tipo === 'subtarea') {
            selectPadre.disabled = false;
            this.cargarPrincipalesEnSelector();
        } else {
            selectPadre.disabled = true;
            selectPadre.value = '';
        }
    }

    editar(idTarea) {
        const tarea = this.main.tareasActuales.find(t => String(t.id_tarea) === String(idTarea));
        if (!tarea) return;

        document.getElementById('modalTareaTitle').textContent = 'Editar Tarea';
        document.getElementById('tareaId').value = tarea.id_tarea;
        document.getElementById('tareaNombre').value = tarea.nombre_tarea;
        document.getElementById('tareaFechaInicio').value = tarea.fecha_inicio;
        document.getElementById('tareaFechaFin').value = tarea.fecha_fin;
        document.getElementById('tareaDuracion').value = tarea.duracion_dias;
        document.getElementById('tareaPredesesoras').value = tarea.predecesoras || '';
        document.getElementById('tareaRecursos').value = tarea.nombres_recursos || '';
        document.getElementById('tareaPresupuesto').value = tarea.presupuesto || '';
        document.getElementById('tareaEstado').value = tarea.estado_completado_pendiente;

        const esPrincipal = !tarea.id_tarea_padre;
        document.getElementById('tareaTipo').value = esPrincipal ? 'principal' : 'subtarea';
        
        this.cargarPrincipalesEnSelector();
        
        if (!esPrincipal) {
            document.getElementById('tareaTareaPadre').disabled = false;
            document.getElementById('tareaTareaPadre').value = tarea.id_tarea_padre || '';
        } else {
            document.getElementById('tareaTareaPadre').disabled = true;
        }

        this.main.modal.toggle('modalTarea', true);
    }

    calcularDuracion() {
        const inicio = document.getElementById('tareaFechaInicio').value;
        const fin = document.getElementById('tareaFechaFin').value;
        
        if (inicio && fin) {
            const dias = Math.ceil((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('tareaDuracion').value = dias > 0 ? dias : 1;
        }
    }

    async guardar() {
        try {
            const esPrincipal = document.getElementById('tareaTipo').value === 'principal';
            const payload = {
                id_objetivo: this.main.objetivoActual.id,
                nombre_tarea: document.getElementById('tareaNombre').value,
                fecha_inicio: document.getElementById('tareaFechaInicio').value,
                fecha_fin: document.getElementById('tareaFechaFin').value,
                duracion_dias: document.getElementById('tareaDuracion').value,
                predecesoras: document.getElementById('tareaPredesesoras').value || null,
                nombres_recursos: document.getElementById('tareaRecursos').value,
                presupuesto: document.getElementById('tareaPresupuesto').value || null,
                estado_completado_pendiente: document.getElementById('tareaEstado').value,
                es_tarea_principal: esPrincipal ? 1 : 0,
                id_tarea_padre: esPrincipal ? null : document.getElementById('tareaTareaPadre').value || null
            };

            const tareaId = document.getElementById('tareaId').value;

            if (tareaId) {
                await this.main.service.updateSubproceso({ id_tarea: tareaId, ...payload });
                this.main.mostrarNotificacion('Tarea actualizada correctamente', 'success');
            } else {
                await this.main.service.createSubproceso(payload);
                this.main.mostrarNotificacion('Tarea creada correctamente', 'success');
            }

            this.main.modal.cerrarTarea();
            await this.cargarPorRegistro(this.main.objetivoActual.id);
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            this.main.mostrarNotificacion('Error al guardar la tarea', 'error');
        }
    }

    async eliminar(idTarea) {
        if (!confirm('¿Está seguro de eliminar esta tarea?')) return;
        
        try {
            await this.main.service.deleteSubproceso(idTarea);
            this.main.mostrarNotificacion('Tarea eliminada correctamente', 'success');
            await this.cargarPorRegistro(this.main.objetivoActual.id);
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            this.main.mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    }
}
