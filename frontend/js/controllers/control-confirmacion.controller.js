class ControlConfirmacionController {
    constructor() {
        // Asumimos que ControlObjetivosService ya existe y maneja las peticiones fetch
        this.service = new ControlObjetivosService(); 
        this.datos = [];
        this.registroSeleccionado = null;
        this.filtros = {
            busqueda: '',
            estado: 'Todos'
        };
    }

    async init() {
        this.setupEventListeners();
        await this.cargarDatos();
    }

    setupEventListeners() {
        // Evento para guardar la confirmación
        document.getElementById('formConfirmacion')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarCierre();
        });

        // Filtro de búsqueda
        document.getElementById('inputBusqueda')?.addEventListener('keyup', (e) => {
            this.filtros.busqueda = e.target.value;
            this.aplicarFiltros();
        });

        // Filtro de estado
        document.getElementById('selectEstado')?.addEventListener('change', (e) => {
            this.filtros.estado = e.target.value;
            this.aplicarFiltros();
        });
    }

    async cargarDatos() {
        try {
            console.log('Cargando datos desde API...');
            // Usa tu servicio existente que llama a /controlobjetivos/all
            const response = await this.service.getAll();
            console.log('Respuesta API:', response);
            
            // Si tu servicio devuelve {data: [...]}, ajustamos:
            this.datos = Array.isArray(response) ? response : (response.data || []);
            console.log('Datos procesados:', this.datos);
            
            this.aplicarFiltros();
        } catch (error) {
            console.error('Error cargando datos:', error);
            // Si usas SweetAlert helper
            if(window.SwalHelpers) window.SwalHelpers.showError('Error al cargar datos: ' + error.message);
        }
    }

    renderizarTabla(datos) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay registros</td></tr>';
            return;
        }

        datos.forEach(item => {
            const esCerrado = item.estado === 'Completado';
            const rowClass = esCerrado ? 'bg-emerald-50/30' : 'hover:bg-gray-50';
            
            // Cálculo de progreso (si viene del backend)
            const total = parseInt(item.total_tareas || 0);
            const hechos = parseInt(item.tareas_completadas || 0);
            const porcentaje = total > 0 ? Math.round((hechos / total) * 100) : 0;

            const tr = document.createElement('tr');
            tr.className = `${rowClass} border-b border-gray-100 transition-colors`;
            
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-700">${item.objetivo || '-'}</div>
                    <div class="text-xs text-gray-500">${item.granja} - ${item.galpon}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${item.piloto}</td>
                <td class="px-6 py-4 text-center">
                    <div class="text-xs ${esCerrado ? 'line-through text-gray-400' : ''}">${this.formatDate(item.inicio)} al ${this.formatDate(item.fin)}</div>
                    ${item.fecha_fin_real ? `<div class="text-xs font-bold text-emerald-600">Cerrado: ${this.formatDate(item.fecha_fin_real)}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="text-xs text-right mt-1 ${esCerrado ? 'text-emerald-600 font-bold' : ''}">${esCerrado && porcentaje === 100 ? 'Completado' : porcentaje + '%'}</div>
                </td>
                <td class="px-6 py-4 text-right">
                    ${!esCerrado ? `
                        <button class="btn-validar bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-sm shadow flex items-center gap-2 mx-auto">
                            <i class="fas fa-check-double"></i> Validar
                        </button>
                    ` : `
                        <span class="text-emerald-600 text-sm font-bold flex items-center gap-2 justify-center"></i> Cerrado</span>
                    `}
                </td>
            `;

            // Agregar evento click al botón Validar
            const btn = tr.querySelector('.btn-validar');
            if (btn) {
                btn.addEventListener('click', () => this.abrirModal(item));
            }

            tbody.appendChild(tr);
        });
    }

    abrirModal(item) {
        this.registroSeleccionado = item;
        const modal = document.getElementById('modalConfirmacion');
        
        const lblObjetivo = document.getElementById('lblObjetivoModal');
        if(lblObjetivo) lblObjetivo.textContent = item.objetivo || 'Sin título';
        
        const inputFecha = document.getElementById('inputFechaReal');
        const inputPresupuesto = document.getElementById('inputPresupuesto');
        const txtObs = document.getElementById('txtObservaciones');
        
        if(inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];
        if(inputPresupuesto) inputPresupuesto.value = item.presupuesto_ejecutado || '';
        if(txtObs) txtObs.value = item.observaciones_cierre || '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    async guardarCierre() {
        if (!this.registroSeleccionado) return;

        const fechaReal = document.getElementById('inputFechaReal')?.value;
        const presupuesto = document.getElementById('inputPresupuesto')?.value;
        const obs = document.getElementById('txtObservaciones')?.value;

        if (!fechaReal || !presupuesto) {
            if(window.SwalHelpers) window.SwalHelpers.showWarning('Complete los campos requeridos');
            return;
        }

        const payload = {
            id: this.registroSeleccionado.id,
            piloto: this.registroSeleccionado.piloto,
            granja: this.registroSeleccionado.granja,
            galpon: this.registroSeleccionado.galpon,
            objetivo: this.registroSeleccionado.objetivo,
            meta: this.registroSeleccionado.meta,
            inicio: this.registroSeleccionado.inicio,
            fin: this.registroSeleccionado.fin,
            fecha_fin_real: fechaReal,
            presupuesto_ejecutado: parseFloat(presupuesto),
            observaciones_cierre: obs,
            estado: 'Completado'
        };

        try {
            // Llamada a la API update que ya tienes configurada
            await this.service.update(payload);
            
            if(window.SwalHelpers) window.SwalHelpers.showSuccess('Proyecto cerrado correctamente');
            
            document.getElementById('modalConfirmacion').classList.add('hidden');
            document.getElementById('modalConfirmacion').classList.remove('flex');
            this.cargarDatos(); // Recargar tabla
            
        } catch (error) {
            console.error(error);
            if(window.SwalHelpers) window.SwalHelpers.showError('Error al guardar');
        }
    }

    actualizarKPIs(datos) {
        const pendientes = datos.filter(d => d.estado !== 'Completado').length;
        const gastado = datos.reduce((acc, curr) => acc + Number(curr.presupuesto_ejecutado || 0), 0);
        
        // Calcular desviación de tiempo promedio
        const completados = datos.filter(d => d.estado === 'Completado' && d.fecha_fin_real && d.fin);
        let desviacionTotal = 0;
        let cantidadConDesviacion = 0;
        
        completados.forEach(item => {
            const fechaPlanificada = new Date(item.fin);
            const fechaReal = new Date(item.fecha_fin_real);
            const diferenciaDias = Math.round((fechaReal - fechaPlanificada) / (1000 * 60 * 60 * 24));
            desviacionTotal += diferenciaDias;
            cantidadConDesviacion++;
        });
        
        const desviacionPromedio = cantidadConDesviacion > 0 ? Math.round(desviacionTotal / cantidadConDesviacion) : 0;
        
        console.log('KPIs - Pendientes:', pendientes, 'Gastado:', gastado, 'Desviación:', desviacionPromedio);
        
        const elPendientes = document.getElementById('kpiPendientes');
        const elGastado = document.getElementById('kpiPresupuesto');
        const elDesviacion = document.getElementById('kpiDesviacion');
        
        if(elPendientes) elPendientes.textContent = pendientes;
        if(elGastado) elGastado.textContent = `S/ ${gastado.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if(elDesviacion) {
            const signo = desviacionPromedio > 0 ? '+' : (desviacionPromedio < 0 ? '' : '');
            const textoDesviacion = desviacionPromedio === 0 ? 'Sin desviación' : `${signo}${desviacionPromedio} Días`;
            elDesviacion.textContent = textoDesviacion;
            
            // Cambiar color según desviación
            elDesviacion.className = 'text-2xl font-bold';
            if (desviacionPromedio > 0) {
                elDesviacion.classList.add('text-red-600'); // Retraso
            } else if (desviacionPromedio < 0) {
                elDesviacion.classList.add('text-green-600'); // Adelanto
            } else {
                elDesviacion.classList.add('text-gray-800'); // Sin desviación
            }
        }
    }

    aplicarFiltros() {
        let datosFiltrados = [...this.datos];

        // Filtro por estado
        if (this.filtros.estado !== 'Todos') {
            datosFiltrados = datosFiltrados.filter(d => {
                if (this.filtros.estado === 'En Proceso') {
                    return d.estado !== 'Completado';
                } else if (this.filtros.estado === 'Completado') {
                    return d.estado === 'Completado';
                }
                return true;
            });
        }

        // Filtro por búsqueda
        if (this.filtros.busqueda.trim()) {
            const textoBusqueda = this.filtros.busqueda.toLowerCase();
            datosFiltrados = datosFiltrados.filter(d => 
                (d.objetivo && d.objetivo.toLowerCase().includes(textoBusqueda)) ||
                (d.piloto && d.piloto.toLowerCase().includes(textoBusqueda)) ||
                (d.granja && d.granja.toLowerCase().includes(textoBusqueda)) ||
                (d.galpon && d.galpon.toLowerCase().includes(textoBusqueda))
            );
        }

        this.renderizarTabla(datosFiltrados);
        this.actualizarKPIs(datosFiltrados);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const controller = new ControlConfirmacionController();
    controller.init();
});