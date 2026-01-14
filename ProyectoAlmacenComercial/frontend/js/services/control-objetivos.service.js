class ControlObjetivosService {
    constructor() {
        this.config = window.ControlObjetivosConfig;
        this.baseUrl = this.config.API.BASE_URL;
        //this.baseUrl = this.config.API.BASEURL;
    }

    async getAll() {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.ALL}`;
            console.log('Llamando a URL:', url);
            const response = await fetch(url);
            console.log('Response status:', response.status);
            if (!response.ok) throw new Error('Error en la petición: ' + response.status);
            const data = await response.json();
            console.log('Datos recibidos:', data);
            return data;
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    }
    async getTareasPorItem(piloto, idGrupo, indice, tipo) {
    try {
        const response = await fetch(
            `${this.baseUrl}/subprocesos?piloto=${piloto}&id_grupo=${idGrupo}&indice=${indice}&tipo=${tipo}`
        );
        if (!response.ok) throw new Error('Error al obtener tareas');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}


    async create(data) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.CREAR}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Error al crear');
            return await response.json();
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    async createMultiple(registros) {
        try {
            const url = `${this.baseUrl}/controlobjetivos/crear-multiple`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registros })
            });
            if (!response.ok) throw new Error('Error al crear múltiples registros');
            return await response.json();
        } catch (error) {
            console.error('Error en createMultiple:', error);
            throw error;
        }
    }

    async update(data) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.ACTUALIZAR}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Error al actualizar');
            return await response.json();
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.ELIMINAR}/${id}`;
            const response = await fetch(url, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar');
            return await response.json();
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }

    async getFiltered(filters) {
        try {
            const params = new URLSearchParams();
            if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
            if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
            if (filters.granja) params.append('granja', filters.granja);
            if (filters.estado) params.append('estado', filters.estado);

            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.FILTRO}?${params}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error en filtrado');
            return await response.json();
        } catch (error) {
            console.error('Error en getFiltered:', error);
            throw error;
        }
    }

    // Subprocesos
    async getSubprocesos(idRegistro) {
        try {
            // Usar la ruta correcta del API
            const url = `${this.baseUrl}/controlobjetivos/${idRegistro}/subprocesos`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener subprocesos');
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error en getSubprocesos:', error);
            return [];
        }
    }

    /*async getSubprocesos(idObjetivo) {
        try {
            const url = `${this.baseUrl}/controlobjetivos/${idObjetivo}/subprocesos`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener tareas');
            return await response.json();
        } catch (error) {
            console.error('Error en getSubprocesos:', error);
            throw error;
        }
    }
*/
    async createSubproceso(data) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.SUBPROCESO_CREAR}`;
            console.log('Enviando datos:', data);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al crear tarea');
            }
            
            return result;
        } catch (error) {
            console.error('Error en createSubproceso:', error);
            throw error;
        }
    }

    async updateSubproceso(data) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.SUBPROCESO_ACTUALIZAR}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Error al actualizar tarea');
            return await response.json();
        } catch (error) {
            console.error('Error en updateSubproceso:', error);
            throw error;
        }
    }

    async deleteSubproceso(id) {
        try {
            const url = `${this.baseUrl}${this.config.API.ENDPOINTS.SUBPROCESO_ELIMINAR}/${id}`;
            const response = await fetch(url, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar tarea');
            return await response.json();
        } catch (error) {
            console.error('Error en deleteSubproceso:', error);
            throw error;
        }
    }
}
