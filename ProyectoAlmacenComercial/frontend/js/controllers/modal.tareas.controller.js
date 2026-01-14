class ModalTareasController {
    constructor(mainController) {
        this.main = mainController;
        this.modalId = 'modalSubprocesos';
    }

    modal_tareas_toggle(show) {
        const modal = document.getElementById(this.modalId);
        modal?.classList.toggle('hidden', !show);
        if (show) {
            modal?.classList.add('flex');
        } else {
            modal?.classList.remove('flex');
        }
    }

    modal_tareas_cerrar() {
        this.modal_tareas_toggle(false);
    }

    async modal_tareas_abrir(piloto, idObjetivo) {
    const idBuscado = String(idObjetivo);
    this.main.objetivoActual = this.main.datos.find(d => String(d.id) === idBuscado);
    
    if (!this.main.objetivoActual) {
        this.main.mostrarNotificacion('No se encontró el objetivo', 'error');
        return;
    }
    
    const titulo = this.main.objetivoActual.objetivo || 
                   this.main.objetivoActual.meta || 
                   this.main.objetivoActual.piloto || 'Sin piloto';
    
    document.getElementById('modalSubTitle').textContent = `Tareas de: ${titulo}`;
    document.getElementById('subprocesosInfo').innerHTML = 
        this.modal_tareas_generarInfo(this.main.objetivoActual);
    
    await this.modal_tareas_cargarPorRegistro(idBuscado);
    
    // ✅ ASEGURAR QUE EL BOTÓN NUEVA TAREA ESTÉ VISIBLE
    const btnNuevaTarea = document.getElementById('btnNuevaTarea');
    if (btnNuevaTarea) {
        btnNuevaTarea.style.display = 'block';
    }
    
    this.modal_tareas_toggle(true);
}


    modal_tareas_generarInfo(registro) {
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

    async modal_tareas_cargarPorRegistro(idObjetivo) {
        try {
            const tareas = await this.main.service.getSubprocesos(idObjetivo);
            this.main.tareasActuales = Array.isArray(tareas) ? tareas : [];
            this.modal_tareas_renderizar(this.main.tareasActuales);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.main.tareasActuales = [];
            this.modal_tareas_renderizar([]);
        }
    }

    modal_tareas_renderizar(tareas) {
        const tbody = document.getElementById('tbodySubprocesos');

        if (tareas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No hay tareas registradas</td></tr>';
            return;
        }

        const arbolTareas = this.modal_tareas_construirArbol(tareas);
        tbody.innerHTML = arbolTareas.map((tarea, idx) => 
            this.modal_tareas_renderizarConHijos(tarea, [], idx + 1)
        ).join('');
    }

    modal_tareas_renderizarConHijos(tarea, numeracion, numeroEnNivel) {
        const nuevaNumeracion = numeracion.length === 0 ? [numeroEnNivel] : [...numeracion, numeroEnNivel];
        const nivel = nuevaNumeracion.length - 1;
        const estadoClass = this.modal_tareas_getEstadoClass(tarea.estado_completado_pendiente);
        
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
                <td class="px-3 py-2 text-sm">${this.modal_tareas_formatDate(tarea.fecha_inicio)}</td>
                <td class="px-3 py-2 text-sm">${this.modal_tareas_formatDate(tarea.fecha_fin)}</td>
                <td class="px-3 py-2 text-sm">${tarea.nombres_recursos || '-'}</td>
                <td class="px-3 py-2 text-right text-sm">${(tarea.presupuesto !== undefined && tarea.presupuesto !== null && tarea.presupuesto !== '') ? `$${Number(tarea.presupuesto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                <td class="px-3 py-2 text-center">
                    <span class="estado-badge ${estadoClass} text-xs">${tarea.estado_completado_pendiente}</span>
                </td>
                <td class="px-3 py-2 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="controller.modal_tarea_editar('${tarea.id_tarea}')" 
                            class="text-blue-600 hover:text-blue-800 transition" title="Editar">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="controller.modal_tarea_eliminar('${tarea.id_tarea}')" 
                            class="text-red-600 hover:text-red-800 transition" title="Eliminar">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        if (tarea.hijos?.length > 0) {
            html += tarea.hijos.map((hijo, idx) => 
                this.modal_tareas_renderizarConHijos(hijo, nuevaNumeracion, idx + 1)
            ).join('');
        }

        return html;
    }

    modal_tareas_construirArbol(tareas) {
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

    modal_tareas_getEstadoClass(estado) {
        const classes = {
            'Pendiente': 'estado-pendiente',
            'En Proceso': 'estado-enproceso',
            'Completado': 'estado-completado'
        };
        return classes[estado] || 'estado-pendiente';
    }

    modal_tareas_formatDate(dateStr) {
        return dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES') : '-';
    }
}
