import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS } from '../constants/routes.js';

export function getDiaSemanaAtual() {
    const hoje = new Date();
    const dia = hoje.getDay();
    return (dia >= 1 && dia <= 6) ? dia : 1;
}

export function getNomesDias() {
    return {
        1: 'Segunda-feira',
        2: 'Terça-feira',
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
    };
}
export async function getTarefas() {
   const tarefas = await fetch(ENDPOINTS.TASK.GET_TASKS);
   const resposta = await tarefas.json()
   
   console.log(resposta);
}


