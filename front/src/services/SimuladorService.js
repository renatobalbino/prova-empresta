import axios from 'axios';

const SimuladorService = () => {
    return {
        getInstituicoes: () => {
            return new Promise((resolve, reject) => {
                axios.get('/instituicao')
                    .then((response) => resolve(response.data))
                    .catch(err => {
                        reject(err);
                    });
            });
        },

        getConvenios: () => {
            return new Promise((resolve, reject) => {
                axios.get('/convenio')
                    .then((response) => resolve(response.data))
                    .catch(err => {
                        reject(err);
                    });
            });
        },

        simular: (data) => {
            return new Promise((resolve, reject) => {
                axios.post('/simular', data)
                    .then((response) => resolve(response.data))
                    .catch(err => {
                        reject(err);
                    });
            });
        }
    };
}

export default SimuladorService();