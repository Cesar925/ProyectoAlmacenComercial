class ModalObjetivosController {
    constructor(mainController) {
        this.main = mainController;
        this.modalId = 'modalObjetivo';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botón agregar objetivo
        document.getElementById('btnAgregarObjetivo')?.addEventListener('click', () => {
            this.modal_objetivos_agregarItem();
        });

        // Botón agregar meta
        document.getElementById('btnAgregarMeta')?.addEventListener('click', () => {
            this.modal_objetivos_agregarMeta();
        });

        // Botón agregar granja-galpón
        document.getElementById('btnAgregarGranjaGalpon')?.addEventListener('click', () => {
            this.modal_objetivos_agregarGranjaGalpon();
        });

        // Delegación de eventos para eliminar objetivos
        document.getElementById('listaObjetivos')?.addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.btn-eliminar-objetivo');
            if (btnEliminar) {
                this.modal_objetivos_eliminarItem(btnEliminar, '.objetivo-item', 'objetivo');
            }
        });

        // Delegación de eventos para eliminar metas
        document.getElementById('listaMetas')?.addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.btn-eliminar-meta');
            if (btnEliminar) {
                this.modal_objetivos_eliminarItem(btnEliminar, '.meta-item', 'meta');
            }
        });

        // Delegación de eventos para granjas-galpones
        document.getElementById('listaGranjasGalpones')?.addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.btn-eliminar-granja-galpon');
            if (btnEliminar) {
                this.modal_objetivos_eliminarGranjaGalpon(btnEliminar);
            }
        });

        // Cambio de granja para cargar galpones
        document.getElementById('listaGranjasGalpones')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('granja-select')) {
                this.main.cargarGalponesParaSelect(e.target);
            }
        });
    }

    modal_objetivos_toggle(show) {
        const modal = document.getElementById(this.modalId);
        modal?.classList.toggle('hidden', !show);
        if (show) {
            modal?.classList.add('flex');
        } else {
            modal?.classList.remove('flex');
        }
    }

    modal_objetivos_cerrar() {
        this.modal_objetivos_toggle(false);
    }

    modal_objetivos_mostrarNuevo() {
        this.main.registroSeleccionado = null;
        this.main.pilotoActual = null;
        
        document.getElementById('modalTitle').textContent = 'Nuevo Objetivo';
        document.getElementById('formObjetivo').reset();
        document.getElementById('modalId').value = '';
        
        this.modal_objetivos_limpiarListas();
        this.modal_objetivos_inicializarGranjasGalpones();
        this.modal_objetivos_toggle(true);
    }

    modal_objetivos_limpiarListas() {
        // Limpiar objetivos
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

        // Limpiar metas
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

    modal_objetivos_inicializarGranjasGalpones() {
        const lista = document.getElementById('listaGranjasGalpones');
        lista.innerHTML = '';
        this.modal_objetivos_agregarGranjaGalpon();
    }

    modal_objetivos_agregarItem() {
        const listaObjetivos = document.getElementById('listaObjetivos');
        const nuevoObjetivo = document.createElement('div');
        nuevoObjetivo.className = 'objetivo-item flex gap-2';
        nuevoObjetivo.innerHTML = `
            <textarea rows="2" placeholder="Describe el objetivo..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 objetivo-text"></textarea>
            <button type="button" class="btn-eliminar-objetivo text-red-600 hover:text-red-800 px-2">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listaObjetivos.appendChild(nuevoObjetivo);
        this.modal_objetivos_actualizarBotonesEliminar();
    }

    modal_objetivos_agregarMeta() {
        const listaMetas = document.getElementById('listaMetas');
        const nuevaMeta = document.createElement('div');
        nuevaMeta.className = 'meta-item flex gap-2';
        nuevaMeta.innerHTML = `
            <textarea rows="2" placeholder="Describe la meta..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 meta-text"></textarea>
            <button type="button" class="btn-eliminar-meta text-red-600 hover:text-red-800 px-2">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listaMetas.appendChild(nuevaMeta);
        this.modal_objetivos_actualizarBotonesEliminar();
    }

    modal_objetivos_agregarGranjaGalpon(combo = { granja: '', galpon: '' }) {
        const lista = document.getElementById('listaGranjasGalpones');
        const item = document.createElement('div');
        item.className = 'granja-galpon-item flex gap-2';
        item.innerHTML = `
            <select class="granja-select flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required>
                <option value="">-- Seleccione granja --</option>
            </select>
            <select class="galpon-select flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">-- Seleccione granja primero --</option>
            </select>
            <button type="button" class="btn-eliminar-granja-galpon text-red-600 hover:text-red-800 px-2">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        lista.appendChild(item);
        
        // Poblar select de granjas
        setTimeout(() => {
            const selectGranja = item.querySelector('.granja-select');
            this.main.poblarSelectGranjas(selectGranja);
            
            // Si hay valores previos, establecerlos
            const codigoGranja = combo.granja ? combo.granja.split(' - ')[0].trim() : '';
            const codigoGalpon = combo.galpon ? combo.galpon.split(' - ')[0].trim() : '';
            
            if (codigoGranja) {
                selectGranja.value = codigoGranja;
                this.main.cargarGalponesParaSelect(selectGranja).then(() => {
                    if (codigoGalpon) {
                        const galponSelect = item.querySelector('.galpon-select');
                        galponSelect.value = codigoGalpon;
                    }
                });
            }
            
            this.modal_objetivos_actualizarBotonesEliminar();
        }, 100);
    }

    modal_objetivos_eliminarItem(btnEliminar, selector, tipo) {
        const item = btnEliminar.closest(selector);
        const items = document.querySelectorAll(selector);
        if (items.length > 1) {
            item.remove();
            this.modal_objetivos_actualizarBotonesEliminar();
        } else {
            this.main.mostrarNotificacion(`Debe haber al menos un ${tipo}`, 'error');
        }
    }

    modal_objetivos_eliminarGranjaGalpon(btnEliminar) {
        const item = btnEliminar.closest('.granja-galpon-item');
        const items = document.querySelectorAll('.granja-galpon-item');
        if (items.length > 1) {
            item.remove();
            this.modal_objetivos_actualizarBotonesEliminar();
        } else {
            this.main.mostrarNotificacion('Debe haber al menos una granja-galpón', 'error');
        }
    }

    modal_objetivos_actualizarBotonesEliminar() {
        // Objetivos
        const objetivos = document.querySelectorAll('#listaObjetivos .objetivo-item');
        objetivos.forEach((item) => {
            const btn = item.querySelector('.btn-eliminar-objetivo');
            if (btn) {
                btn.style.display = objetivos.length > 1 ? 'block' : 'none';
            }
        });

        // Metas
        const metas = document.querySelectorAll('#listaMetas .meta-item');
        metas.forEach((item) => {
            const btn = item.querySelector('.btn-eliminar-meta');
            if (btn) {
                btn.style.display = metas.length > 1 ? 'block' : 'none';
            }
        });

        // Granjas-Galpones
        const granjasGalpones = document.querySelectorAll('#listaGranjasGalpones .granja-galpon-item');
        granjasGalpones.forEach((item) => {
            const btn = item.querySelector('.btn-eliminar-granja-galpon');
            if (btn) {
                btn.style.display = granjasGalpones.length > 1 ? 'block' : 'none';
            }
        });
    }

    modal_objetivos_cargarGranjasGalponesDeGrupo(grupoRegistros) {
        const lista = document.getElementById('listaGranjasGalpones');
        lista.innerHTML = '';

        const combinacionesUnicas = this.modal_objetivos_obtenerCombinacionesUnicas(grupoRegistros);
        combinacionesUnicas.forEach((combo) => {
            this.modal_objetivos_agregarGranjaGalpon(combo);
        });
    }

    modal_objetivos_obtenerCombinacionesUnicas(registros) {
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

    modal_objetivos_cargarObjetivosMetasDeGrupo(grupoRegistros) {
        const objetivos = [...new Set(grupoRegistros.map(r => r.objetivo).filter(o => o))];
        const metas = [...new Set(grupoRegistros.map(r => r.meta).filter(m => m))];
        
        this.modal_objetivos_cargarItemsEnLista('listaObjetivos', objetivos, 'objetivo');
        this.modal_objetivos_cargarItemsEnLista('listaMetas', metas, 'meta');
    }

    modal_objetivos_cargarItemsEnLista(listaId, items, tipo) {
        const lista = document.getElementById(listaId);
        lista.innerHTML = '';

        if (items.length === 0) {
            this.modal_objetivos_limpiarListas();
            return;
        }

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `${tipo}-item flex gap-2`;
            itemDiv.innerHTML = `
                <textarea rows="2" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${tipo}-text">${item}</textarea>
                <button type="button" class="btn-eliminar-${tipo} text-red-600 hover:text-red-800 px-2" style="display: ${items.length > 1 ? 'block' : 'none'};">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            lista.appendChild(itemDiv);
        });
    }
}
