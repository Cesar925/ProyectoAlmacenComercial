class DashboardController {
    constructor() {
        this.service = new ControlObjetivosService();
        this.datosObjetivos = [];
        this.datosTareas = [];

        this.filtroActual = {
            piloto: 'todos',
            estado: 'todos',
            fechaInicio: null,
            fechaFin: null
        };
    }

    async init() {
        this.actualizarHora();
        this.inicializarFiltros();
        this.setupEventListeners();
        await this.cargarDatosDashboard();
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        const btnRecargar = document.getElementById('btnRecargar');
        if (btnRecargar) {
            btnRecargar.addEventListener('click', (e) => {
                e.preventDefault();
                this.recargarDatos();
            });
        }

        const btnFiltrar = document.getElementById('btnFiltrar');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', (e) => {
                e.preventDefault();
                this.renderizarGanttVisual();
            });
        }

        const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', (e) => {
                e.preventDefault();
                this.limpiarFiltros();
            });
        }

          const filtroPiloto = document.getElementById('filtroPiloto');
        if (filtroPiloto) {
            filtroPiloto.addEventListener('change', (e) => {
                this.filtroActual.piloto = e.target.value;
                // Aplicar filtro automáticamente al cambiar
                this.aplicarFiltros();
            });
        }

         const filtroEstado = document.getElementById('filtroEstado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                this.filtroActual.estado = e.target.value;
                // Aplicar filtro automáticamente al cambiar
                this.aplicarFiltros();
            });
        }


        // Evento para el botón "Ver todo" de tareas activas
        const btnVerTodoTareas = document.getElementById('btnVerTodoTareas');
        if (btnVerTodoTareas) {
            btnVerTodoTareas.addEventListener('click', (e) => {
                e.preventDefault();
                const lista = document.getElementById('listaTareasRecientes');
                if (lista) {
                    lista.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

     /**
     * Obtiene la lista única de pilotos desde los objetivos cargados
     */
    obtenerListaPilotos() {
        const pilotos = [...new Set(this.datosObjetivos.map(obj => obj.piloto).filter(Boolean))];
        return pilotos.sort((a, b) => a.localeCompare(b, 'es'));
    }

    /**
     * Puebla el dropdown de pilotos con los datos disponibles
     */
poblarFiltroPilotos() {
        const selectPiloto = document.getElementById('filtroPiloto');
        if (!selectPiloto) return;

        const pilotos = this.obtenerListaPilotos();
        
        // Limpiar opciones existentes excepto "Todos"
        selectPiloto.innerHTML = '<option value="todos">📋 Todos los objetivos del piloto</option>';

        // Agregar opciones de pilotos
        pilotos.forEach(piloto => {
            const option = document.createElement('option');
            option.value = piloto;
            option.textContent = piloto;
            selectPiloto.appendChild(option);
        });

        console.log(`✓ ${pilotos.length} objetivos cargados en el filtro`);
    }

    obtenerObjetivosFiltrados() {
        let objetivosFiltrados = [...this.datosObjetivos];

        // Filtrar por piloto
        if (this.filtroActual.piloto !== 'todos') {
            objetivosFiltrados = objetivosFiltrados.filter(obj => 
                obj.piloto === this.filtroActual.piloto
            );
        }

        // Filtrar por estado
        if (this.filtroActual.estado !== 'todos') {
            objetivosFiltrados = objetivosFiltrados.filter(obj => {
                const estadoObj = (obj.estado || '').toLowerCase();
                return estadoObj === this.filtroActual.estado.toLowerCase();
            });
        }

        // Filtrar por rango de fechas (opcional, ya se hace en el renderizado)
        // Este filtro es más para las estadísticas si lo deseas

        return objetivosFiltrados;
    }

aplicarFiltros() {
        // Actualizar filtros de fecha
        const fechaInicioInput = document.getElementById('ganttFechaInicio');
        const fechaFinInput = document.getElementById('ganttFechaFin');

        this.filtroActual.fechaInicio = fechaInicioInput?.value || null;
        this.filtroActual.fechaFin = fechaFinInput?.value || null;

        console.log('Aplicando filtros:', this.filtroActual);

        // Re-renderizar el Gantt con los filtros aplicados
        this.renderizarGanttVisual();

        // Mostrar notificación
        const objetivosFiltrados = this.obtenerObjetivosFiltrados();
        const mensaje = `Mostrando ${objetivosFiltrados.length} objetivo(s)`;
        this.mostrarNotificacion(mensaje, 'info');
    }
    
    limpiarFiltros() {
        // Resetear filtros
        this.filtroActual = {
            piloto: 'todos',
            estado: 'todos',
            fechaInicio: null,
            fechaFin: null
        };

        // Resetear selects
        const filtroPiloto = document.getElementById('filtroPiloto');
        const filtroEstado = document.getElementById('filtroEstado');
        
        if (filtroPiloto) filtroPiloto.value = 'todos';
        if (filtroEstado) filtroEstado.value = 'todos';

        // Resetear fechas al rango inicial
        this.inicializarFiltros();

        // Re-renderizar
        this.renderizarGanttVisual();

        this.mostrarNotificacion('Filtros limpiados', 'success');
    }


    // ==================== UTILIDADES DE TIEMPO ====================
    actualizarHora() {
        const now = new Date();
        const elem = document.getElementById('ultimaActualizacion');
        if (elem) {
            elem.textContent = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    inicializarFiltros() {
        const hoy = new Date();

        // Primer día del mes actual
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        // Último día del mes actual
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        const fiInput = document.getElementById('ganttFechaInicio');
        const ffInput = document.getElementById('ganttFechaFin');

        if (fiInput) {
            fiInput.value = inicio.toISOString().split('T')[0];
            console.log('Fecha inicio:', inicio.toISOString().split('T')[0]);
        }

        if (ffInput) {
            ffInput.value = fin.toISOString().split('T')[0];
            console.log('Fecha fin:', fin.toISOString().split('T')[0]);
        }
    }

    // ==================== CARGA DE DATOS ====================
    async recargarDatos() {
        await this.cargarDatosDashboard();
    }

    /*async cargarDatosDashboard() {
        try {
            // Fetch Objetivos
            const response = await this.service.getAll();

            if (Array.isArray(response)) {
                this.datosObjetivos = response;
            } else if (response && response.data) {
                this.datosObjetivos = response.data;
            } else {
                this.datosObjetivos = [];
            }

            // Fetch Tareas (Subprocesos) para cada objetivo
            this.datosTareas = [];
            const promesasTareas = this.datosObjetivos.map(async (obj) => {
                try {
                    const tareas = await this.service.getSubprocesos(obj.id);
                    if (Array.isArray(tareas)) {
                        // Enriquecer tareas con info del padre
                        return tareas.map(t => ({
                            ...t,
                            objetivo_id: obj.id,
                            objetivo_piloto: obj.piloto
                        }));
                    }
                } catch (e) {
                    console.warn('Error fetching tareas for', obj.id);
                }
                return [];
            });

            const resultados = await Promise.all(promesasTareas);
            this.datosTareas = resultados.flat();

            console.log('Objetivos cargados:', this.datosObjetivos);
            console.log('Tareas cargadas:', this.datosTareas);

            // Actualizar UI
            this.actualizarEstadisticas();
            this.renderizarListaTareas();
            this.renderizarGanttVisual();
            this.actualizarHora();

        } catch (error) {
            console.error("Error crítico cargando dashboard:", error);
            document.getElementById('listaTareasRecientes').innerHTML =
                `<p class="text-red-500 text-center p-4">Error cargando datos</p>`;
        }
    }*/

        async cargarDatosDashboard() {
        try {
            const response = await this.service.getAll();

            if (Array.isArray(response)) {
                this.datosObjetivos = response;
            } else if (response && response.data) {
                this.datosObjetivos = response.data;
            } else {
                this.datosObjetivos = [];
            }

            // Fetch Tareas
            this.datosTareas = [];
            const promesasTareas = this.datosObjetivos.map(async (obj) => {
                try {
                    const tareas = await this.service.getSubprocesos(obj.id);
                    if (Array.isArray(tareas)) {
                        return tareas.map(t => ({
                            ...t,
                            objetivo_id: obj.id,
                            objetivo_piloto: obj.piloto
                        }));
                    }
                } catch (e) {
                    console.warn('Error fetching tareas for', obj.id);
                }
                return [];
            });

            const resultados = await Promise.all(promesasTareas);
            this.datosTareas = resultados.flat();

            console.log('Objetivos cargados:', this.datosObjetivos);
            console.log('Tareas cargadas:', this.datosTareas);

            // NUEVO: Poblar el filtro de pilotos
            this.poblarFiltroPilotos();

            // Actualizar UI
            this.actualizarEstadisticas();
            this.renderizarListaTareas();
            this.renderizarGanttVisual();
            this.actualizarHora();

        } catch (error) {
            console.error("Error crítico cargando dashboard:", error);
            document.getElementById('listaTareasRecientes').innerHTML =
                `<p class="text-red-500 text-center p-4">Error cargando datos</p>`;
        }
    }

    // ==================== ESTADÍSTICAS ====================
    actualizarEstadisticas() {
        const total = this.datosObjetivos.length;
        const completados = this.datosObjetivos.filter(o =>
            o.estado === "Completado" || o.estado === "completado"
        ).length;
        const proceso = this.datosObjetivos.filter(o =>
            o.estado === "En Proceso" || o.estado === "en proceso" || o.estado === "En proceso"
        ).length;
        const pendientes = this.datosObjetivos.filter(o =>
            o.estado === "Pendiente" || o.estado === "pendiente"
        ).length;

        console.log('Estadísticas:', { total, completados, proceso, pendientes });

        this.animarNumero('totalObjetivos', total);
        this.animarNumero('objetivosCompletados', completados);
        this.animarNumero('enProceso', proceso);
        this.animarNumero('pendientes', pendientes);

        const pct = total > 0 ? Math.round((completados / total) * 100) : 0;

        const elemPct = document.getElementById('porcentajeCompletado');
        if (elemPct) elemPct.innerText = pct + '%';

        const elemProgress = document.getElementById('progressPercent');
        if (elemProgress) elemProgress.innerText = pct + '%';

        // Actualizar círculo SVG
        const circle = document.getElementById('progressCircle');
        if (circle) {
            const circumference = 2 * Math.PI * 70;
            const offset = circumference - (pct / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }

        // Actualizar barras mini
        this.actualizarBarra('barraCompletados', completados, total);
        this.actualizarBarra('barraProceso', proceso, total);
        this.actualizarBarra('barraPendientes', pendientes, total);
    }

    actualizarBarra(id, valor, total) {
        const barra = document.getElementById(id);
        if (barra) {
            const width = total > 0 ? ((valor / total) * 100) : 0;
            barra.style.width = width + '%';
        }
    }

    animarNumero(id, valorFinal) {
        const obj = document.getElementById(id);
        if (!obj) return;

        const valorInicial = parseInt(obj.innerText) || 0;
        const duracion = 1000;
        const inicio = performance.now();

        const update = (tiempo) => {
            const avance = (tiempo - inicio) / duracion;
            if (avance < 1) {
                obj.innerText = Math.floor(valorInicial + (valorFinal - valorInicial) * avance);
                requestAnimationFrame(update);
            } else {
                obj.innerText = valorFinal;
            }
        };

        requestAnimationFrame(update);
    }

    // ==================== LISTA DE TAREAS ====================
    renderizarListaTareas() {
        const container = document.getElementById('listaTareasRecientes');

        if (!this.datosTareas || this.datosTareas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400 text-sm">
                    No hay tareas activas recientes.
                </div>`;
            return;
        }

        // Ordenar por fecha inicio descendente
        const tareasRecientes = [...this.datosTareas]
            .sort((a, b) => new Date(b.fecha_inicio || 0) - new Date(a.fecha_inicio || 0))
            .slice(0, 10);

        let html = '';

        tareasRecientes.forEach(tarea => {
            const nombreTarea = tarea.nombre_tarea || tarea.nombre || 'Sin nombre';
            const estadoTarea = tarea.estado_completado_pendiente || tarea.estado || 'Pendiente';

            let badgeClass = '';
            if (estadoTarea === 'Completado' || estadoTarea === 'completado') {
                badgeClass = 'badge-completado';
            } else if (estadoTarea === 'En Proceso' || estadoTarea === 'en proceso' || estadoTarea === 'En proceso') {
                badgeClass = 'badge-proceso';
            } else {
                badgeClass = 'badge-pendiente';
            }

            const fechaStr = tarea.fecha_inicio
                ? new Date(tarea.fecha_inicio).toLocaleDateString()
                : 'Sin fecha';

            html += `
                <div class="task-item flex justify-between items-center mb-2 cursor-pointer group">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="min-w-0">
                            <h4 class="text-sm font-semibold text-slate-700 truncate" title="${nombreTarea}">
                                ${nombreTarea}
                            </h4>
                            <p class="text-xs text-slate-400 truncate flex items-center gap-1">
                                <span class="font-medium text-slate-500">${tarea.objetivo_piloto || 'Sin Obj.'}</span>
                                <span>•</span>
                                <span>${fechaStr}</span>
                            </p>
                        </div>
                    </div>
                    <span class="badge ${badgeClass} flex-shrink-0 ml-2">${estadoTarea}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ==================== GANTT VISUAL (POR DÍAS) ====================
    /*renderizarGanttVisual() {
        const container = document.getElementById('ganttContentWrapper');
        const inicioVal = document.getElementById('ganttFechaInicio').value;
        const finVal = document.getElementById('ganttFechaFin').value;

        if (!inicioVal || !finVal) {
            console.warn('No hay fechas para filtrar');
            return;
        }

        const fechaInicioInput = new Date(inicioVal + 'T00:00:00');
        const fechaFinInput = new Date(finVal + 'T23:59:59');

        console.log('Renderizando Gantt:', fechaInicioInput, fechaFinInput);

        // Generar días entre fechas
        const dias = this.generarDiasEntreFechas(fechaInicioInput, fechaFinInput);

        if (dias.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400">Rango de fechas inválido</div>';
            return;
        }

        console.log('Días generados:', dias.length);

        // Construir Header por días
        const headerHTML = this.construirHeaderGanttDias(dias);

        // Construir Grid Background
        const bgHTML = this.construirGridBackgroundDias(dias);

        // Construir Rows
        const bodyHTML = this.construirBodyGanttDias(fechaInicioInput, dias, bgHTML);

        container.innerHTML = headerHTML + bodyHTML;
    }*/

         renderizarGanttVisual() {
        const container = document.getElementById('ganttContentWrapper');
        const inicioVal = document.getElementById('ganttFechaInicio').value;
        const finVal = document.getElementById('ganttFechaFin').value;

        if (!inicioVal || !finVal) {
            console.warn('No hay fechas para filtrar');
            return;
        }

        const fechaInicioInput = new Date(inicioVal + 'T00:00:00');
        const fechaFinInput = new Date(finVal + 'T23:59:59');

        console.log('Renderizando Gantt:', fechaInicioInput, fechaFinInput);
        console.log('Filtros activos:', this.filtroActual);

        // Generar días entre fechas
        const dias = this.generarDiasEntreFechas(fechaInicioInput, fechaFinInput);

        if (dias.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400">Rango de fechas inválido</div>';
            return;
        }

        console.log('Días generados:', dias.length);

        // NUEVO: Obtener objetivos filtrados
        const objetivosFiltrados = this.obtenerObjetivosFiltrados();

        if (objetivosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center">
                    <i class="fas fa-filter text-4xl text-slate-300 mb-3"></i>
                    <p class="text-slate-500 font-medium">No hay objetivos que coincidan con los filtros seleccionados</p>
                    <p class="text-slate-400 text-sm mt-2">Intenta ajustar los filtros o limpiarlos para ver más resultados</p>
                </div>`;
            return;
        }

        // Construir Header por días
        const headerHTML = this.construirHeaderGanttDias(dias);

        // Construir Grid Background
        const bgHTML = this.construirGridBackgroundDias(dias);

        // Construir Rows con objetivos filtrados
        const bodyHTML = this.construirBodyGanttDiasFiltrado(fechaInicioInput, dias, bgHTML, objetivosFiltrados);

        container.innerHTML = headerHTML + bodyHTML;
    }

    construirBodyGanttDiasFiltrado(fechaInicio, dias, bgHTML, objetivosFiltrados) {
    let bodyHTML = '';
    let hayDatosVisibles = false;

    objetivosFiltrados.forEach(obj => {
        const barPlanData = this.calcularPosicionBarraDias(
            obj.fecha_inicio || obj.inicio,
            obj.fecha_fin || obj.fin,
            fechaInicio,
            dias.length
        );

        let barRealData = null;
        let colorBarra = '';
        let textoBarra = '';
        let iconoBarra = '';
        let tooltipInfo = '';
        let showRealBar = false;
        let colorBarraPlan = 'bg-blue-500';
        let textoCola = '';
        let icoPlani = 'fa-hourglass-half';

        if (barPlanData) {
            hayDatosVisibles = true;
            colorBarra = 'bg-blue-500';
            textoBarra = 'En Preparación';
            iconoBarra = 'fa-hourglass-half';
            colorBarraPlan = 'bg-blue-500';
            textoCola = 'En Preparación';
            icoPlani = 'fa-hourglass-half';
            tooltipInfo = `${obj.piloto} (Planificado)`;

            // Si tiene ejecución real, calcular barra real
            if (obj.fecha_fin_real) {
                showRealBar = true;
                const realInicio = obj.fecha_inicio_real || obj.fecha_inicio || obj.inicio;
                const realFin = obj.fecha_fin_real;
                barRealData = this.calcularPosicionBarraDias(
                    realInicio,
                    realFin,
                    fechaInicio,
                    dias.length
                );
                
                // Comparar fechas para color
                const fechaPlanificada = new Date((obj.fecha_fin || obj.fin) + 'T23:59:59');
                const fechaReal = new Date(obj.fecha_fin_real + 'T23:59:59');
                
                if (fechaReal <= fechaPlanificada) {
                    colorBarra = 'bg-green-500';
                    textoBarra = 'Ejecutado a Tiempo';
                    iconoBarra = 'fa-check-circle';
                    colorBarraPlan = 'bg-green-500';
                    textoCola = 'Ejecutado a Tiempo';
                    icoPlani = 'fa-check-circle';
                } else {
                    colorBarra = 'bg-red-500';
                    textoBarra = 'Fuera de Tiempo';
                    iconoBarra = 'fa-exclamation-triangle';
                    colorBarraPlan = 'bg-red-500';
                    textoCola = 'Fuera de Tiempo';
                    icoPlani = 'fa-exclamation-triangle';
                }
                
                tooltipInfo = `${obj.piloto} (${textoBarra})<br><small>Ejecutado: ${this.formatearFechaCorta(obj.fecha_fin_real)}</small>`;
            } else if (obj.estado === 'En Proceso' || obj.estado === 'en proceso' || obj.estado === 'En proceso') {
                textoBarra = 'En Proceso';
                iconoBarra = 'fa-spinner';
                colorBarraPlan = 'bg-blue-500';
                textoCola = 'En Proceso';
                icoPlani = 'fa-spinner';
            }

            // Fila para barra PLANIFICADA
            bodyHTML += `
            <div class="gantt-body-row bg-slate-50/50">
                <div class="gantt-row-label parent">
                    <i class="fas fa-bullseye text-xs text-blue-500 mr-2 ml-2"></i>
                    <span class="truncate font-semibold text-sm" title="${obj.piloto}">
                        ${obj.piloto}
                    </span>
                </div>
                <div class="gantt-row-timeline">
                    ${bgHTML}
                    ${barPlanData ? `
                    <div class="absolute top-0 bottom-0 ${colorBarraPlan} opacity-60 border border-blue-400 flex items-center justify-center" style="left: ${barPlanData.left}px; width: ${barPlanData.width}px; z-index: 1;">
                        <span class="relative z-10 text-white text-[10px] font-bold whitespace-nowrap overflow-hidden px-1 pointer-events-none flex items-center justify-center w-full h-full">
                            <i class="fas ${icoPlani} mr-1"></i>Tiempo Planificado
                        </span>
                    </div>` : ''}
                </div>
            </div>`;

            // Fila para barra REAL (si existe)
            if (showRealBar && barRealData) {
                bodyHTML += `
            <div class="gantt-body-row bg-white">
                <div class="gantt-row-label parent">
                    <span class="truncate font-semibold text-sm text-slate-500" title="${obj.piloto}">
                        
                    </span>
                </div>
                <div class="gantt-row-timeline">
                    ${bgHTML}
                    <div class="absolute top-0 bottom-0 ${colorBarra} opacity-80 border-2 border-dashed border-slate-400 flex items-center justify-center" style="left: ${barRealData.left}px; width: ${barRealData.width}px; z-index: 2;">
                        <div class="gantt-tooltip">${tooltipInfo}</div>
                        <span class="relative z-10 text-white text-[10px] font-bold whitespace-nowrap overflow-hidden px-1 pointer-events-none flex items-center justify-center w-full h-full">
                            <i class="fas ${iconoBarra} mr-1"></i> ${textoBarra}
                        </span>
                    </div>
                </div>
            </div>`;
            }

            // Agregar tareas hijas (también filtradas por el objetivo)
            bodyHTML += this.construirTareasHijasDias(obj.id, fechaInicio, dias.length, bgHTML);
        }
    });

    if (!hayDatosVisibles) {
        bodyHTML = `
            <div class="p-8 text-center text-slate-400">
                <i class="fas fa-calendar-times text-4xl mb-3 opacity-30"></i>
                <p class="text-slate-500 font-medium">No hay objetivos en este rango de fechas.</p>
                <p class="text-slate-400 text-sm mt-2">Ajusta las fechas o limpia los filtros para ver más resultados.</p>
            </div>`;
    }

    return bodyHTML;
}

    generarDiasEntreFechas(inicio, fin) {
        const dias = [];
        const current = new Date(inicio);
        const oneDay = 24 * 60 * 60 * 1000;

        let safety = 0;
        while (current <= fin && safety < 365) {
            dias.push(new Date(current));
            current.setTime(current.getTime() + oneDay);
            safety++;
        }

        return dias;
    }

    agruparDiasPorMes(dias) {
        const grupos = [];
        let mesActual = null;
        let contadorDias = 0;
        let fechaInicio = null;

        dias.forEach((dia, index) => {
            const mesAno = `${dia.getMonth()}-${dia.getFullYear()}`;

            if (mesActual !== mesAno) {
                if (mesActual !== null) {
                    grupos.push({ fecha: fechaInicio, dias: contadorDias });
                }
                mesActual = mesAno;
                contadorDias = 1;
                fechaInicio = new Date(dia);
            } else {
                contadorDias++;
            }
        });

        if (contadorDias > 0) {
            grupos.push({ fecha: fechaInicio, dias: contadorDias });
        }

        return grupos;
    }

    construirHeaderGanttDias(dias) {
        const mesesAgrupados = this.agruparDiasPorMes(dias);

        let headerMeses = `
            <div class="gantt-visual-header" style="border-bottom: 1px solid #e2e8f0;">
                <div class="gantt-col-names flex items-center pl-4"></div>
                <div class="gantt-timeline-wrapper">`;

        mesesAgrupados.forEach(grupo => {
            const mesNombre = grupo.fecha.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
            headerMeses += `<div class="gantt-month-label font-bold text-slate-700" style="flex: 0 0 ${grupo.dias * 40}px; min-width: ${grupo.dias * 40}px; max-width: ${grupo.dias * 40}px;">${mesNombre}</div>`;
        });

        headerMeses += `</div></div>`;

        let headerDias = `
            <div class="gantt-visual-header" style="background: white;">
                <div class="gantt-col-names flex items-center pl-4">OBJETIVO / TAREA</div>
                <div class="gantt-timeline-wrapper">`;

        dias.forEach(dia => {
            const diaNombre = dia.getDate();
            const diaSemana = dia.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
            const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;

            headerDias += `
                <div class="gantt-day-label ${esFinSemana ? 'bg-slate-100' : ''}" 
                     style="flex: 0 0 40px; min-width: 40px; max-width: 40px; text-align: center; padding: 0.5rem 0; border-right: 1px solid #f1f5f9; font-size: 0.65rem;">
                    <div class="font-bold ${esFinSemana ? 'text-red-500' : 'text-slate-700'}">${diaNombre}</div>
                    <div class="text-slate-400 text-[10px]">${diaSemana}</div>
                </div>`;
        });

        headerDias += `</div></div>`;

        return headerMeses + headerDias;
    }

    construirGridBackgroundDias(dias) {
        let html = `<div class="gantt-grid-bg">`;
        dias.forEach((dia) => {
            const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;
            html += `<div class="gantt-grid-col ${esFinSemana ? 'bg-red-50' : ''}" style="flex: 0 0 40px; min-width: 40px; max-width: 40px;"></div>`;
        });
        html += `</div>`;
        return html;
    }

    construirBodyGanttDias(fechaInicio, dias, bgHTML) {
        let bodyHTML = '';
        let hayDatosVisibles = false;

        this.datosObjetivos.forEach(obj => {
            // Barra de tiempo planificado (azul)
            const barPlanData = this.calcularPosicionBarraDias(
                obj.fecha_inicio || obj.inicio,
                obj.fecha_fin || obj.fin,
                fechaInicio,
                dias.length
            );

            // Barra de ejecución real (verde/rojo) si existe
            let barRealData = null;
            let colorBarra = '';
            let textoBarra = '';
            let iconoBarra = '';
            let tooltipInfo = '';
            let showRealBar = false;
            let colorBarraPlan = 'bg-blue-500';
            let textoCola = '';
            let icoPlani = 'fa-hourglass-half';

            if (barPlanData) {
                hayDatosVisibles = true;
                // Por defecto, solo barra azul (planificado)
                colorBarra = 'bg-blue-500';
                textoBarra = 'En Preparación';
                iconoBarra = 'fa-hourglass-half';
                colorBarraPlan = 'bg-blue-500';
                textoCola = 'En Preparación';
                icoPlani = 'fa-hourglass-half';
                tooltipInfo = `${obj.piloto} (Planificado)`;

                // Si tiene ejecución real, calcular barra real
                if (obj.fecha_fin_real) {
                    showRealBar = true;
                    // Fechas reales
                    const realInicio = obj.fecha_inicio_real || obj.fecha_inicio || obj.inicio;
                    const realFin = obj.fecha_fin_real;
                    barRealData = this.calcularPosicionBarraDias(
                        realInicio,
                        realFin,
                        fechaInicio,
                        dias.length
                    );
                    // Comparar fechas para color
                    const fechaPlanificada = new Date((obj.fecha_fin || obj.fin) + 'T23:59:59');
                    const fechaReal = new Date(obj.fecha_fin_real + 'T23:59:59');
                    if (fechaReal <= fechaPlanificada) {
                        colorBarra = 'bg-green-500';
                        textoBarra = 'Ejecutado a Tiempo';
                        iconoBarra = 'fa-check-circle';
                        colorBarraPlan = 'bg-green-500';
                        textoCola = 'Ejecutado a Tiempo';
                        icoPlani = 'fa-check-circle';
                    } else {
                        colorBarra = 'bg-red-500';
                        textoBarra = 'Fuera de Tiempo';
                        iconoBarra = 'fa-exclamation-triangle';
                        colorBarraPlan = 'bg-red-500';
                        textoCola = 'Fuera de Tiempo';
                        icoPlani = 'fa-exclamation-triangle';
                    }
                    tooltipInfo = `${obj.piloto} (${textoBarra})<br><small>Ejecutado: ${this.formatearFechaCorta(obj.fecha_fin_real)}</small>`;
                } else if (obj.estado === 'En Proceso' || obj.estado === 'en proceso' || obj.estado === 'En proceso') {
                    textoBarra = 'En Proceso';
                    iconoBarra = 'fa-spinner';
                    colorBarraPlan = 'bg-blue-500';
                    textoCola = 'En Proceso';
                    icoPlani = 'fa-spinner';
                }

                // Fila para barra PLANIFICADA
                bodyHTML += `
                <div class="gantt-body-row bg-slate-50/50">
                    <div class="gantt-row-label parent">
                        <i class="fas fa-bullseye text-xs text-blue-500 mr-2 ml-2"></i>
                        <span class="truncate font-semibold text-sm" title="${obj.piloto}">
                            ${obj.piloto}
                        </span>
                    </div>
                    <div class="gantt-row-timeline">
                        ${bgHTML}
                        ${barPlanData ? `
                        <div class="absolute top-0 bottom-0 ${colorBarraPlan} opacity-60 border border-blue-400 flex items-center justify-center" style="left: ${barPlanData.left}px; width: ${barPlanData.width}px; z-index: 1;">
                            <span class="relative z-10 text-white text-[10px] font-bold whitespace-nowrap overflow-hidden px-1 pointer-events-none flex items-center justify-center w-full h-full">
                                <i class="fas ${icoPlani} mr-1"></i>Tiempo Planificado
                            </span>
                        </div>` : ''}
                    </div>
                </div>`;

                // Fila para barra REAL (si existe)
                if (showRealBar && barRealData) {
                    bodyHTML += `
                <div class="gantt-body-row bg-white">
                    <div class="gantt-row-label parent">
                        <span class="truncate font-semibold text-sm text-slate-500" title="${obj.piloto}">
                            
                        </span>
                    </div>
                    <div class="gantt-row-timeline">
                        ${bgHTML}
                        <div class="absolute top-0 bottom-0 ${colorBarra} opacity-80 border-2 border-dashed border-slate-400 flex items-center justify-center" style="left: ${barRealData.left}px; width: ${barRealData.width}px; z-index: 2;">
                            <div class="gantt-tooltip">${tooltipInfo}</div>
                            <span class="relative z-10 text-white text-[10px] font-bold whitespace-nowrap overflow-hidden px-1 pointer-events-none flex items-center justify-center w-full h-full">
                                <i class="fas ${iconoBarra} mr-1"></i> ${textoBarra}
                            </span>
                        </div>
                    </div>
                </div>`;
                }

                bodyHTML += this.construirTareasHijasDias(obj.id, fechaInicio, dias.length, bgHTML);


            }
        });

        if (!hayDatosVisibles) {
            bodyHTML = `
                <div class="p-8 text-center text-slate-400">
                    No hay objetivos en este rango de fechas.
                </div>`;
        }

        return bodyHTML;
    }

    construirTareasHijasDias(objetivoId, fechaInicio, numDias, bgHTML) {
        let html = '';
        const tareasHijas = this.datosTareas.filter(t => t.objetivo_id == objetivoId);

        tareasHijas.forEach(tarea => {
            const nombreTarea = tarea.nombre_tarea || tarea.nombre || 'Tarea';
            const estadoTarea = tarea.estado_completado_pendiente || tarea.estado;
            const tareaBar = this.calcularPosicionBarraDias(
                tarea.fecha_inicio,
                tarea.fecha_fin,
                fechaInicio,
                numDias
            );

            if (tareaBar) {
                // Construir tooltip para tarea
                let tooltipTarea = `${nombreTarea} (${estadoTarea})`;
                if ((estadoTarea === 'Completado' || estadoTarea === 'completado') && tarea.fecha_fin_real) {
                    const fechaCierreTarea = this.formatearFechaCorta(tarea.fecha_fin_real);
                    tooltipTarea += `<br><small>Cerrado: ${fechaCierreTarea}</small>`;
                }

                let claseEstado = '';
                if (estadoTarea === 'Completado' || estadoTarea === 'completado') {
                    claseEstado = 'completed';
                } else if (estadoTarea === 'En Proceso' || estadoTarea === 'en proceso' || estadoTarea === 'En proceso') {
                    claseEstado = 'inprogress';
                } else {
                    claseEstado = 'pending';
                }

                // Calcular extensión para tareas completadas
                let extensionTareaHTML = '';
                if ((estadoTarea === 'Completado' || estadoTarea === 'completado') && tarea.fecha_fin_real && tarea.fecha_fin) {
                    const fechaPlanificadaTarea = new Date(tarea.fecha_fin + 'T23:59:59');
                    const fechaRealTarea = new Date(tarea.fecha_fin_real + 'T23:59:59');
                    const diferenciaDiasTarea = Math.round((fechaRealTarea - fechaPlanificadaTarea) / (1000 * 60 * 60 * 24));

                    if (diferenciaDiasTarea !== 0) {
                        const extensionTareaBar = this.calcularExtensionBarra(
                            tarea.fecha_fin,
                            tarea.fecha_fin_real,
                            fechaInicio,
                            numDias,
                            parseFloat(tareaBar.left),
                            parseFloat(tareaBar.width)
                        );

                        if (extensionTareaBar) {
                            const colorExtension = diferenciaDiasTarea > 0 ? 'bg-red-400' : 'bg-green-400';
                            const iconoExtension = diferenciaDiasTarea > 0 ? 'fa-arrow-right' : 'fa-arrow-left';
                            extensionTareaHTML = `
                                <div class="absolute top-0 bottom-0 ${colorExtension} opacity-60 border-2 border-dashed border-slate-400" 
                                     style="left: ${extensionTareaBar.left}px; width: ${extensionTareaBar.width}px;">
                                    <span class="text-[10px] text-white font-bold flex items-center justify-center h-full">
                                        <i class="fas ${iconoExtension} mr-1"></i>${Math.abs(diferenciaDiasTarea)}d
                                    </span>
                                </div>`;
                        }
                    }
                }

                html += `
                <div class="gantt-body-row">
                    <div class="gantt-row-label child">
                        <span class="truncate" title="${nombreTarea}">${nombreTarea}</span>
                        ${(estadoTarea === 'Completado' || estadoTarea === 'completado') && tarea.fecha_fin_real ? `<span class="text-[10px] text-emerald-600 ml-2"><i class="fas fa-check-circle"></i> ${this.formatearFechaCorta(tarea.fecha_fin_real)}</span>` : ''}
                    </div>
                    <div class="gantt-row-timeline">
                        ${bgHTML}
                        <!-- <div class="gantt-bar ${claseEstado} flex items-center justify-center" style="left: ${tareaBar.left}px; width: ${tareaBar.width}px;">-->

                        <div class="absolute top-0 bottom-0 bg-blue-400 opacity-60 border-2 border-dashed border-slate-400  flex items-center justify-center" style="left: ${tareaBar.left}px; width: ${tareaBar.width}px;">
                            <div class="gantt-tooltip">
                                ${tooltipTarea}
                            </div>
                            <span class="relative z-10 text-white text-[10px] font-bold whitespace-nowrap overflow-hidden px-1 pointer-events-none flex items-center justify-center w-full h-full">
                                ${estadoTarea}
                            </span>
                        </div>
                        ${extensionTareaHTML}
                    </div>
                </div>`;
            }
        });

        return html;
    }

    calcularPosicionBarraDias(inicioStr, finStr, fechaBaseGrid, numDias) {
        if (!inicioStr) return null;

        const inicio = new Date(inicioStr + 'T00:00:00');
        const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date(inicio.getTime() + (1 * 24 * 60 * 60 * 1000));

        const oneDay = 24 * 60 * 60 * 1000;
        const anchoDia = 40;

        const diasOffsetInicio = Math.round((inicio - fechaBaseGrid) / oneDay);
        const duracionDias = Math.max(1, Math.round((fin - inicio) / oneDay) + 1);

        let left = diasOffsetInicio * anchoDia;
        let width = duracionDias * anchoDia;

        const maxWidth = numDias * anchoDia;
        if ((left + width) < 0 || left > maxWidth) return null;

        if (left < 0) {
            width += left;
            left = 0;
        }

        if ((left + width) > maxWidth) {
            width = maxWidth - left;
        }

        if (width < 5) width = 5;

        return {
            left: left.toFixed(2),
            width: width.toFixed(2)
        };
    }

    calcularExtensionBarra(fechaPlanificada, fechaReal, fechaBaseGrid, numDias, barraLeft, barraWidth) {
        const anchoDia = 40;
        const fechaPlan = new Date(fechaPlanificada + 'T23:59:59');
        const fechaRea = new Date(fechaReal + 'T23:59:59');

        // Determinar cuál es menor y cuál es mayor
        const fechaMenor = fechaPlan < fechaRea ? fechaPlan : fechaRea;
        const fechaMayor = fechaPlan > fechaRea ? fechaPlan : fechaRea;

        const oneDay = 24 * 60 * 60 * 1000;

        // Calcular posición de la extensión
        const diasOffsetMenor = Math.round((fechaMenor - fechaBaseGrid) / oneDay);
        const diasOffsetMayor = Math.round((fechaMayor - fechaBaseGrid) / oneDay);

        let left, width;

        if (fechaPlan < fechaRea) {
            // Retraso: la extensión va después de la fecha planificada
            left = diasOffsetMenor * anchoDia;
            width = (diasOffsetMayor - diasOffsetMenor) * anchoDia;
        } else {
            // Adelanto: la extensión va antes de la fecha planificada
            left = diasOffsetMenor * anchoDia;
            width = (diasOffsetMayor - diasOffsetMenor) * anchoDia;
        }

        const maxWidth = numDias * anchoDia;

        // Validar que esté dentro del rango visible
        if ((left + width) < 0 || left > maxWidth) return null;

        if (left < 0) {
            width += left;
            left = 0;
        }

        if ((left + width) > maxWidth) {
            width = maxWidth - left;
        }

        if (width < 3) return null;

        return {
            left: left.toFixed(2),
            width: width.toFixed(2)
        };
    }

    formatearFecha(fecha) {
        if (!fecha) return '-';
        try {
            const d = new Date(fecha);
            return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return fecha;
        }
    }

    formatearFechaCorta(fecha) {
        if (!fecha) return '-';
        try {
            const d = new Date(fecha);
            const dia = d.getDate().toString().padStart(2, '0');
            const mes = (d.getMonth() + 1).toString().padStart(2, '0');
            return `${dia}/${mes}`;
        } catch (e) {
            return fecha;
        }
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const iconos = {
            'success': 'fa-check-circle text-green-500',
            'error': 'fa-exclamation-circle text-red-500',
            'warning': 'fa-exclamation-triangle text-yellow-500',
            'info': 'fa-info-circle text-blue-500'
        };

        const icono = iconos[tipo] || iconos['info'];

        // Crear el elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-slide-in-right border border-slate-200 max-w-md';
        notification.innerHTML = `
            <i class="fas ${icono} text-xl"></i>
            <span class="text-slate-700 font-medium flex-1">${mensaje}</span>
            <button class="text-slate-400 hover:text-slate-600 transition">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Cerrar al hacer clic en la X
        notification.querySelector('button').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slide-out-right 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async function () {
    // ✅ INICIALIZAR SISTEMA DE PERMISOS PRIMERO
    PermisosManager.init();
    
    window.dashboardController = new DashboardController();
    await window.dashboardController.init();

    // Botón cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                await AuthService.logout();
                sessionStorage.clear();
                window.location.href = 'login.html';
            } catch (error) {
                alert('Error al cerrar sesión');
            }
        });
    }
});

