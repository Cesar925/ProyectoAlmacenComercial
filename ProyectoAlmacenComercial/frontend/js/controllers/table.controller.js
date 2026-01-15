class TableController {
    constructor(mainController) {
        this.main = mainController;
    }

    renderizar() {
        const tbody = document.getElementById('tbodyObjetivos');
        const emptyState = document.getElementById('emptyState');

        if (!tbody) return;

        if (this.main.datos.length === 0) {
            emptyState?.classList.remove('hidden');
            tbody.innerHTML = '';
            return;
        }

        emptyState?.classList.add('hidden');
        const grupos = this.agruparPorPiloto(this.main.datos);
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

        return grupo.map((registro, index) => 
            this.renderizarFila(registro, grupo, index, progreso, estadoClass, totalTareas, tareasCompletadas)
        ).join('');
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
                        <button data-action="descargar-archivo" data-id="${principal.id}"
                            class="text-green-600 hover:text-green-800 hover:bg-green-50 rounded p-2 transition-all" 
                            title="Descargar o visualizar archivo">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
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
}
