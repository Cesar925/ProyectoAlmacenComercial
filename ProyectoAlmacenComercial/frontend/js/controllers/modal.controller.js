class ModalController {
    constructor(mainController) {
        this.main = mainController;
    }

    toggle(modalId, show) {
        const modal = document.getElementById(modalId);
        modal?.classList.toggle('hidden', !show);
    }

    cerrarObjetivo() { this.toggle('modalObjetivo', false); }
    cerrarSubprocesos() { this.toggle('modalSubprocesos', false); }
    cerrarTarea() { this.toggle('modalTarea', false); }

    mostrarNuevo() {
        this.main.registroSeleccionado = null;
        this.main.pilotoActual = null;
        
        document.getElementById('modalTitle').textContent = 'Nuevo Objetivo';
        document.getElementById('formObjetivo').reset();
        document.getElementById('modalId').value = '';
        
        this.limpiarListas();
        this.inicializarGranjasGalpones();
        this.toggle('modalObjetivo', true);
    }

    limpiarListas() {
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
            this.main.poblarSelectGranjas(item.querySelector('.granja-select'));
            item.querySelector('.granja-select').addEventListener('change', (e) => {
                this.main.cargarGalponesParaSelect(e.target);
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
        
        if (this.main.granjasDisponibles.length > 0) {
            this.main.poblarSelectGranjas(granjaSelect);
            if (codigoGranja) {
                granjaSelect.value = codigoGranja;
                this.main.cargarGalponesParaSelect(granjaSelect).then(() => {
                    if (codigoGalpon) galponSelect.value = codigoGalpon;
                });
            }
        }
        
        return item;
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
            this.limpiarListas();
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
                this.main.poblarSelectGranjas(item.querySelector('.granja-select'));
                item.querySelector('.granja-select').addEventListener('change', (e) => {
                    this.main.cargarGalponesParaSelect(e.target);
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
}
