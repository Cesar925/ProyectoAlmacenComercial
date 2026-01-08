class FilterObjetivosController {
    constructor(mainController) {
        this.main = mainController;
    }

    async filter_objetivos_aplicar() {
        const filtros = {
            piloto: document.getElementById('filtroPiloto')?.value,
            granja: document.getElementById('filtroGranja')?.value,
            estado: document.getElementById('filtroEstado')?.value,
            fechaInicio: document.getElementById('filtroFechaInicio')?.value,
            fechaFin: document.getElementById('filtroFechaFin')?.value
        };

        try {
            this.main.mostrarCargando(true);
            const response = await this.main.service.getAll(filtros);
            this.main.datos = response.data || response || [];
            this.main.tableObjetivos.table_objetivos_renderizar();
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            this.main.mostrarNotificacion('Error al aplicar filtros', 'error');
        } finally {
            this.main.mostrarCargando(false);
        }
    }

    filter_objetivos_limpiar() {
        ['filtroPiloto', 'filtroGranja', 'filtroEstado', 'filtroFechaInicio', 'filtroFechaFin'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        this.main.cargarDatos();
    }
}
