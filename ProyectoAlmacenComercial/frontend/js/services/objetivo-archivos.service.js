class ObjetivoArchivosService {
    constructor() {
        /*this.apiUrl = window.config?.apiUrl || 'http://localhost/ProyectoAlmacenComercial/backend/routers/api.php';*/
    this.apiUrl = window.ControlObjetivosConfig?.API?.API_URL || 
                      window.AppConfig?.API?.API_URL || 
                      '/proyectos/backend/routers/api.php';
    }

    // Subir múltiples archivos
    async uploadArchivos(idObjetivo, archivos) {
        const formData = new FormData();
        formData.append('id_objetivo', idObjetivo);

        for (let i = 0; i < archivos.length; i++) {
            formData.append('archivos[]', archivos[i]);
        }

        try {
            const response = await fetch(`${this.apiUrl}/objetivo-archivos/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error subiendo archivos:', error);
            throw error;
        }
    }

    // Obtener archivos de un objetivo
    async getArchivos(idObjetivo) {
        try {
            const response = await fetch(`${this.apiUrl}/objetivo-archivos/${idObjetivo}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo archivos:', error);
            throw error;
        }
    }

    // Eliminar un archivo
    async deleteArchivo(idRuta) {
        try {
            const response = await fetch(`${this.apiUrl}/objetivo-archivos/delete/${idRuta}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            throw error;
        }
    }
}
