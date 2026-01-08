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
    }

    async init() {
        this.setupEventListeners();
        this.setupToggleFiltros();
        this.setupColumnToggle();
        this.setupTableEventListeners();
        await this.cargarGranjas();
        await this.cargarDatos();
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        const events = {
            'btnNuevo': () => this.mostrarModalNuevo(),
            'btnExportar': () => this.exportarExcel(),
            'btnLimpiarFiltros': () => this.limpiarFiltros(),
            'btnAplicarFiltros': () => this.aplicarFiltros(),
            'btnCancelar': () => this.cerrarModal(),
            'btnCerrarSubprocesos': () => this.cerrarModalSubprocesos(),
            'btnNuevaTarea': () => this.mostrarModalNuevaTarea(),
            'btnCancelarTarea': () => this.cerrarModalTarea(),
            'btnCerrarTarea': () => this.cerrarModalTarea()
        };

        Object.entries(events).forEach(([id, handler]) => {
            document.getElementById(id)?.addEventListener('click', handler);
        });

        document.getElementById('formObjetivo')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarRegistro();
        });

        document.getElementById('formTarea')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarTarea();
        });

        ['tareaFechaInicio', 'tareaFechaFin'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.calcularDuracion());
        });

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

            const { action, id, piloto } = button.dataset;
            const actions = {
                'ver-tareas': () => this.abrirSubprocesos(piloto, id),
                'ver-tareas-obj': () => this.abrirSubprocesos(piloto, id),
                'ver-tareas-meta': () => this.abrirSubprocesos(piloto, id),
                'editar': () => this.editarRegistro(piloto),
                'eliminar': () => this.eliminarRegistro(id, piloto)
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

    // ==================== CARGA Y RENDERIZADO DE DATOS ====================
    async cargarDatos() {
        try {
            this.mostrarCargando(true);
            const response = await this.service.getAll();
            this.datos = response.data || response || [];
            this.renderizarTabla();
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.CARGAR, 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }

    renderizarTabla() {
        const tbody = document.getElementById('tbodyObjetivos');
        const emptyState = document.getElementById('emptyState');

        if (!tbody) return;

        if (this.datos.length === 0) {
            emptyState?.classList.remove('hidden');
            tbody.innerHTML = '';
            return;
        }

        emptyState?.classList.add('hidden');
        const grupos = this.agruparPorPiloto(this.datos);
        tbody.innerHTML = Object.values(grupos).map(grupo => this.renderizarGrupo(grupo)).join('');
    }

    agruparPorPiloto(datos) {
        return datos.reduce((grupos, item) => {
            const piloto = item.piloto || 'Sin piloto';
            if (!grupos[piloto]) grupos[piloto] = [];
            grupos[piloto].push(item);
            return grupos;
        }, {});
    }

    renderizarGrupo(grupo) {
        const principal = grupo[0];
        const totalTareas = grupo.reduce((sum, item) => sum + parseInt(item.total_tareas || 0, 10), 0);
        const tareasCompletadas = grupo.reduce((sum, item) => sum + parseInt(item.tareas_completadas || 0, 10), 0);
        const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
        const estadoClass = this.getEstadoClass(principal.estado);

        return grupo.map((registro, index) => this.renderizarFila(registro, grupo, index, progreso, estadoClass, totalTareas, tareasCompletadas)).join('');
    }

    renderizarFila(registro, grupo, index, progreso, estadoClass, totalTareas, tareasCompletadas) {
        const principal = grupo[0];
        const isFirst = index === 0;
        const rowspan = grupo.length;

        return `
            <tr class="grupo-row hover:bg-gray-50 transition-colors">
                ${isFirst ? `
                    <td class="px-4 py-2 align-top font-medium" rowspan="${rowspan}">
                        <div class="flex items-center gap-2">
                            <span class="badge-grupo">${rowspan}</span>
                            <span>${this.truncate(principal.piloto, 40)}</span>
                        </div>
                    </td>
                ` : ''}
                <td class="px-4 py-2 align-top">${registro.granja || '-'}</td>
                <td class="px-4 py-2 align-top">${registro.galpon || '-'}</td>
                ${this.renderizarCelda(registro.objetivo, 'objetivo', registro.id, index)}
                ${this.renderizarCelda(registro.meta, 'meta', registro.id, index)}
                ${isFirst ? `
                    <td class="px-4 py-2 align-top" rowspan="${rowspan}">${this.formatDate(principal.inicio)}</td>
                    <td class="px-4 py-2 align-top" rowspan="${rowspan}">${this.formatDate(principal.fin)}</td>
                    <td class="px-4 py-2 text-center align-top" rowspan="${rowspan}">
                        <span class="estado-badge ${estadoClass}">${principal.estado}</span>
                    </td>
                    <td class="px-4 py-2 align-top" rowspan="${rowspan}">
                        <div class="flex items-center gap-2">
                            <div class="progress-bar flex-1">
                                <div class="progress-fill" style="width: ${progreso}%"></div>
                            </div>
                            <span class="text-xs text-gray-500">${progreso}%</span>
                        </div>
                        <span class="text-xs text-gray-400">${tareasCompletadas}/${totalTareas} tareas</span>
                    </td>
                ` : ''}
                ${this.renderizarAcciones(registro, principal, isFirst)}
            </tr>
        `;
    }

    renderizarCelda(contenido, tipo, id, index) {
        const color = tipo === 'objetivo' ? 'blue' : 'green';
        return `
            <td class="px-4 py-2">
                <div class="${tipo}s-container">
                    ${contenido ? `
                        <div class="${tipo}-item flex items-center justify-between gap-2">
                            <div class="flex-1">
                                <span class="${tipo}-numero">${index + 1}.</span>
                                ${this.truncate(contenido, 45)}
                            </div>
                            <button data-action="ver-tareas-${tipo === 'objetivo' ? 'obj' : 'meta'}" data-id="${id}"
                                class="text-${color}-500 hover:text-${color}-700 text-xs px-2 py-1 rounded hover:bg-${color}-50 transition-all flex-shrink-0"
                                title="Ver tareas">
                                <i class="fas fa-tasks"></i>
                            </button>
                        </div>
                    ` : '<span class="text-gray-400">-</span>'}
                </div>
            </td>
        `;
    }

    renderizarAcciones(registro, principal, isFirst) {
        return `
            <td class="px-4 py-2 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button data-action="ver-tareas" data-piloto="${principal.piloto}" data-id="${registro.id}"
                        class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-2 transition-all" 
                        title="Ver tareas">
                        <i class="fas fa-tasks"></i>
                    </button>
                    ${isFirst ? `
                        <button data-action="editar" data-piloto="${principal.piloto}"
                            class="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded p-2 transition-all" 
                            title="Editar grupo">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : '<span class="inline-block w-10 h-10"></span>'}
                    <button data-action="eliminar" data-id="${registro.id}" data-piloto="${principal.piloto}"
                        class="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-2 transition-all" 
                        title="Eliminar esta fila">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    }

    // ==================== MODAL Y FORMULARIOS ====================
    mostrarModalNuevo() {
        this.registroSeleccionado = null;
        this.pilotoActual = null;
        
        document.getElementById('modalTitle').textContent = 'Nuevo Objetivo';
        document.getElementById('formObjetivo').reset();
        document.getElementById('modalId').value = '';
        
        this.limpiarListasObjetivosMetas();
        this.inicializarGranjasGalpones();
        this.toggleModal('modalObjetivo', true);
    }

    inicializarGranjasGalpones() {
        const lista = document.getElementById('listaGranjasGalpones');
        lista.innerHTML = '';
        this.agregarItemGranjaGalpon();

        let btnAgregar = document.getElementById('btnAgregarGranjaGalpon');
        if (!btnAgregar) {
            btnAgregar = document.createElement('button');
            btnAgregar.id = 'btnAgregarGranjaGalpon';
            btnAgregar.type = 'button';
            btnAgregar.className = 'mt-2 mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition';
            btnAgregar.innerHTML = '<i class="fas fa-plus"></i> Agregar Granja/Galpón';
            lista.parentElement.appendChild(btnAgregar);
        }
        btnAgregar.onclick = () => this.agregarItemGranjaGalpon();
    }

    agregarItemGranjaGalpon(combo = { granja: '', galpon: '' }, mostrarBotonEliminar = true) {
        const lista = document.getElementById('listaGranjasGalpones');
        const item = this.crearItemGranjaGalpon(combo, mostrarBotonEliminar);
        lista.appendChild(item);

        const btnEliminar = item.querySelector('.btn-eliminar-granja-galpon');
        btnEliminar.onclick = () => {
            item.remove();
            const items = lista.querySelectorAll('.granja-galpon-item');
            if (items.length === 1) {
                items[0].querySelector('.btn-eliminar-granja-galpon').style.display = 'none';
            }
        };

        const items = lista.querySelectorAll('.granja-galpon-item');
        items.forEach(el => {
            el.querySelector('.btn-eliminar-granja-galpon').style.display = (items.length > 1) ? 'block' : 'none';
        });

        setTimeout(() => {
            this.poblarSelectGranjas(item.querySelector('.granja-select'));
            item.querySelector('.granja-select').addEventListener('change', (e) => {
                this.cargarGalponesParaSelect(e.target);
            });
        }, 100);
    }

    crearItemGranjaGalpon(combo, mostrarBotonEliminar) {
        const codigoGranja = combo.granja ? combo.granja.split(' - ')[0].trim() : '';
        const codigoGalpon = combo.galpon ? combo.galpon.split(' - ')[0].trim() : '';

        const item = document.createElement('div');
        item.className = 'granja-galpon-item flex gap-2';
        item.innerHTML = `
            <select class="granja-select flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required>
                <option value="">-- Seleccione granja --</option>
            </select>
            <select class="galpon-select flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">-- Seleccione granja primero --</option>
            </select>
            <button type="button" class="btn-eliminar-granja-galpon text-red-600 hover:text-red-800 px-2" style="display: ${mostrarBotonEliminar ? 'block' : 'none'};">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        const granjaSelect = item.querySelector('.granja-select');
        const galponSelect = item.querySelector('.galpon-select');
        
        if (this.granjasDisponibles.length > 0) {
            this.poblarSelectGranjas(granjaSelect);
            if (codigoGranja) {
                granjaSelect.value = codigoGranja;
                this.cargarGalponesParaSelect(granjaSelect).then(() => {
                    if (codigoGalpon) galponSelect.value = codigoGalpon;
                });
            }
        }
        
        return item;
    }

    limpiarListasObjetivosMetas() {
        const templates = {
            objetivo: { clase: 'objetivo', placeholder: 'Describe el objetivo...' },
            meta: { clase: 'meta', placeholder: 'Describe la meta...' }
        };

        Object.entries(templates).forEach(([tipo, config]) => {
            const lista = document.getElementById(`lista${tipo.charAt(0).toUpperCase() + tipo.slice(1)}s`);
            lista.innerHTML = `
                <div class="${config.clase}-item flex gap-2">
                    <textarea rows="2" placeholder="${config.placeholder}" 
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${config.clase}-text"></textarea>
                    <button type="button" class="btn-eliminar-${config.clase} text-red-600 hover:text-red-800 px-2" style="display: none;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }

    editarRegistro(piloto) {
        const grupoRegistros = this.datos.filter(d => d.piloto === piloto);
        if (grupoRegistros.length === 0) return;

        const principal = grupoRegistros[0];
        this.registroSeleccionado = principal;
        this.pilotoActual = piloto;

        document.getElementById('modalTitle').textContent = 'Editar Objetivo';
        document.getElementById('modalId').value = principal.id;
        document.getElementById('modalPiloto').value = principal.piloto || '';

        this.cargarGranjasGalponesDeGrupo(grupoRegistros);
        this.cargarObjetivosMetasDeGrupo(grupoRegistros);

        document.getElementById('modalInicio').value = principal.inicio || '';
        document.getElementById('modalFin').value = principal.fin || '';
        document.getElementById('modalEstado').value = principal.estado || 'Pendiente';

        this.toggleModal('modalObjetivo', true);
    }

    cargarGranjasGalponesDeGrupo(grupoRegistros) {
        const lista = document.getElementById('listaGranjasGalpones');
        lista.innerHTML = '';

        const combinacionesUnicas = this.obtenerCombinacionesUnicas(grupoRegistros);
        combinacionesUnicas.forEach((combo, index) => {
            const item = this.crearItemGranjaGalpon(combo, combinacionesUnicas.length > 1);
            lista.appendChild(item);

            const btnEliminar = item.querySelector('.btn-eliminar-granja-galpon');
            btnEliminar.onclick = () => {
                item.remove();
                const items = lista.querySelectorAll('.granja-galpon-item');
                if (items.length === 1) {
                    items[0].querySelector('.btn-eliminar-granja-galpon').style.display = 'none';
                }
            };

            setTimeout(() => {
                this.poblarSelectGranjas(item.querySelector('.granja-select'));
                item.querySelector('.granja-select').addEventListener('change', (e) => {
                    this.cargarGalponesParaSelect(e.target);
                });
            }, 100);
        });
    }

    obtenerCombinacionesUnicas(registros) {
        const combinaciones = [];
        const vistos = new Set();
        
        registros.forEach(reg => {
            const clave = `${reg.granja}|${reg.galpon}`;
            if (!vistos.has(clave)) {
                vistos.add(clave);
                combinaciones.push({ granja: reg.granja, galpon: reg.galpon });
            }
        });
        
        return combinaciones.length > 0 ? combinaciones : [{ granja: '', galpon: '' }];
    }

    cargarObjetivosMetasDeGrupo(grupoRegistros) {
        const objetivos = [...new Set(grupoRegistros.map(r => r.objetivo).filter(o => o))];
        const metas = [...new Set(grupoRegistros.map(r => r.meta).filter(m => m))];
        
        this.cargarItemsEnModal('Objetivos', objetivos);
        this.cargarItemsEnModal('Metas', metas);
    }

    cargarItemsEnModal(tipo, items) {
        const lista = document.getElementById(`lista${tipo}`);
        lista.innerHTML = '';

        if (items.length === 0) {
            this.limpiarListasObjetivosMetas();
            return;
        }

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `${tipo.toLowerCase().slice(0, -1)}-item flex gap-2`;
            itemDiv.innerHTML = `
                <textarea rows="2" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${tipo.toLowerCase().slice(0, -1)}-text">${item}</textarea>
                <button type="button" class="btn-eliminar-${tipo.toLowerCase().slice(0, -1)} text-red-600 hover:text-red-800 px-2" style="display: ${items.length > 1 ? 'block' : 'none'};">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            lista.appendChild(itemDiv);
        });
    }

    // ==================== GUARDAR Y ACTUALIZAR ====================
    async guardarRegistro() {
        try {
            const objetivosTextos = this.obtenerTextosDeTextareas('.objetivo-text');
            const metasTextos = this.obtenerTextosDeTextareas('.meta-text');
            const granjasGalpones = this.obtenerGranjasGalpones();

            if (!this.validarDatosGuardado(objetivosTextos, metasTextos, granjasGalpones)) return;

            const datosComunes = this.obtenerDatosComunesFormulario();
            const id = document.getElementById('modalId').value;

            if (id) {
                await this.actualizarRegistrosExistentes(objetivosTextos, metasTextos, granjasGalpones, datosComunes);
            } else {
                await this.crearNuevosRegistros(objetivosTextos, metasTextos, granjasGalpones, datosComunes);
            }

            this.cerrarModal();
            await this.cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.GUARDAR, 'error');
        }
    }

    obtenerTextosDeTextareas(selector) {
        return Array.from(document.querySelectorAll(selector))
            .map(textarea => textarea.value.trim())
            .filter(texto => texto);
    }

    obtenerGranjasGalpones() {
        const granjasGalpones = [];
        document.querySelectorAll('.granja-galpon-item').forEach(item => {
            const granjaSelect = item.querySelector('.granja-select');
            const galponSelect = item.querySelector('.galpon-select');

            if (granjaSelect?.value) {
                const codigoGranja = granjaSelect.value;
                const nombreGranja = granjaSelect.selectedOptions[0]?.dataset.nombre || '';
                const codigoGalpon = galponSelect?.value || '';
                const nombreGalpon = galponSelect?.selectedOptions[0]?.dataset.nombre || '';

                granjasGalpones.push({
                    granja: `${codigoGranja} - ${nombreGranja}`.trim(),
                    galpon: codigoGalpon ? `${codigoGalpon} - ${nombreGalpon}`.trim() : ''
                });
            }
        });
        return granjasGalpones;
    }

    validarDatosGuardado(objetivos, metas, granjas) {
        if (objetivos.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos un objetivo', 'error');
            return false;
        }
        if (metas.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos una meta', 'error');
            return false;
        }
        if (granjas.length === 0) {
            this.mostrarNotificacion('Debe seleccionar al menos una granja', 'error');
            return false;
        }
        return true;
    }

    obtenerDatosComunesFormulario() {
        return {
            piloto: document.getElementById('modalPiloto').value,
            inicio: document.getElementById('modalInicio').value,
            fin: document.getElementById('modalFin').value,
            estado: document.getElementById('modalEstado').value
        };
    }

    async actualizarRegistrosExistentes(objetivos, metas, granjasGalpones, datosComunes) {
        const pilotoOriginal = this.pilotoActual || this.registroSeleccionado?.piloto;
        const grupoRegistros = this.datos.filter(d => d.piloto === pilotoOriginal);
        
        // Crear mapa de registros existentes por clave granja|galpon|objetivo|meta
        const registrosMap = new Map();
        grupoRegistros.forEach(reg => {
            const clave = `${reg.granja}|${reg.galpon}|${reg.objetivo}|${reg.meta}`;
            registrosMap.set(clave, reg);
        });

        // Crear conjunto de claves nuevas
        const clavesNuevas = new Set();
        const registrosParaCrear = [];

        // Procesar combinaciones
        for (const combo of granjasGalpones) {
            const maxItems = Math.max(objetivos.length, metas.length);
            
            for (let i = 0; i < maxItems; i++) {
                const objetivo = objetivos[i] || '';
                const meta = metas[i] || '';
                const clave = `${combo.granja}|${combo.galpon}|${objetivo}|${meta}`;
                clavesNuevas.add(clave);

                const payload = {
                    ...datosComunes,
                    granja: combo.granja,
                    galpon: combo.galpon,
                    objetivo,
                    meta
                };

                if (registrosMap.has(clave)) {
                    // Actualizar existente
                    const regExistente = registrosMap.get(clave);
                    await this.service.update({ id: regExistente.id, ...payload });
                } else {
                    // Marcar para crear
                    registrosParaCrear.push(payload);
                }
            }
        }

        // Eliminar registros que ya no existen
        for (const [clave, reg] of registrosMap) {
            if (!clavesNuevas.has(clave)) {
                await this.service.delete(reg.id);
            }
        }

        // Crear nuevos registros
        if (registrosParaCrear.length > 0) {
            const primerIdExistente = grupoRegistros[0]?.id;
            for (const payload of registrosParaCrear) {
                const nuevoRegistro = await this.service.create(payload);
                const idNuevo = nuevoRegistro?.data?.id || nuevoRegistro?.id;
                
                // Copiar tareas del primer registro existente
                if (primerIdExistente && idNuevo) {
                    await this.copiarTareasDelGrupo(primerIdExistente, idNuevo);
                }
            }
        }

        this.mostrarNotificacion(this.config.MENSAJES.EXITO.ACTUALIZADO, 'success');
    }

    async crearNuevosRegistros(objetivos, metas, granjasGalpones, datosComunes) {
        const maxItems = Math.max(objetivos.length, metas.length);
        let primerIdCreado = null;

        for (const combo of granjasGalpones) {
            for (let i = 0; i < maxItems; i++) {
                const payload = {
                    ...datosComunes,
                    granja: combo.granja,
                    galpon: combo.galpon,
                    objetivo: objetivos[i] || '',
                    meta: metas[i] || ''
                };
                
                const nuevoRegistro = await this.service.create(payload);
                const idNuevo = nuevoRegistro?.data?.id || nuevoRegistro?.id;
                
                if (primerIdCreado === null && idNuevo) {
                    primerIdCreado = idNuevo;
                } else if (primerIdCreado && idNuevo && primerIdCreado !== idNuevo) {
                    await this.copiarTareasDelGrupo(primerIdCreado, idNuevo);
                }
            }
        }

        this.mostrarNotificacion(this.config.MENSAJES.EXITO.GUARDADO, 'success');
    }

    async copiarTareasDelGrupo(idOrigen, idDestino) {
        try {
            const tareasOrigen = await this.service.getSubprocesos(idOrigen);
            
            if (tareasOrigen?.length > 0) {
                for (const tarea of tareasOrigen) {
                    await this.service.createSubproceso({
                        id_objetivo: idDestino,
                        nombre_tarea: tarea.nombre_tarea,
                        fecha_inicio: tarea.fecha_inicio,
                        fecha_fin: tarea.fecha_fin,
                        duracion_dias: tarea.duracion_dias,
                        nombres_recursos: tarea.nombres_recursos,
                        presupuesto: tarea.presupuesto,
                        estado_completado_pendiente: tarea.estado_completado_pendiente,
                        es_tarea_principal: tarea.es_tarea_principal,
                        id_tarea_padre: tarea.id_tarea_padre
                    });
                }
            }
        } catch (error) {
            console.error('Error al copiar tareas:', error);
        }
    }

    async eliminarRegistro(id, piloto) {
        if (!confirm(`¿Eliminar este registro de ${piloto}?`)) return;
        
        try {
            await this.service.delete(id);
            this.mostrarNotificacion(this.config.MENSAJES.EXITO.ELIMINADO, 'success');
            await this.cargarDatos();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.mostrarNotificacion(this.config.MENSAJES.ERROR.ELIMINAR, 'error');
        }
    }

    // ==================== TAREAS/SUBPROCESOS ====================
    async abrirSubprocesos(piloto, idObjetivo) {
        const idBuscado = String(idObjetivo);
        this.objetivoActual = this.datos.find(d => String(d.id) === idBuscado);
        
        if (!this.objetivoActual) {
            this.mostrarNotificacion('No se encontró el objetivo', 'error');
            return;
        }
        
        const titulo = this.objetivoActual.objetivo || this.objetivoActual.meta || this.objetivoActual.piloto || 'Sin piloto';
        document.getElementById('modalSubTitle').textContent = `Tareas de: ${titulo}`;
        document.getElementById('subprocesosInfo').innerHTML = this.generarInfoSubprocesos(this.objetivoActual);
        
        await this.cargarTareasPorRegistro(idBuscado);
        this.toggleModal('modalSubprocesos', true);
    }

    generarInfoSubprocesos(registro) {
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

    async cargarTareasPorRegistro(idObjetivo) {
        try {
            const tareas = await this.service.getSubprocesos(idObjetivo);
            this.tareasActuales = Array.isArray(tareas) ? tareas : [];
            this.renderizarTareas(this.tareasActuales);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.tareasActuales = [];
            this.renderizarTareas([]);
        }
    }

    renderizarTareas(tareas) {
        const tbody = document.getElementById('tbodySubprocesos');

        if (tareas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No hay tareas registradas</td></tr>';
            return;
        }

        const arbolTareas = this.construirArbolTareas(tareas);
        tbody.innerHTML = arbolTareas.map((tarea, idx) => 
            this.renderizarTareaConHijos(tarea, [], idx + 1)
        ).join('');
    }

    renderizarTareaConHijos(tarea, numeracion, numeroEnNivel) {
        const nuevaNumeracion = numeracion.length === 0 ? [numeroEnNivel] : [...numeracion, numeroEnNivel];
        const nivel = nuevaNumeracion.length - 1;
        const estadoClass = this.getEstadoClass(tarea.estado_completado_pendiente);
        
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
                <td class="px-3 py-2 text-sm">${this.formatDate(tarea.fecha_inicio)}</td>
                <td class="px-3 py-2 text-sm">${this.formatDate(tarea.fecha_fin)}</td>
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
                this.renderizarTareaConHijos(hijo, nuevaNumeracion, idx + 1)
            ).join('');
        }

        return html;
    }

    mostrarModalNuevaTarea() {
        document.getElementById('modalTareaTitle').textContent = 'Nueva Tarea';
        document.getElementById('formTarea').reset();
        document.getElementById('tareaId').value = '';
        
        document.getElementById('tareaTipo').value = 'principal';
        document.getElementById('tareaTareaPadre').disabled = true;
        document.getElementById('tareaTareaPadre').value = '';
        
        this.cargarTareasPrincipalesEnSelector();
        this.toggleModal('modalTarea', true);
    }

    cargarTareasPrincipalesEnSelector() {
        const select = document.getElementById('tareaTareaPadre');
        select.innerHTML = '<option value="">-- Seleccione tarea principal --</option>';
        
        const arbolTareas = this.construirArbolTareas(this.tareasActuales);
        const tareaEditandoId = document.getElementById('tareaId').value;
        
        this.renderizarOpcionesTareasJerarquicas(arbolTareas, select, tareaEditandoId, 0);
    }

    construirArbolTareas(tareas) {
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

    renderizarOpcionesTareasJerarquicas(tareas, select, tareaEditandoId, nivel) {
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
                this.renderizarOpcionesTareasJerarquicas(tarea.hijos, select, tareaEditandoId, nivel + 1);
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

    onTipoTareaChange() {
        const tipo = document.getElementById('tareaTipo').value;
        const selectPadre = document.getElementById('tareaTareaPadre');
        
        if (tipo === 'subtarea') {
            selectPadre.disabled = false;
            this.cargarTareasPrincipalesEnSelector();
        } else {
            selectPadre.disabled = true;
            selectPadre.value = '';
        }
    }

    editarTarea(idTarea) {
        const tarea = this.tareasActuales.find(t => String(t.id_tarea) === String(idTarea));
        if (!tarea) return;

        document.getElementById('modalTareaTitle').textContent = 'Editar Tarea';
        document.getElementById('tareaId').value = tarea.id_tarea;
        document.getElementById('tareaNombre').value = tarea.nombre_tarea;
        document.getElementById('tareaFechaInicio').value = tarea.fecha_inicio;
        document.getElementById('tareaFechaFin').value = tarea.fecha_fin;
        document.getElementById('tareaDuracion').value = tarea.duracion_dias;
        document.getElementById('tareaRecursos').value = tarea.nombres_recursos || '';
        document.getElementById('tareaPresupuesto').value = tarea.presupuesto || '';
        document.getElementById('tareaEstado').value = tarea.estado_completado_pendiente;

        const esPrincipal = !tarea.id_tarea_padre;
        document.getElementById('tareaTipo').value = esPrincipal ? 'principal' : 'subtarea';
        
        this.cargarTareasPrincipalesEnSelector();
        
        if (!esPrincipal) {
            document.getElementById('tareaTareaPadre').disabled = false;
            document.getElementById('tareaTareaPadre').value = tarea.id_tarea_padre || '';
        } else {
            document.getElementById('tareaTareaPadre').disabled = true;
        }

        this.toggleModal('modalTarea', true);
    }

    calcularDuracion() {
        const inicio = document.getElementById('tareaFechaInicio').value;
        const fin = document.getElementById('tareaFechaFin').value;
        
        if (inicio && fin) {
            const dias = Math.ceil((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('tareaDuracion').value = dias > 0 ? dias : 1;
        }
    }

    async guardarTarea() {
        try {
            const esPrincipal = document.getElementById('tareaTipo').value === 'principal';
            const payload = {
                id_objetivo: this.objetivoActual.id,
                nombre_tarea: document.getElementById('tareaNombre').value,
                fecha_inicio: document.getElementById('tareaFechaInicio').value,
                fecha_fin: document.getElementById('tareaFechaFin').value,
                duracion_dias: document.getElementById('tareaDuracion').value,
                nombres_recursos: document.getElementById('tareaRecursos').value,
                presupuesto: document.getElementById('tareaPresupuesto').value || null,
                estado_completado_pendiente: document.getElementById('tareaEstado').value,
                es_tarea_principal: esPrincipal ? 1 : 0,
                id_tarea_padre: esPrincipal ? null : document.getElementById('tareaTareaPadre').value || null
            };

            const tareaId = document.getElementById('tareaId').value;

            if (tareaId) {
                await this.service.updateSubproceso({ id_tarea: tareaId, ...payload });
                this.mostrarNotificacion('Tarea actualizada correctamente', 'success');
            } else {
                await this.service.createSubproceso(payload);
                this.mostrarNotificacion('Tarea creada correctamente', 'success');
            }

            this.cerrarModalTarea();
            await this.cargarTareasPorRegistro(this.objetivoActual.id);
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            this.mostrarNotificacion('Error al guardar la tarea', 'error');
        }
    }

    async eliminarTarea(idTarea) {
        if (!confirm('¿Está seguro de eliminar esta tarea?')) return;
        
        try {
            await this.service.deleteSubproceso(idTarea);
            this.mostrarNotificacion('Tarea eliminada correctamente', 'success');
            await this.cargarTareasPorRegistro(this.objetivoActual.id);
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            this.mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    }

    // ==================== FILTROS ====================
    async aplicarFiltros() {
        const filtros = {
            piloto: document.getElementById('filtroPiloto')?.value,
            granja: document.getElementById('filtroGranja')?.value,
            estado: document.getElementById('filtroEstado')?.value,
            fechaInicio: document.getElementById('filtroFechaInicio')?.value,
            fechaFin: document.getElementById('filtroFechaFin')?.value
        };

        try {
            this.mostrarCargando(true);
            const response = await this.service.getAll(filtros);
            this.datos = response.data || response || [];
            this.renderizarTabla();
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            this.mostrarNotificacion('Error al aplicar filtros', 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }

    limpiarFiltros() {
        document.getElementById('filtroPiloto').value = '';
        document.getElementById('filtroGranja').value = '';
        document.getElementById('filtroEstado').value = '';
        document.getElementById('filtroFechaInicio').value = '';
        document.getElementById('filtroFechaFin').value = '';
        this.cargarDatos();
    }

    // ==================== GRANJAS Y GALPONES ====================
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

    // ==================== UTILIDADES ====================
    getEstadoClass(estado) {
        const classes = {
            'Pendiente': 'estado-pendiente',
            'En Proceso': 'estado-enproceso',
            'Completado': 'estado-completado'
        };
        return classes[estado] || 'estado-pendiente';
    }

    truncate(text, length) {
        return text && text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatDate(dateStr) {
        return dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES') : '-';
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        modal?.classList.toggle('hidden', !show);
    }

    cerrarModal() { this.toggleModal('modalObjetivo', false); }
    cerrarModalSubprocesos() { this.toggleModal('modalSubprocesos', false); }
    cerrarModalTarea() { this.toggleModal('modalTarea', false); }

    mostrarCargando(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (mostrar) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.controller = new ControlObjetivosController();
    window.controller.init();
});
