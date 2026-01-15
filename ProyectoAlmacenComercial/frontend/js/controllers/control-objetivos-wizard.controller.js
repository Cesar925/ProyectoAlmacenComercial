class ControlObjetivosWizardController extends ControlObjetivosController {
    constructor() {
        super();
        this.proyectosWizard = [];
        this.proyectoActualIndex = 0;
        this.cantidadProyectos = 1;
    }

    // ==================== OVERRIDE MÉTODOS DEL MODAL ====================
    
    mostrarModalNuevo() {
        this.registroSeleccionado = null;
        this.pilotoActual = null;
        this.proyectosWizard = [];
        this.proyectoActualIndex = 0;
        
        document.getElementById('modalTitle').textContent = 'Nuevo Objetivo - Wizard';
        this.mostrarConfiguracionInicial();
        this.toggleModal('modalObjetivo', true);
    }

    mostrarConfiguracionInicial() {
        const modalBody = document.querySelector('#modalObjetivo .overflow-y-auto');
        
        modalBody.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                    <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-rocket text-blue-600"></i>
                        Configuración Inicial
                    </h4>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user-tie text-indigo-600 mr-2"></i>
                                Nombre del Piloto *
                            </label>
                            <input type="text" id="wizardPiloto" required
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                placeholder="Ej: Juan Pérez">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-layer-group text-indigo-600 mr-2"></i>
                                ¿Cuántos proyectos desea agregar? *
                            </label>
                            <div class="flex items-center gap-4">
                                <button type="button" id="btnRestarProyecto" 
                                    class="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-110">
                                    <i class="fas fa-minus"></i>
                                </button>
                                
                                <input type="number" id="wizardCantidadProyectos" 
                                    min="1" max="20" value="1" required
                                    class="flex-1 text-center text-3xl font-bold px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                
                                <button type="button" id="btnSumarProyecto"
                                    class="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-110">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2 text-center">
                                <i class="fas fa-info-circle"></i> Máximo 20 proyectos
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div class="flex">
                        <i class="fas fa-lightbulb text-yellow-600 mt-1 mr-3"></i>
                        <div>
                            <h5 class="font-semibold text-yellow-800">¿Qué significa esto?</h5>
                            <p class="text-sm text-yellow-700 mt-1">
                                Cada proyecto puede tener diferentes granjas, galpones, objetivos y metas. 
                                Podrás configurarlos uno por uno en los siguientes pasos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Actualizar footer
        const footer = document.querySelector('#modalObjetivo .flex.justify-end');
        footer.innerHTML = `
            <button type="button" id="btnCancelarWizard"
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105">
                <i class="fas fa-times mr-2"></i>
                Cancelar
            </button>
            <button type="button" id="btnIniciarWizard"
                class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105">
                <i class="fas fa-arrow-right mr-2"></i>
                Iniciar Configuración
            </button>
        `;

        this.setupConfiguracionInicialListeners();
    }

    setupConfiguracionInicialListeners() {
        const inputCantidad = document.getElementById('wizardCantidadProyectos');
        
        document.getElementById('btnRestarProyecto')?.addEventListener('click', () => {
            const valor = parseInt(inputCantidad.value) || 1;
            if (valor > 1) inputCantidad.value = valor - 1;
        });

        document.getElementById('btnSumarProyecto')?.addEventListener('click', () => {
            const valor = parseInt(inputCantidad.value) || 1;
            if (valor < 20) inputCantidad.value = valor + 1;
        });

        document.getElementById('btnCancelarWizard')?.addEventListener('click', () => {
            this.cerrarModal();
        });

        document.getElementById('btnIniciarWizard')?.addEventListener('click', () => {
            this.iniciarWizard();
        });
    }

    iniciarWizard() {
        const piloto = document.getElementById('wizardPiloto')?.value.trim();
        const cantidad = parseInt(document.getElementById('wizardCantidadProyectos')?.value) || 1;

        if (!piloto) {
            this.mostrarNotificacion('Debe ingresar el nombre del piloto', 'error');
            return;
        }

        if (cantidad < 1 || cantidad > 20) {
            this.mostrarNotificacion('La cantidad debe estar entre 1 y 20', 'error');
            return;
        }

        this.cantidadProyectos = cantidad;
        this.proyectosWizard = Array(cantidad).fill(null).map(() => ({
            piloto: piloto,
            granjasGalpones: [{ granja: '', galpon: '' }],
            objetivos: [''],
            metas: [''],
            inicio: '',
            fin: '',
            estado: 'Pendiente'
        }));

        this.proyectoActualIndex = 0;
        this.mostrarFormularioProyecto();
    }

    mostrarFormularioProyecto() {
        const modalBody = document.querySelector('#modalObjetivo .overflow-y-auto');
        const proyecto = this.proyectosWizard[this.proyectoActualIndex];

        modalBody.innerHTML = `
            <div class="wizard-container">
                <!-- Indicador de progreso -->
                <div class="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold text-gray-700">
                            <i class="fas fa-tasks text-indigo-600 mr-2"></i>
                            Proyecto ${this.proyectoActualIndex + 1} de ${this.cantidadProyectos}
                        </span>
                        <span class="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                            ${Math.round(((this.proyectoActualIndex + 1) / this.cantidadProyectos) * 100)}% Completado
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-lg"
                            style="width: ${((this.proyectoActualIndex + 1) / this.cantidadProyectos) * 100}%">
                        </div>
                    </div>
                </div>

                <!-- Información del piloto -->
                <div class="mb-6 bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-user-tie text-white text-xl"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Piloto</p>
                            <p class="font-bold text-gray-800">${proyecto.piloto}</p>
                        </div>
                    </div>
                </div>

                <!-- Formulario del proyecto -->
                <div class="space-y-6">
                    <!-- Granjas y Galpones -->
                    <div class="border-2 border-gray-200 rounded-xl p-4 bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <label class="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <i class="fas fa-warehouse text-green-600"></i>
                                Granjas y Galpones *
                            </label>
                            <button type="button" id="btnAgregarGranjaGalponWizard"
                                class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all transform hover:scale-105">
                                <i class="fas fa-plus mr-1"></i>
                                Agregar
                            </button>
                        </div>
                        <div id="listaGranjasGalponesWizard" class="space-y-3">
                        </div>
                    </div>

                    <!-- Objetivos -->
                    <div class="border-2 border-gray-200 rounded-xl p-4 bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <label class="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <i class="fas fa-bullseye text-blue-600"></i>
                                Objetivos *
                            </label>
                            <button type="button" id="btnAgregarObjetivoWizard"
                                class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all transform hover:scale-105">
                                <i class="fas fa-plus mr-1"></i>
                                Agregar
                            </button>
                        </div>
                        <div id="listaObjetivosWizard" class="space-y-3">
                        </div>
                    </div>

                    <!-- Metas -->
                    <div class="border-2 border-gray-200 rounded-xl p-4 bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <label class="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <i class="fas fa-flag-checkered text-purple-600"></i>
                                Metas *
                            </label>
                            <button type="button" id="btnAgregarMetaWizard"
                                class="bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all transform hover:scale-105">
                                <i class="fas fa-plus mr-1"></i>
                                Agregar
                            </button>
                        </div>
                        <div id="listaMetasWizard" class="space-y-3">
                        </div>
                    </div>

                    <!-- Fechas y Estado -->
                    <div class="border-2 border-gray-200 rounded-xl p-4 bg-white">
                        <label class="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <i class="fas fa-calendar-alt text-indigo-600"></i>
                            Fechas y Estado
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Fecha Inicio *</label>
                                <input type="date" id="wizardInicio" required
                                    value="${proyecto.inicio}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Fecha Fin *</label>
                                <input type="date" id="wizardFin" required
                                    value="${proyecto.fin}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                                <select id="wizardEstado"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="Pendiente" ${proyecto.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="En Proceso" ${proyecto.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderizarGranjasGalponesWizard();
        this.renderizarObjetivosWizard();
        this.renderizarMetasWizard();
        this.actualizarFooterWizard();
        this.setupFormularioProyectoListeners();
    }

    renderizarGranjasGalponesWizard() {
        const lista = document.getElementById('listaGranjasGalponesWizard');
        const proyecto = this.proyectosWizard[this.proyectoActualIndex];

        lista.innerHTML = '';
        proyecto.granjasGalpones.forEach((combo, index) => {
            const item = document.createElement('div');
            item.className = 'flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200';
            item.innerHTML = `
                <div class="flex-1 grid grid-cols-2 gap-2">
                    <select class="granja-select-wizard px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" required>
                        <option value="">-- Seleccione granja --</option>
                    </select>
                    <select class="galpon-select-wizard px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm">
                        <option value="">-- Seleccione granja primero --</option>
                    </select>
                </div>
                ${proyecto.granjasGalpones.length > 1 ? `
                    <button type="button" class="btn-eliminar-granja-wizard text-red-600 hover:text-red-800 transition p-2" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            `;
            lista.appendChild(item);

            const selectGranja = item.querySelector('.granja-select-wizard');
            this.poblarSelectGranjas(selectGranja);
            
            if (combo.granja) {
                const codigoGranja = combo.granja.split(' - ')[0].trim();
                selectGranja.value = codigoGranja;
                this.cargarGalponesParaSelect(selectGranja).then(() => {
                    const selectGalpon = item.querySelector('.galpon-select-wizard');
                    if (combo.galpon) {
                        const codigoGalpon = combo.galpon.split(' - ')[0].trim();
                        selectGalpon.value = codigoGalpon;
                    }
                });
            }

            selectGranja.addEventListener('change', (e) => {
                this.cargarGalponesParaSelect(e.target);
            });
        });
    }

    renderizarObjetivosWizard() {
        const lista = document.getElementById('listaObjetivosWizard');
        const proyecto = this.proyectosWizard[this.proyectoActualIndex];

        lista.innerHTML = '';
        proyecto.objetivos.forEach((objetivo, index) => {
            const item = document.createElement('div');
            item.className = 'flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200';
            item.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    ${index + 1}
                </div>
                <textarea rows="2" placeholder="Describe el objetivo..." 
                    class="objetivo-text-wizard flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">${objetivo}</textarea>
                ${proyecto.objetivos.length > 1 ? `
                    <button type="button" class="btn-eliminar-objetivo-wizard text-red-600 hover:text-red-800 transition p-2" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            `;
            lista.appendChild(item);
        });
    }

    renderizarMetasWizard() {
        const lista = document.getElementById('listaMetasWizard');
        const proyecto = this.proyectosWizard[this.proyectoActualIndex];

        lista.innerHTML = '';
        proyecto.metas.forEach((meta, index) => {
            const item = document.createElement('div');
            item.className = 'flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200';
            item.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    ${index + 1}
                </div>
                <textarea rows="2" placeholder="Describe la meta..." 
                    class="meta-text-wizard flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">${meta}</textarea>
                ${proyecto.metas.length > 1 ? `
                    <button type="button" class="btn-eliminar-meta-wizard text-red-600 hover:text-red-800 transition p-2" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            `;
            lista.appendChild(item);
        });
    }

    actualizarFooterWizard() {
        const footer = document.querySelector('#modalObjetivo .flex.justify-end');
        const esUltimo = this.proyectoActualIndex === this.cantidadProyectos - 1;
        const esPrimero = this.proyectoActualIndex === 0;

        footer.className = 'flex justify-between items-center gap-3 p-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0';
        footer.innerHTML = `
            <button type="button" id="btnCancelarWizard"
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105">
                <i class="fas fa-times mr-2"></i>
                Cancelar
            </button>

            <div class="flex items-center gap-4">
                <button type="button" id="btnAnteriorProyecto" ${esPrimero ? 'disabled' : ''}
                    class="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none">
                    <i class="fas fa-chevron-left mr-2"></i>
                    Anterior
                </button>

                <div class="bg-white border-2 border-indigo-500 rounded-full px-6 py-2">
                    <span class="font-bold text-indigo-600 text-lg">
                        ${this.proyectoActualIndex + 1} / ${this.cantidadProyectos}
                    </span>
                </div>

                ${esUltimo ? `
                    <button type="button" id="btnFinalizarWizard"
                        class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                        <i class="fas fa-check-circle mr-2"></i>
                        Finalizar y Guardar
                    </button>
                ` : `
                    <button type="button" id="btnSiguienteProyecto"
                        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105">
                        Siguiente
                        <i class="fas fa-chevron-right ml-2"></i>
                    </button>
                `}
            </div>
        `;

        document.getElementById('btnCancelarWizard')?.addEventListener('click', () => {
            if (confirm('¿Está seguro de cancelar? Se perderán todos los datos ingresados.')) {
                this.cerrarModal();
            }
        });

        document.getElementById('btnAnteriorProyecto')?.addEventListener('click', () => {
            this.guardarProyectoActual();
            this.proyectoActualIndex--;
            this.mostrarFormularioProyecto();
        });

        document.getElementById('btnSiguienteProyecto')?.addEventListener('click', () => {
            if (this.validarProyectoActual()) {
                this.guardarProyectoActual();
                this.proyectoActualIndex++;
                this.mostrarFormularioProyecto();
            }
        });

        document.getElementById('btnFinalizarWizard')?.addEventListener('click', () => {
            if (this.validarProyectoActual()) {
                this.guardarProyectoActual();
                this.finalizarYGuardarTodos();
            }
        });
    }

    setupFormularioProyectoListeners() {
        document.getElementById('btnAgregarGranjaGalponWizard')?.addEventListener('click', () => {
            const proyecto = this.proyectosWizard[this.proyectoActualIndex];
            proyecto.granjasGalpones.push({ granja: '', galpon: '' });
            this.renderizarGranjasGalponesWizard();
        });

        document.getElementById('listaGranjasGalponesWizard')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-eliminar-granja-wizard');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const proyecto = this.proyectosWizard[this.proyectoActualIndex];
                proyecto.granjasGalpones.splice(index, 1);
                this.renderizarGranjasGalponesWizard();
            }
        });

        document.getElementById('btnAgregarObjetivoWizard')?.addEventListener('click', () => {
            const proyecto = this.proyectosWizard[this.proyectoActualIndex];
            proyecto.objetivos.push('');
            this.renderizarObjetivosWizard();
        });

        document.getElementById('listaObjetivosWizard')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-eliminar-objetivo-wizard');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const proyecto = this.proyectosWizard[this.proyectoActualIndex];
                proyecto.objetivos.splice(index, 1);
                this.renderizarObjetivosWizard();
            }
        });

        document.getElementById('btnAgregarMetaWizard')?.addEventListener('click', () => {
            const proyecto = this.proyectosWizard[this.proyectoActualIndex];
            proyecto.metas.push('');
            this.renderizarMetasWizard();
        });

        document.getElementById('listaMetasWizard')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-eliminar-meta-wizard');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const proyecto = this.proyectosWizard[this.proyectoActualIndex];
                proyecto.metas.splice(index, 1);
                this.renderizarMetasWizard();
            }
        });
    }

    guardarProyectoActual() {
        const proyecto = this.proyectosWizard[this.proyectoActualIndex];

        const granjasGalpones = [];
        document.querySelectorAll('#listaGranjasGalponesWizard > div').forEach(item => {
            const selectGranja = item.querySelector('.granja-select-wizard');
            const selectGalpon = item.querySelector('.galpon-select-wizard');
            
            if (selectGranja?.value) {
                const codigoGranja = selectGranja.value;
                const nombreGranja = selectGranja.selectedOptions[0]?.dataset.nombre || '';
                const codigoGalpon = selectGalpon?.value || '';
                const nombreGalpon = selectGalpon?.selectedOptions[0]?.dataset.nombre || '';

                granjasGalpones.push({
                    granja: `${codigoGranja} - ${nombreGranja}`.trim(),
                    galpon: codigoGalpon ? `${codigoGalpon} - ${nombreGalpon}`.trim() : ''
                });
            }
        });

        const objetivos = Array.from(document.querySelectorAll('.objetivo-text-wizard'))
            .map(textarea => textarea.value.trim())
            .filter(texto => texto);

        const metas = Array.from(document.querySelectorAll('.meta-text-wizard'))
            .map(textarea => textarea.value.trim())
            .filter(texto => texto);

        proyecto.granjasGalpones = granjasGalpones;
        proyecto.objetivos = objetivos;
        proyecto.metas = metas;
        proyecto.inicio = document.getElementById('wizardInicio')?.value || '';
        proyecto.fin = document.getElementById('wizardFin')?.value || '';
        proyecto.estado = document.getElementById('wizardEstado')?.value || 'Pendiente';
    }

    validarProyectoActual() {
        const granjasValidas = Array.from(document.querySelectorAll('.granja-select-wizard'))
            .filter(select => select.value);
        
        if (granjasValidas.length === 0) {
            this.mostrarNotificacion('Debe seleccionar al menos una granja', 'error');
            return false;
        }

        const objetivosValidos = Array.from(document.querySelectorAll('.objetivo-text-wizard'))
            .filter(textarea => textarea.value.trim());
        
        if (objetivosValidos.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos un objetivo', 'error');
            return false;
        }

        const metasValidas = Array.from(document.querySelectorAll('.meta-text-wizard'))
            .filter(textarea => textarea.value.trim());
        
        if (metasValidas.length === 0) {
            this.mostrarNotificacion('Debe agregar al menos una meta', 'error');
            return false;
        }

        const inicio = document.getElementById('wizardInicio')?.value;
        const fin = document.getElementById('wizardFin')?.value;

        if (!inicio || !fin) {
            this.mostrarNotificacion('Debe ingresar las fechas de inicio y fin', 'error');
            return false;
        }

        if (new Date(inicio) > new Date(fin)) {
            this.mostrarNotificacion('La fecha de inicio no puede ser mayor a la fecha fin', 'error');
            return false;
        }

        return true;
    }

    async finalizarYGuardarTodos() {
        try {
            this.mostrarCargando(true);

            let registrosCreados = 0;

            for (const proyecto of this.proyectosWizard) {
                const maxItems = Math.max(proyecto.objetivos.length, proyecto.metas.length);

                for (const combo of proyecto.granjasGalpones) {
                    for (let i = 0; i < maxItems; i++) {
                        const payload = {
                            piloto: proyecto.piloto,
                            granja: combo.granja,
                            galpon: combo.galpon,
                            objetivo: proyecto.objetivos[i] || '',
                            meta: proyecto.metas[i] || '',
                            inicio: proyecto.inicio,
                            fin: proyecto.fin,
                            estado: proyecto.estado
                        };

                        await this.service.create(payload);
                        registrosCreados++;
                    }
                }
            }

            this.mostrarNotificacion(
                `✓ Se crearon ${registrosCreados} registros exitosamente`, 
                'success'
            );
            
            this.cerrarModal();
            await this.cargarDatos();

        } catch (error) {
            console.error('Error al guardar proyectos:', error);
            this.mostrarNotificacion('Error al guardar los proyectos', 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }

    // Override para mantener compatibilidad con modo edición
    editarRegistro(piloto) {
        // Usar el método original del padre para edición
        super.editarRegistro(piloto);
    }
}

// Reemplazar el controlador global
document.addEventListener('DOMContentLoaded', () => {
    window.controller = new ControlObjetivosWizardController();
    window.controller.init();
});