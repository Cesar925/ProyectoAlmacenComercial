class FormController {
    constructor(mainController) {
        this.main = mainController;
    }

    async guardar() {
        try {
            const objetivosTextos = this.obtenerTextosDeTextareas('.objetivo-text');
            const metasTextos = this.obtenerTextosDeTextareas('.meta-text');
            const granjasGalpones = this.obtenerGranjasGalpones();

            if (!this.validar(objetivosTextos, metasTextos, granjasGalpones)) return;

            const datosComunes = this.obtenerDatosComunes();
            const id = document.getElementById('modalId').value;

            if (id) {
                await this.actualizar(objetivosTextos, metasTextos, granjasGalpones, datosComunes);
            } else {
                await this.crear(objetivosTextos, metasTextos, granjasGalpones, datosComunes);
            }

            this.main.modal.cerrarObjetivo();
            await this.main.cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            this.main.mostrarNotificacion(this.main.config.MENSAJES.ERROR.GUARDAR, 'error');
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

    validar(objetivos, metas, granjas) {
        if (objetivos.length === 0) {
            this.main.mostrarNotificacion('Debe agregar al menos un objetivo', 'error');
            return false;
        }
        if (metas.length === 0) {
            this.main.mostrarNotificacion('Debe agregar al menos una meta', 'error');
            return false;
        }
        if (granjas.length === 0) {
            this.main.mostrarNotificacion('Debe seleccionar al menos una granja', 'error');
            return false;
        }
        return true;
    }

    obtenerDatosComunes() {
        return {
            piloto: document.getElementById('modalPiloto').value,
            inicio: document.getElementById('modalInicio').value,
            fin: document.getElementById('modalFin').value,
            estado: document.getElementById('modalEstado').value
        };
    }

    async actualizar(objetivos, metas, granjasGalpones, datosComunes) {
        const pilotoOriginal = this.main.pilotoActual || this.main.registroSeleccionado?.piloto;
        const grupoRegistros = this.main.datos.filter(d => d.piloto === pilotoOriginal);
        
        const registrosMap = new Map();
        grupoRegistros.forEach(reg => {
            const clave = `${reg.granja}|${reg.galpon}|${reg.objetivo}|${reg.meta}`;
            registrosMap.set(clave, reg);
        });

        const clavesNuevas = new Set();
        const registrosParaCrear = [];

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
                    const regExistente = registrosMap.get(clave);
                    await this.main.service.update({ id: regExistente.id, ...payload });
                } else {
                    registrosParaCrear.push(payload);
                }
            }
        }

        for (const [clave, reg] of registrosMap) {
            if (!clavesNuevas.has(clave)) {
                await this.main.service.delete(reg.id);
            }
        }

        if (registrosParaCrear.length > 0) {
            const primerIdExistente = grupoRegistros[0]?.id;
            for (const payload of registrosParaCrear) {
                const nuevoRegistro = await this.main.service.create(payload);
                const idNuevo = nuevoRegistro?.data?.id || nuevoRegistro?.id;
                
                if (primerIdExistente && idNuevo) {
                    await this.copiarTareas(primerIdExistente, idNuevo);
                }
            }
        }

        this.main.mostrarNotificacion(this.main.config.MENSAJES.EXITO.ACTUALIZADO, 'success');
    }

    async crear(objetivos, metas, granjasGalpones, datosComunes) {
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
                
                const nuevoRegistro = await this.main.service.create(payload);
                const idNuevo = nuevoRegistro?.data?.id || nuevoRegistro?.id;
                
                if (primerIdCreado === null && idNuevo) {
                    primerIdCreado = idNuevo;
                } else if (primerIdCreado && idNuevo && primerIdCreado !== idNuevo) {
                    await this.copiarTareas(primerIdCreado, idNuevo);
                }
            }
        }

        this.main.mostrarNotificacion(this.main.config.MENSAJES.EXITO.GUARDADO, 'success');
    }

    async copiarTareas(idOrigen, idDestino) {
        try {
            const tareasOrigen = await this.main.service.getSubprocesos(idOrigen);
            
            if (tareasOrigen?.length > 0) {
                for (const tarea of tareasOrigen) {
                    await this.main.service.createSubproceso({
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

    editar(piloto) {
        const grupoRegistros = this.main.datos.filter(d => d.piloto === piloto);
        if (grupoRegistros.length === 0) return;

        const principal = grupoRegistros[0];
        this.main.registroSeleccionado = principal;
        this.main.pilotoActual = piloto;

        document.getElementById('modalTitle').textContent = 'Editar Objetivo';
        document.getElementById('modalId').value = principal.id;
        document.getElementById('modalPiloto').value = principal.piloto || '';

        this.main.modal.cargarGranjasGalponesDeGrupo(grupoRegistros);
        this.main.modal.cargarObjetivosMetasDeGrupo(grupoRegistros);

        document.getElementById('modalInicio').value = principal.inicio || '';
        document.getElementById('modalFin').value = principal.fin || '';
        document.getElementById('modalEstado').value = principal.estado || 'Pendiente';

        this.main.modal.toggle('modalObjetivo', true);
    }

    async eliminar(id, piloto) {
        if (!confirm(`¿Eliminar este registro de ${piloto}?`)) return;
        
        try {
            await this.main.service.delete(id);
            this.main.mostrarNotificacion(this.main.config.MENSAJES.EXITO.ELIMINADO, 'success');
            await this.main.cargarDatos();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.main.mostrarNotificacion(this.main.config.MENSAJES.ERROR.ELIMINAR, 'error');
        }
    }
}
