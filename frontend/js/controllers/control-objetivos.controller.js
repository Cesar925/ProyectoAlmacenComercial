class ControlObjetivosController {
    constructor() {
        this.service = new ControlObjetivosService();
        this.config = window.ControlObjetivosConfig;
        this.datos = [];
        this.registroSeleccionado = null;
        this.objetivoActual = null;
    }

    async init() {
        this.setupEventListeners();
        this.setupToggleFiltros();
        this.setupColumnToggle();
        this.setupTableEventListeners();
        await this.cargarDatos();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btnNuevo')?.addEventListener('click', () => this.mostrarModalNuevo());
        document.getElementById('btnExportar')?.addEventListener('click', () => this.exportarExcel());
        document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => this.limpiarFiltros());
        document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => this.aplicarFiltros());

        // Modal Objetivo
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.cerrarModal());
        document.getElementById('formObjetivo')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarRegistro();
        });

        // Modal Subprocesos
        document.getElementById('btnCerrarSubprocesos')?.addEventListener('click', () => this.cerrarModalSubprocesos());
        document.getElementById('btnNuevaTarea')?.addEventListener('click', () => this.mostrarModalNuevaTarea());

        // Modal Tarea - ambos botones cierran el modal
        document.getElementById('btnCancelarTarea')?.addEventListener('click', () => this.cerrarModalTarea());
        document.getElementById('btnCerrarTarea')?.addEventListener('click', () => this.cerrarModalTarea());
        document.getElementById('formTarea')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarTarea();
        });

        // Auto calcular duración al cambiar fechas
        document.getElementById('tareaFechaInicio')?.addEventListener('change', () => this.calcularDuracion());
        document.getElementById('tareaFechaFin')?.addEventListener('change', () => this.calcularDuracion());

        // Cambio de tipo de tarea (principal/subtarea)
        document.getElementById('tareaTipo')?.addEventListener('change', () => this.onTipoTareaChange());
    }

    setupTableEventListeners() {
        const tbody = document.getElementById('tbodyObjetivos');
        if (!tbody) return;

        tbody.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            e.preventDefault();
            e.stopPropagation();

            const action = button.dataset.action;
            const id = button.dataset.id; // NO usar parseInt - el ID es UUID string
            const piloto = button.dataset.piloto;

            console.log('Acción:', action, 'ID:', id, 'Piloto:', piloto);

            switch(action) {
                case 'ver-tareas':
                case 'ver-tareas-obj':
                case 'ver-tareas-meta':
                    this.abrirSubprocesos(piloto, id);
                    break;
                case 'editar':
                    this.editarRegistro(piloto);
                    break;
                case 'eliminar':
                    this.eliminarRegistro(id, piloto);
                    break;
            }
        });
    }

    setupToggleFiltros() {
        const btnToggle = document.getElementById('btnToggleFiltros');
        const filterContent = document.getElementById('filterContent');

        if (!btnToggle || !filterContent) return;

        btnToggle.addEventListener('click', () => {
            const isOpen = filterContent.classList.contains('show');
            const icon = btnToggle.querySelector('i');

            if (isOpen) {
                filterContent.classList.remove('show');
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                filterContent.classList.add('show');
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            }
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
            if (!e.target.closest('.dropdown-columns')) {
                dropdown.classList.remove('show');
            }
        });

        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const columnIndex = parseInt(e.target.dataset.column);
                const cells = document.querySelectorAll(`#tablaObjetivos th:nth-child(${columnIndex + 1}), #tablaObjetivos td:nth-child(${columnIndex + 1})`);
                cells.forEach(cell => {
                    cell.style.display = e.target.checked ? '' : 'none';
                });
            });
        });
    }

    /*async cargarDatos() {
        try {
            this.mostrarCargando(true);
            const datos = await this.service.getAll();
            this.datos = Array.isArray(datos) ? datos : [];
            this.renderizarTabla();
            this.poblarSelectGranjas();
            const totalElem = document.getElementById('totalRegistros');
            if (totalElem) {
                totalElem.textContent = `(${this.datos.length} registros)`;
            }
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.CARGAR_DATOS, 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }
    */

    async cargarDatos() {
    try {
        this.mostrarCargando(true);
        const datos = await this.service.getAll();
        this.datos = Array.isArray(datos) ? datos : [];
        this.renderizarTabla();
        this.poblarSelectGranjas();
        
        // Verificar si existe antes de modificar
        const totalElem = document.getElementById('totalRegistros');
        if (totalElem) {
            totalElem.textContent = `${this.datos.length} registros`;
        }
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        this.mostrarNotificacion(this.config.MENSAJES.ERROR.CARGAR_DATOS, 'error');
    } finally {
        this.mostrarCargando(false);
    }
}

    poblarSelectGranjas() {
        const granjas = [...new Set(this.datos.map(d => d.granja).filter(g => g))];
        const select = document.getElementById('filterGranja');
        if (select) {
            select.innerHTML = '<option value="">Todas</option>' +
                granjas.map(g => `<option value="${g}">${g}</option>`).join('');
        }
    }

    /*renderizarTabla() {
        const tbody = document.getElementById('tbodyObjetivos');
        const emptyState = document.getElementById('emptyState');

        if (!tbody) {
            console.error('❌ No se encontró el elemento tbodyObjetivos');
            return;
        }

        if (this.datos.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        
        const html = this.datos.map(item => {
            const totalTareas = parseInt(item.total_tareas) || 0;
            const tareasCompletadas = parseInt(item.tareas_completadas) || 0;
            const progreso = totalTareas > 0 
                ? Math.round((tareasCompletadas / totalTareas) * 100) 
                : 0;
            
            const estadoClass = item.estado === 'Completado' ? 'estado-completado' : 
                               item.estado === 'En Proceso' ? 'estado-proceso' : 'estado-pendiente';

            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 font-medium">${this.truncate(item.piloto, 40)}</td>
                    <td class="px-4 py-3">${item.granja || '-'}</td>
                    <td class="px-4 py-3">${item.galpon || '-'}</td>
                    <td class="px-4 py-3">${this.truncate(item.objetivo, 50)}</td>
                    <td class="px-4 py-3">${this.truncate(item.meta, 50)}</td>
                    <td class="px-4 py-3">${this.formatDate(item.inicio)}</td>
                    <td class="px-4 py-3">${this.formatDate(item.fin)}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="estado-badge ${estadoClass}">${item.estado}</span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="progress-bar flex-1">
                                <div class="progress-fill" style="width: ${progreso}%"></div>
                            </div>
                            <span class="text-xs text-gray-500">${progreso}%</span>
                        </div>
                        <span class="text-xs text-gray-400">${tareasCompletadas}/${totalTareas} tareas</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="controller.verTareas('${item.id}')" 
                                class="text-purple-600 hover:text-purple-800" title="Ver Tareas">
                                <i class="fas fa-tasks"></i>
                            </button>
                            <button onclick="controller.editarRegistro('${item.id}')" 
                                class="text-blue-600 hover:text-blue-800" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="controller.eliminarRegistro('${item.id}')" 
                                class="text-red-600 hover:text-red-800" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = html;
    }*/

    mostrarModalNuevo() {
        this.registroSeleccionado = null;
        this.pilotoActual = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Objetivo';
        document.getElementById('formObjetivo').reset();
        document.getElementById('modalId').value = '';
        this.limpiarListasObjetivosMetas();
        document.getElementById('modalObjetivo').classList.remove('hidden');
        document.getElementById('modalObjetivo').classList.add('flex');
    }

    limpiarListasObjetivosMetas() {
        const listaObjetivos = document.getElementById('listaObjetivos');
        listaObjetivos.innerHTML = `
        <div class="objetivo-item flex gap-2">
            <textarea rows="2" placeholder="Describe el objetivo..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 objetivo-text"></textarea>
            <button type="button" class="btn-eliminar-objetivo text-red-600 hover:text-red-800 px-2" style="display: none;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

        const listaMetas = document.getElementById('listaMetas');
        listaMetas.innerHTML = `
        <div class="meta-item flex gap-2">
            <textarea rows="2" placeholder="Describe la meta..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 meta-text"></textarea>
            <button type="button" class="btn-eliminar-meta text-red-600 hover:text-red-800 px-2" style="display: none;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    }

    renderizarTabla() {
    const tbody = document.getElementById('tbodyObjetivos');
    const emptyState = document.getElementById('emptyState');

    if (!tbody) {
        console.error('No se encontró el elemento tbodyObjetivos');
        return;
    }

    if (this.datos.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Agrupar por PILOTO
    const grupos = {};
    this.datos.forEach(item => {
        const piloto = item.piloto || 'Sin piloto';
        if (!grupos[piloto]) grupos[piloto] = [];
        grupos[piloto].push(item);
    });

    let html = '';
    
    Object.values(grupos).forEach(grupo => {
        const principal = grupo[0];
        
        // Calcular progreso del grupo completo
        const totalTareas = grupo.reduce((sum, item) => sum + (parseInt(item.total_tareas) || 0), 0);
        const tareasCompletadas = grupo.reduce((sum, item) => sum + (parseInt(item.tareas_completadas) || 0), 0);
        const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
        const estadoClass = principal.estado === 'Completado' ? 'estado-completado' :
                           principal.estado === 'En Proceso' ? 'estado-proceso' : 'estado-pendiente';

        // GENERAR UNA FILA POR CADA REGISTRO
        grupo.forEach((registro, index) => {
            html += `<tr class="grupo-row hover:bg-gray-50 transition-colors">`;
            
            // Piloto (solo en primera fila con rowspan)
            if (index === 0) {
                html += `
                    <td class="px-4 py-2 align-top font-medium" rowspan="${grupo.length}">
                        <div class="flex items-center gap-2">
                            <span class="badge-grupo">${grupo.length}</span>
                            <span>${this.truncate(principal.piloto, 40)}</span>
                        </div>
                    </td>
                `;
            }
            
            // Granja y Galpón (solo en primera fila con rowspan)
            if (index === 0) {
                html += `
                    <td class="px-4 py-2 align-top" rowspan="${grupo.length}">${principal.granja || '-'}</td>
                    <td class="px-4 py-2 align-top" rowspan="${grupo.length}">${principal.galpon || '-'}</td>
                `;
            }
            
            // Objetivo CON BOTÓN DE TAREAS
            html += `
                <td class="px-4 py-2">
                    <div class="objetivos-container">
                        ${registro.objetivo ? `
                            <div class="objetivo-item flex items-center justify-between gap-2">
                                <div class="flex-1">
                                    <span class="objetivo-numero">${index + 1}.</span>
                                    ${this.truncate(registro.objetivo, 45)}
                                </div>
                                <button data-action="ver-tareas-obj" data-id="${registro.id}"
                                    class="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-all flex-shrink-0"
                                    title="Ver tareas">
                                    <i class="fas fa-tasks"></i>
                                </button>
                            </div>
                        ` : '<span class="text-gray-400">-</span>'}
                    </div>
                </td>
            `;
            
            // Meta CON BOTÓN DE TAREAS
            html += `
                <td class="px-4 py-2">
                    <div class="metas-container">
                        ${registro.meta ? `
                            <div class="meta-item flex items-center justify-between gap-2">
                                <div class="flex-1">
                                    <span class="meta-numero">${index + 1}.</span>
                                    ${this.truncate(registro.meta, 45)}
                                </div>
                                <button data-action="ver-tareas-meta" data-id="${registro.id}"
                                    class="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded hover:bg-green-50 transition-all flex-shrink-0"
                                    title="Ver tareas">
                                    <i class="fas fa-tasks"></i>
                                </button>
                            </div>
                        ` : '<span class="text-gray-400">-</span>'}
                    </div>
                </td>
            `;
            
            // Fechas (solo en primera fila con rowspan)
            if (index === 0) {
                html += `
                    <td class="px-4 py-2 align-top" rowspan="${grupo.length}">${this.formatDate(principal.inicio)}</td>
                    <td class="px-4 py-2 align-top" rowspan="${grupo.length}">${this.formatDate(principal.fin)}</td>
                `;
            }
            
            // Estado (solo en primera fila con rowspan)
            if (index === 0) {
                html += `
                    <td class="px-4 py-2 text-center align-top" rowspan="${grupo.length}">
                        <span class="estado-badge ${estadoClass}">${principal.estado}</span>
                    </td>
                `;
            }
            
            // Progreso (solo en primera fila con rowspan)
            if (index === 0) {
                html += `
                    <td class="px-4 py-2 align-top" rowspan="${grupo.length}">
                        <div class="flex items-center gap-2">
                            <div class="progress-bar flex-1">
                                <div class="progress-fill" style="width: ${progreso}%"></div>
                            </div>
                            <span class="text-xs text-gray-500">${progreso}%</span>
                        </div>
                        <span class="text-xs text-gray-400">${tareasCompletadas}/${totalTareas} tareas</span>
                    </td>
                `;
            }
            
            // Acciones (INDIVIDUAL por cada fila)
            html += `
                <td class="px-4 py-2 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button data-action="ver-tareas" data-piloto="${principal.piloto}" data-id="${registro.id}"
                            class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-2 transition-all" 
                            title="Ver tareas">
                            <i class="fas fa-tasks"></i>
                        </button>
                        ${index === 0 ? `
                            <button data-action="editar" data-piloto="${principal.piloto}"
                                class="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded p-2 transition-all" 
                                title="Editar grupo">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : `
                            <span class="inline-block w-10 h-10"></span>
                        `}
                        <button data-action="eliminar" data-id="${registro.id}" data-piloto="${principal.piloto}"
                            class="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-2 transition-all" 
                            title="Eliminar esta fila">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            html += `</tr>`;
        });
    });

    tbody.innerHTML = html;
}


    /*editarRegistro(id) {
        const registro = this.datos.find(d => d.id === id);
        if (!registro) return;

        this.registroSeleccionado = registro;
        document.getElementById('modalTitle').textContent = 'Editar Objetivo';
        document.getElementById('modalId').value = registro.id;
        document.getElementById('modalPiloto').value = registro.piloto || '';
        document.getElementById('modalGranja').value = registro.granja || '';
        document.getElementById('modalGalpon').value = registro.galpon || '';
        
        // Cargar objetivos (separados por salto de línea o pipe)
        this.cargarObjetivosEnModal(registro.objetivo || '');
        
        // Cargar metas (separadas por salto de línea o pipe)
        this.cargarMetasEnModal(registro.meta || '');
        
        document.getElementById('modalInicio').value = registro.inicio || '';
        document.getElementById('modalFin').value = registro.fin || '';
        document.getElementById('modalEstado').value = registro.estado || 'Pendiente';

        document.getElementById('modalObjetivo').classList.remove('hidden');
        document.getElementById('modalObjetivo').classList.add('flex');
    }*/

    editarRegistro(piloto) {
        // Buscar TODOS los registros con el mismo piloto
        const grupoRegistros = this.datos.filter(d => d.piloto === piloto);

        if (grupoRegistros.length === 0) return;

        const principal = grupoRegistros[0];
        this.registroSeleccionado = principal;
        this.pilotoActual = piloto; // Guardar el piloto actual

        document.getElementById('modalTitle').textContent = 'Editar Objetivo';
        document.getElementById('modalId').value = principal.id;
        document.getElementById('modalPiloto').value = principal.piloto || '';
        document.getElementById('modalGranja').value = principal.granja || '';
        document.getElementById('modalGalpon').value = principal.galpon || '';

        // Cargar TODOS los objetivos del mismo piloto
        const objetivos = grupoRegistros.map(r => r.objetivo).filter(o => o);
        this.cargarObjetivosEnModal(objetivos.join('\n'));

        // Cargar TODAS las metas del mismo piloto
        const metas = grupoRegistros.map(r => r.meta).filter(m => m);
        this.cargarMetasEnModal(metas.join('\n'));

        document.getElementById('modalInicio').value = principal.inicio || '';
        document.getElementById('modalFin').value = principal.fin || '';
        document.getElementById('modalEstado').value = principal.estado || 'Pendiente';

        document.getElementById('modalObjetivo').classList.remove('hidden');
        document.getElementById('modalObjetivo').classList.add('flex');
    }


    /*cargarObjetivosEnModal(objetivosTexto) {
        const listaObjetivos = document.getElementById('listaObjetivos');
        listaObjetivos.innerHTML = '';
        
        // Separar por saltos de línea o por pipe |
        const objetivos = objetivosTexto.split(/\n|\\|/).filter(obj => obj.trim());
        
        if (objetivos.length === 0) {
            objetivos.push(''); // Al menos uno vacío
        }
        
        objetivos.forEach((objetivo, index) => {
            const div = document.createElement('div');
            div.className = 'objetivo-item flex gap-2';
            div.innerHTML = `
                <textarea rows="2" placeholder="Describe el objetivo..." 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 objetivo-text">${objetivo.trim()}</textarea>
                <button type="button" class="btn-eliminar-objetivo text-red-600 hover:text-red-800 px-2" style="display: ${objetivos.length > 1 ? 'block' : 'none'};">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            listaObjetivos.appendChild(div);
        });
    }*/

    cargarObjetivosEnModal(objetivosTexto) {
        const listaObjetivos = document.getElementById('listaObjetivos');
        listaObjetivos.innerHTML = '';

        if (!objetivosTexto || objetivosTexto.trim() === '') {
            objetivosTexto = ''; // Vacío por defecto
        }

        // Separar SOLO por saltos de línea reales
        const objetivos = objetivosTexto.split('\n').filter(obj => obj.trim());

        if (objetivos.length === 0) {
            objetivos.push(''); // Al menos uno vacío
        }

        objetivos.forEach((objetivo, index) => {
            const div = document.createElement('div');
            div.className = 'objetivo-item flex gap-2';
            div.innerHTML = `
            <textarea rows="2" placeholder="Describe el objetivo..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 objetivo-text">${objetivo.trim()}</textarea>
            <button type="button" class="btn-eliminar-objetivo text-red-600 hover:text-red-800 px-2" style="display: ${objetivos.length > 1 ? 'block' : 'none'};">
                <i class="fas fa-trash"></i>
            </button>
        `;
            listaObjetivos.appendChild(div);
        });
    }


    cargarMetasEnModal(metasTexto) {
        const listaMetas = document.getElementById('listaMetas');
        listaMetas.innerHTML = '';

        if (!metasTexto || metasTexto.trim() === '') {
            metasTexto = ''; // Vacío por defecto
        }

        // Separar SOLO por saltos de línea reales
        const metas = metasTexto.split('\n').filter(meta => meta.trim());

        if (metas.length === 0) {
            metas.push(''); // Al menos una vacía
        }

        metas.forEach((meta, index) => {
            const div = document.createElement('div');
            div.className = 'meta-item flex gap-2';
            div.innerHTML = `
            <textarea rows="2" placeholder="Describe la meta..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 meta-text">${meta.trim()}</textarea>
            <button type="button" class="btn-eliminar-meta text-red-600 hover:text-red-800 px-2" style="display: ${metas.length > 1 ? 'block' : 'none'};">
                <i class="fas fa-trash"></i>
            </button>
        `;
            listaMetas.appendChild(div);
        });
    }

    cerrarModal() {
        document.getElementById('modalObjetivo').classList.add('hidden');
        document.getElementById('modalObjetivo').classList.remove('flex');
    }

    

    /*async guardarRegistro() {
        try {
            const objetivosTextos = Array.from(document.querySelectorAll('.objetivo-text'))
                .map(textarea => textarea.value.trim())
                .filter(texto => texto);

            const metasTextos = Array.from(document.querySelectorAll('.meta-text'))
                .map(textarea => textarea.value.trim())
                .filter(texto => texto);

            if (objetivosTextos.length === 0) {
                this.mostrarNotificacion('Debe agregar al menos un objetivo', 'error');
                return;
            }

            if (metasTextos.length === 0) {
                this.mostrarNotificacion('Debe agregar al menos una meta', 'error');
                return;
            }

            const datosBase = {
                piloto: document.getElementById('modalPiloto').value,
                granja: document.getElementById('modalGranja').value,
                galpon: document.getElementById('modalGalpon').value,
                inicio: document.getElementById('modalInicio').value,
                fin: document.getElementById('modalFin').value,
                estado: document.getElementById('modalEstado').value
            };

            const id = document.getElementById('modalId').value;

            if (id) {
                // MODO EDICIÓN: Eliminar todos los registros del mismo PILOTO
                const pilotoOriginal = this.pilotoActual || this.registroSeleccionado?.piloto;
                const grupoRegistros = this.datos.filter(d => d.piloto === pilotoOriginal);

                for (const reg of grupoRegistros) {
                    await this.service.delete(reg.id);
                }
            }

            // Crear nuevos registros
            const registros = [];
            const maxItems = Math.max(objetivosTextos.length, metasTextos.length);

            for (let i = 0; i < maxItems; i++) {
                registros.push({
                    ...datosBase,
                    objetivo: objetivosTextos[i] || objetivosTextos[0],
                    meta: metasTextos[i] || metasTextos[0]
                });
            }

            await this.service.createMultiple(registros);
            this.mostrarNotificacion(
                id ? this.config.MENSAJES.EXITO.ACTUALIZADO : this.config.MENSAJES.EXITO.GUARDADO,
                'success'
            );

            this.cerrarModal();
            await this.cargarDatos();

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.GUARDAR, 'error');
        }
    }*/

    async guardarRegistro() {
    try {
        const objetivosTextos = Array.from(document.querySelectorAll('.objetivo-text'))
            .map(textarea => textarea.value.trim())
            .filter(texto => texto);
        
        const metasTextos = Array.from(document.querySelectorAll('.meta-text'))
            .map(textarea => textarea.value.trim())
            .filter(texto => texto);

        if (objetivosTextos.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos un objetivo', 'error');
            return;
        }
        
        if (metasTextos.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos una meta', 'error');
            return;
        }

        const datosBase = {
            piloto: document.getElementById('modalPiloto').value,
            granja: document.getElementById('modalGranja').value,
            galpon: document.getElementById('modalGalpon').value,
            inicio: document.getElementById('modalInicio').value,
            fin: document.getElementById('modalFin').value,
            estado: document.getElementById('modalEstado').value
        };

        const id = document.getElementById('modalId').value;

        if (id) {
            // MODO EDICIÓN - Preservar tareas existentes
            const pilotoOriginal = this.pilotoActual || this.registroSeleccionado?.piloto;
            const grupoRegistros = this.datos.filter(d => d.piloto === pilotoOriginal);
            
            const maxItems = Math.max(objetivosTextos.length, metasTextos.length);
            
            // Actualizar registros existentes y crear nuevos si es necesario
            for (let i = 0; i < maxItems; i++) {
                const registroExistente = grupoRegistros[i];
                
                if (registroExistente) {
                    // ACTUALIZAR registro existente (mantiene el ID y sus tareas)
                    await this.service.update({
                        id: registroExistente.id,
                        ...datosBase,
                        objetivo: objetivosTextos[i] || '',
                        meta: metasTextos[i] || ''
                    });
                } else {
                    // CREAR nuevo registro si hay más objetivos/metas que registros existentes
                    await this.service.create({
                        ...datosBase,
                        objetivo: objetivosTextos[i] || '',
                        meta: metasTextos[i] || ''
                    });
                }
            }
            
            // Eliminar registros sobrantes (si ahora hay menos objetivos/metas)
            if (grupoRegistros.length > maxItems) {
                for (let i = maxItems; i < grupoRegistros.length; i++) {
                    await this.service.delete(grupoRegistros[i].id);
                }
            }

            this.mostrarNotificacion(this.config.MENSAJES.EXITO.ACTUALIZADO, 'success');
        } else {
            // MODO CREACIÓN
            const registros = [];
            const maxItems = Math.max(objetivosTextos.length, metasTextos.length);
            
            for (let i = 0; i < maxItems; i++) {
                registros.push({
                    ...datosBase,
                    objetivo: objetivosTextos[i] || '',
                    meta: metasTextos[i] || ''
                });
            }

            await this.service.createMultiple(registros);
            this.mostrarNotificacion(this.config.MENSAJES.EXITO.GUARDADO, 'success');
        }

        this.cerrarModal();
        await this.cargarDatos();
    } catch (error) {
        console.error('Error al guardar:', error);
        this.mostrarNotificacion(this.config.MENSAJES.ERROR.GUARDAR, 'error');
    }
}

async abrirSubprocesos(piloto, idObjetivo) {
    console.log('🔵 abrirSubprocesos llamado con:', { piloto, idObjetivo });
    
    // Convertir a string para comparación segura
    const idBuscado = String(idObjetivo);
    this.registroActualTareas = this.datos.find(d => String(d.id) === idBuscado);
    this.objetivoActual = this.registroActualTareas;
    
    console.log('📋 Registro encontrado:', this.registroActualTareas);
    
    if (!this.registroActualTareas) {
        console.error('❌ No se encontró registro con ID:', idBuscado);
        this.mostrarNotificacion('Registro no encontrado', 'error');
        return;
    }
    
    document.getElementById('modalSubTitle').textContent = `Tareas de: ${piloto}`;
    
    document.getElementById('subprocesosInfo').innerHTML = `
        <div class="space-y-1 text-sm">
            <div><strong>Piloto:</strong> ${this.registroActualTareas.piloto}</div>
            <div><strong>Granja:</strong> ${this.registroActualTareas.granja}</div>
            <div><strong>Galpón:</strong> ${this.registroActualTareas.galpon}</div>
        </div>
    `;
    
    await this.cargarTareasPorRegistro(idBuscado);
    
    document.getElementById('modalSubprocesos').classList.remove('hidden');
    document.getElementById('modalSubprocesos').classList.add('flex');
}

async cargarTareasPorRegistro(idObjetivo) {
    console.log('📥 cargarTareasPorRegistro con ID:', idObjetivo);
    
    try {
        // Usar el servicio correcto con el endpoint de la API
        const tareas = await this.service.getSubprocesos(idObjetivo);
        console.log('📦 Tareas recibidas:', tareas);
        
        this.tareas = tareas || [];
        this.tareasActuales = this.tareas;
        this.renderizarTareas(this.tareas);
    } catch (error) {
        console.error('❌ Error al cargar tareas:', error);
        this.mostrarNotificacion('Error al cargar las tareas', 'error');
        this.tareas = [];
        this.renderizarTareas([]);
    }
}


async eliminarRegistro(id, piloto) {
    console.log('🗑️ eliminarRegistro llamado con:', { id, piloto });
    
    if (!confirm(`¿Eliminar este registro de ${piloto}?`)) return;
    
    try {
        // Usar el servicio correcto
        await this.service.delete(id);
        this.mostrarNotificacion('Registro eliminado correctamente', 'success');
        await this.cargarDatos();
    } catch (error) {
        console.error('Error:', error);
        this.mostrarNotificacion('Error al eliminar el registro', 'error');
    }
}


    /*async eliminarRegistro(id) {
        if (!confirm(this.config.MENSAJES.CONFIRMACION.ELIMINAR)) return;

        try {
            await this.service.delete(id);
            this.mostrarNotificacion(this.config.MENSAJES.EXITO.ELIMINADO, 'success');
            await this.cargarDatos();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.ELIMINAR, 'error');
        }
    }*/

    async eliminarGrupo(piloto) {
        if (!confirm(`¿Eliminar TODOS los objetivos de "${piloto}"?\n\nSe eliminarán ${this.datos.filter(d => d.piloto === piloto).length} registros y todas sus tareas asociadas.`)) {
            return;
        }

        try {
            const grupoRegistros = this.datos.filter(d => d.piloto === piloto);

            for (const reg of grupoRegistros) {
                await this.service.delete(reg.id);
            }

            this.mostrarNotificacion(this.config.MENSAJES.EXITO.ELIMINADO, 'success');
            await this.cargarDatos();

        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.ELIMINAR, 'error');
        }
    }

    /*
    async aplicarFiltros() {
        try {
            this.mostrarCargando(true);
            const filtros = {
                fechaInicio: document.getElementById('filterFechaInicio').value,
                fechaFin: document.getElementById('filterFechaFin').value,
                granja: document.getElementById('filterGranja').value,
                estado: document.getElementById('filterEstado').value
            };

            const resultado = await this.service.getFiltered(filtros);
            this.datos = resultado.data || resultado;
            this.renderizarTabla();
            document.getElementById('totalRegistros').textContent = `(${this.datos.length} registros)`;
        } catch (error) {
            console.error('Error al filtrar:', error);
            this.mostrarNotificacion('Error al aplicar filtros', 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }*/

        async aplicarFiltros() {
    try {
        this.mostrarCargando(true);
        
        const filtros = {
            fechaInicio: document.getElementById('filterFechaInicio').value,
            fechaFin: document.getElementById('filterFechaFin').value,
            granja: document.getElementById('filterGranja').value,
            estado: document.getElementById('filterEstado').value
        };

        const resultado = await this.service.getFiltered(filtros);
        this.datos = resultado.data || resultado;
        this.renderizarTabla();
        
        // Verificar si el elemento existe antes de modificarlo
        const totalElem = document.getElementById('totalRegistros');
        if (totalElem) {
            totalElem.textContent = this.datos.length + ' registros';
        }
        
    } catch (error) {
        console.error('Error al filtrar:', error);
        this.mostrarNotificacion('Error al aplicar filtros', 'error');
    } finally {
        this.mostrarCargando(false);
    }
}


    limpiarFiltros() {
        document.getElementById('filterFechaInicio').value = '';
        document.getElementById('filterFechaFin').value = '';
        document.getElementById('filterGranja').value = '';
        document.getElementById('filterEstado').value = '';
        this.cargarDatos();
    }

    // Ver tareas de un objetivo
    async verTareas(idObjetivo) {
        try {
            // Convertir a string para comparación segura
            const idBuscado = String(idObjetivo);
            this.objetivoActual = this.datos.find(d => String(d.id) === idBuscado);
            
            console.log('🔍 verTareas - ID buscado:', idBuscado, 'Encontrado:', this.objetivoActual);
            
            const tareas = await this.service.getSubprocesos(idBuscado);

            // Calcular estadísticas de jerarquía
            const tareasPrincipales = tareas.filter(t => t.es_tarea_principal == 1).length;
            const subTareas = tareas.filter(t => t.es_tarea_principal == 0).length;

            document.getElementById('modalSubTitle').textContent = `Tareas: ${this.objetivoActual?.piloto || 'Objetivo'}`;
            document.getElementById('subprocesosInfo').innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="text-gray-600">
                        <i class="fas fa-tasks mr-1"></i>
                        ${tareas.length} tareas totales
                    </span>
                    <span class="text-blue-600 font-semibold">
                        <i class="fas fa-star mr-1"></i>
                        ${tareasPrincipales} principales
                    </span>
                    <span class="text-gray-500">
                        <i class="fas fa-angle-right mr-1"></i>
                        ${subTareas} sub-tareas
                    </span>
                </div>
            `;

            this.tareasActuales = tareas;
            this.renderizarTareas(tareas);

            document.getElementById('modalSubprocesos').classList.remove('hidden');
            document.getElementById('modalSubprocesos').classList.add('flex');
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.mostrarNotificacion('Error al cargar tareas', 'error');
        }
    }

    renderizarTareas(tareas) {
        const tbody = document.getElementById('tbodySubprocesos');

        if (tareas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No hay tareas registradas</td></tr>';
            return;
        }

        // Separar tareas principales y sub-tareas
        const tareasPrincipales = tareas.filter(t => t.es_tarea_principal == 1);
        const subTareas = tareas.filter(t => t.es_tarea_principal == 0);

        let html = '';
        let numeroPrincipal = 0;

        // Renderizar tareas principales con sus subtareas
        tareasPrincipales.forEach(tarea => {
            numeroPrincipal++;
            const estadoClass = tarea.estado_completado_pendiente === 'Completado' ? 'estado-completado' :
                tarea.estado_completado_pendiente === 'En Proceso' ? 'estado-proceso' : 'estado-pendiente';
            
            // Tarea principal
            html += `
                <tr class="hover:bg-gray-50 bg-blue-50">
                    <td class="px-3 py-2">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-blue-600">${numeroPrincipal}.</span>
                            <i class="fas fa-star text-yellow-500" title="Tarea Principal"></i>
                            <span class="font-bold">${tarea.nombre_tarea}</span>
                        </div>
                    </td>
                    <td class="px-3 py-2 text-center">${tarea.duracion_dias || '-'}</td>
                    <td class="px-3 py-2">${this.formatDate(tarea.fecha_inicio)}</td>
                    <td class="px-3 py-2">${this.formatDate(tarea.fecha_fin)}</td>
                    <td class="px-3 py-2">${tarea.nombres_recursos || '-'}</td>
                    <td class="px-3 py-2 text-center">
                        <span class="estado-badge ${estadoClass}">${tarea.estado_completado_pendiente}</span>
                    </td>
                    <td class="px-3 py-2 text-center flex gap-2 justify-center">
                        <button onclick="controller.editarTarea('${tarea.id_tarea}')" 
                            class="text-blue-600 hover:text-blue-800" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="controller.eliminarTarea('${tarea.id_tarea}')" 
                            class="text-red-600 hover:text-red-800" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;

            // Renderizar subtareas de esta tarea principal
            const subtareasDeEsta = subTareas.filter(st => st.id_tarea_padre === tarea.id_tarea);
            let numeroSubtarea = 0;
            subtareasDeEsta.forEach(subtarea => {
                numeroSubtarea++;
                const estadoClassSub = subtarea.estado_completado_pendiente === 'Completado' ? 'estado-completado' :
                    subtarea.estado_completado_pendiente === 'En Proceso' ? 'estado-proceso' : 'estado-pendiente';
                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2">
                            <div class="flex items-center gap-2 pl-6">
                                <span class="text-gray-600 font-medium">${numeroPrincipal}.${numeroSubtarea}</span>
                                <i class="fas fa-angle-right text-gray-400"></i>
                                <span>${subtarea.nombre_tarea}</span>
                            </div>
                        </td>
                        <td class="px-3 py-2 text-center">${subtarea.duracion_dias || '-'}</td>
                        <td class="px-3 py-2">${this.formatDate(subtarea.fecha_inicio)}</td>
                        <td class="px-3 py-2">${this.formatDate(subtarea.fecha_fin)}</td>
                        <td class="px-3 py-2">${subtarea.nombres_recursos || '-'}</td>
                        <td class="px-3 py-2 text-center">
                            <span class="estado-badge ${estadoClassSub}">${subtarea.estado_completado_pendiente}</span>
                        </td>
                        <td class="px-3 py-2 text-center flex gap-2 justify-center">
                            <button onclick="controller.editarTarea('${subtarea.id_tarea}')" 
                                class="text-blue-600 hover:text-blue-800" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="controller.eliminarTarea('${subtarea.id_tarea}')" 
                                class="text-red-600 hover:text-red-800" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });

        // Renderizar subtareas huérfanas (sin tarea padre asignada)
        const subtareasHuerfanas = subTareas.filter(st => !st.id_tarea_padre);
        if (subtareasHuerfanas.length > 0) {
            subtareasHuerfanas.forEach(tarea => {
                const estadoClass = tarea.estado_completado_pendiente === 'Completado' ? 'estado-completado' :
                    tarea.estado_completado_pendiente === 'En Proceso' ? 'estado-proceso' : 'estado-pendiente';
                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2">
                            <div class="flex items-center gap-2 pl-6">
                                <i class="fas fa-angle-right text-gray-400"></i>
                                <span>${tarea.nombre_tarea}</span>
                                <span class="text-xs text-orange-500">(sin asignar)</span>
                            </div>
                        </td>
                        <td class="px-3 py-2 text-center">${tarea.duracion_dias || '-'}</td>
                        <td class="px-3 py-2">${this.formatDate(tarea.fecha_inicio)}</td>
                        <td class="px-3 py-2">${this.formatDate(tarea.fecha_fin)}</td>
                        <td class="px-3 py-2">${tarea.nombres_recursos || '-'}</td>
                        <td class="px-3 py-2 text-center">
                            <span class="estado-badge ${estadoClass}">${tarea.estado_completado_pendiente}</span>
                        </td>
                        <td class="px-3 py-2 text-center flex gap-2 justify-center">
                            <button onclick="controller.editarTarea('${tarea.id_tarea}')" 
                                class="text-blue-600 hover:text-blue-800" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="controller.eliminarTarea('${tarea.id_tarea}')" 
                                class="text-red-600 hover:text-red-800" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        tbody.innerHTML = html;

        // Guardar tareas para edición
        this.tareasActuales = tareas;
    }

    cerrarModalSubprocesos() {
        document.getElementById('modalSubprocesos').classList.add('hidden');
        document.getElementById('modalSubprocesos').classList.remove('flex');
    }

    // ========== MODAL NUEVA TAREA ==========
    mostrarModalNuevaTarea() {
        if (!this.objetivoActual || !this.objetivoActual.id) {
            this.mostrarNotificacion('Error: No hay objetivo seleccionado', 'error');
            return;
        }
        
        document.getElementById('modalTareaTitle').textContent = 'Nueva Tarea';
        document.getElementById('formTarea').reset();
        document.getElementById('tareaId').value = '';
        document.getElementById('tareaIdObjetivo').value = this.objetivoActual.id;

        // Configurar selector de tipo y cargar tareas principales
        document.getElementById('tareaTipo').value = 'principal';
        document.getElementById('contenedorTareaPadre').classList.add('hidden');
        this.cargarTareasPrincipalesEnSelector();

        // Fecha por defecto: hoy
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('tareaFechaInicio').value = hoy;
        document.getElementById('tareaFechaFin').value = hoy;
        document.getElementById('tareaDuracion').value = 1;

        document.getElementById('modalTarea').classList.remove('hidden');
        document.getElementById('modalTarea').classList.add('flex');
    }

    cargarTareasPrincipalesEnSelector() {
        const select = document.getElementById('tareaPadre');
        select.innerHTML = '<option value="">-- Seleccione tarea principal --</option>';
        
        if (this.tareasActuales) {
            const principales = this.tareasActuales.filter(t => t.es_tarea_principal == 1);
            principales.forEach(t => {
                select.innerHTML += `<option value="${t.id_tarea}">${t.nombre_tarea}</option>`;
            });
        }
    }

    onTipoTareaChange() {
        const tipo = document.getElementById('tareaTipo').value;
        const contenedor = document.getElementById('contenedorTareaPadre');
        
        if (tipo === 'subtarea') {
            contenedor.classList.remove('hidden');
        } else {
            contenedor.classList.add('hidden');
        }
    }

    editarTarea(idTarea) {
        const tarea = this.tareasActuales?.find(t => t.id_tarea === idTarea);
        if (!tarea) return;

        document.getElementById('modalTareaTitle').textContent = 'Editar Tarea';
        document.getElementById('tareaId').value = tarea.id_tarea;
        document.getElementById('tareaIdObjetivo').value = tarea.id_objetivo;
        document.getElementById('tareaNombre').value = tarea.nombre_tarea || '';
        document.getElementById('tareaFechaInicio').value = tarea.fecha_inicio || '';
        document.getElementById('tareaFechaFin').value = tarea.fecha_fin || '';
        document.getElementById('tareaDuracion').value = tarea.duracion_dias || 0;
        document.getElementById('tareaRecursos').value = tarea.nombres_recursos || '';
        document.getElementById('tareaEstado').value = tarea.estado_completado_pendiente || 'Pendiente';
        
        // Configurar tipo de tarea
        this.cargarTareasPrincipalesEnSelector();
        if (tarea.es_tarea_principal == 1) {
            document.getElementById('tareaTipo').value = 'principal';
            document.getElementById('contenedorTareaPadre').classList.add('hidden');
        } else {
            document.getElementById('tareaTipo').value = 'subtarea';
            document.getElementById('contenedorTareaPadre').classList.remove('hidden');
            document.getElementById('tareaPadre').value = tarea.id_tarea_padre || '';
        }

        document.getElementById('modalTarea').classList.remove('hidden');
        document.getElementById('modalTarea').classList.add('flex');
    }

    cerrarModalTarea() {
        document.getElementById('modalTarea').classList.add('hidden');
        document.getElementById('modalTarea').classList.remove('flex');
    }

    calcularDuracion() {
        const inicio = document.getElementById('tareaFechaInicio').value;
        const fin = document.getElementById('tareaFechaFin').value;

        if (inicio && fin) {
            const fechaInicio = new Date(inicio);
            const fechaFin = new Date(fin);
            const diffTime = Math.abs(fechaFin - fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            document.getElementById('tareaDuracion').value = diffDays || 1;
        }
    }

    async guardarTarea() {
        try {
            const tipoTarea = document.getElementById('tareaTipo').value;
            const esPrincipal = tipoTarea === 'principal' ? 1 : 0;
            const idTareaPadre = tipoTarea === 'subtarea' ? document.getElementById('tareaPadre').value : null;

            // Validar que subtarea tenga padre
            if (tipoTarea === 'subtarea' && !idTareaPadre) {
                this.mostrarNotificacion('Seleccione una tarea principal para la subtarea', 'error');
                return;
            }

            const data = {
                id_objetivo: document.getElementById('tareaIdObjetivo').value,
                nombre_tarea: document.getElementById('tareaNombre').value,
                fecha_inicio: document.getElementById('tareaFechaInicio').value,
                fecha_fin: document.getElementById('tareaFechaFin').value,
                duracion_dias: parseInt(document.getElementById('tareaDuracion').value) || 1,
                nombres_recursos: document.getElementById('tareaRecursos').value,
                estado_completado_pendiente: document.getElementById('tareaEstado').value,
                es_tarea_principal: esPrincipal,
                id_tarea_padre: idTareaPadre
            };

            const idTarea = document.getElementById('tareaId').value;

            if (idTarea) {
                data.id_tarea = idTarea;
                await this.service.updateSubproceso(data);
                this.mostrarNotificacion('Tarea actualizada correctamente', 'success');
            } else {
                await this.service.createSubproceso(data);
                this.mostrarNotificacion(this.config.MENSAJES.EXITO.TAREA_GUARDADA, 'success');
            }

            this.cerrarModalTarea();
            if (this.objetivoActual && this.objetivoActual.id) {
                await this.verTareas(this.objetivoActual.id);
            }
            await this.cargarDatos();
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            this.mostrarNotificacion('Error al guardar tarea', 'error');
        }
    }

    async eliminarTarea(idTarea) {
        if (!confirm(this.config.MENSAJES.CONFIRMACION.ELIMINAR_TAREA)) return;

        try {
            await this.service.deleteSubproceso(idTarea);
            this.mostrarNotificacion(this.config.MENSAJES.EXITO.TAREA_ELIMINADA, 'success');
            if (this.objetivoActual && this.objetivoActual.id) {
                await this.verTareas(this.objetivoActual.id);
            }
            await this.cargarDatos();
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            this.mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    }

    exportarExcel() {
        // Exportar a CSV simple
        const headers = ['Piloto', 'Granja', 'Galpón', 'Objetivo', 'Meta', 'Inicio', 'Fin', 'Estado'];
        const rows = this.datos.map(d => [
            d.piloto, d.granja, d.galpon, d.objetivo, d.meta, d.inicio, d.fin, d.estado
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell || ''}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'control_objetivos.csv';
        a.click();
        URL.revokeObjectURL(url);

        this.mostrarNotificacion('Archivo exportado correctamente', 'success');
    }

    mostrarCargando(mostrar) {
        const loading = document.getElementById('loadingTable');
        if (loading) {
            loading.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarNotificacion(mensaje, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        toastMessage.textContent = mensaje;
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`;
        toastIcon.className = `fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // ==================== FUNCIONES AUXILIARES ====================

    truncate(text, length) {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-PE');
    }

    mostrarCargando(mostrar) {
        const loadingTable = document.getElementById('loadingTable');
        const tabla = document.getElementById('tablaObjetivos');
        const emptyState = document.getElementById('emptyState');

        if (loadingTable && tabla) {
            if (mostrar) {
                loadingTable.classList.remove('hidden');
                tabla.classList.add('hidden');
                if (emptyState) emptyState.classList.add('hidden');
            } else {
                loadingTable.classList.add('hidden');
                tabla.classList.remove('hidden');
            }
        }
    }

    mostrarNotificacion(mensaje, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        if (!toast || !toastMessage || !toastIcon) return;

        // Configurar colores según tipo
        const config = {
            success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
            error: { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
            warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
            info: { bg: 'bg-blue-500', icon: 'fa-info-circle' }
        };

        const { bg, icon } = config[tipo] || config.success;

        // Limpiar clases anteriores
        toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${bg}`;
        toastIcon.className = `fas ${icon}`;
        toastMessage.textContent = mensaje;

        // Mostrar
        toast.classList.remove('hidden');
        toast.style.transform = 'translateY(0)';

        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }


}

