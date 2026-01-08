class FilterController {
    constructor(mainController) {
        this.main = mainController;
    }

    async aplicar() {
        // IDs correctos según tu HTML
        const filtros = {
            fechaInicio: document.getElementById('filterFechaInicio')?.value || '',
            fechaFin: document.getElementById('filterFechaFin')?.value || '',
            granja: document.getElementById('filterGranja')?.value || '',
            estado: document.getElementById('filterEstado')?.value || ''
        };

        // Filtrar datos localmente
        try {
            this.main.mostrarCargando(true);
            
            // Obtener todos los datos
            const response = await this.main.service.getAll();
            let datosFiltrados = response.data || response || [];

            // Aplicar filtros
            if (filtros.fechaInicio) {
                datosFiltrados = datosFiltrados.filter(item => {
                    const fechaItem = new Date(item.inicio || item.fecha_inicio);
                    const fechaFiltro = new Date(filtros.fechaInicio);
                    return fechaItem >= fechaFiltro;
                });
            }

            if (filtros.fechaFin) {
                datosFiltrados = datosFiltrados.filter(item => {
                    const fechaItem = new Date(item.fin || item.fecha_fin);
                    const fechaFiltro = new Date(filtros.fechaFin);
                    return fechaItem <= fechaFiltro;
                });
            }

            if (filtros.granja) {
                datosFiltrados = datosFiltrados.filter(item => 
                    item.granja?.toLowerCase().includes(filtros.granja.toLowerCase())
                );
            }

            if (filtros.estado) {
                datosFiltrados = datosFiltrados.filter(item => 
                    item.estado === filtros.estado
                );
            }

            this.main.datos = datosFiltrados;
            this.main.table.renderizar();
            
            // Mostrar mensaje
            const totalFiltrados = datosFiltrados.length;
            this.main.mostrarNotificacion(
                `Filtros aplicados: ${totalFiltrados} resultado${totalFiltrados !== 1 ? 's' : ''} encontrado${totalFiltrados !== 1 ? 's' : ''}`, 
                'success'
            );
            
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            this.main.mostrarNotificacion('Error al aplicar filtros', 'error');
        } finally {
            this.main.mostrarCargando(false);
        }
    }

    limpiar() {
        // IDs correctos según tu HTML
        const idsCorrectos = [
            'filterFechaInicio',
            'filterFechaFin', 
            'filterGranja',
            'filterEstado'
        ];

        idsCorrectos.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.value = '';
            }
        });

        // Recargar todos los datos
        this.main.cargarDatos();
        this.main.mostrarNotificacion('Filtros limpiados', 'success');
    }

    async cargarGranjasEnFiltro() {
        const selectGranja = document.getElementById('filterGranja');
        if (!selectGranja) return;

        try {
            // Obtener granjas únicas de los datos actuales
            const granjasUnicas = [...new Set(
                this.main.datos
                    .map(item => item.granja)
                    .filter(granja => granja && granja.trim() !== '')
            )].sort();

            // Limpiar y llenar el select
            selectGranja.innerHTML = '<option value="">Todas</option>';
            
            granjasUnicas.forEach(granja => {
                const option = document.createElement('option');
                option.value = granja;
                option.textContent = granja;
                selectGranja.appendChild(option);
            });

        } catch (error) {
            console.error('Error al cargar granjas en filtro:', error);
        }
    }
}
