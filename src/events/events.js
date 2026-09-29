import { events } from "./constants.js";

// Barramento de eventos: desacopla quem DISPARA de quem ESCUTA.
// Mesmo padrão do template do módulo (CustomEvent no document).
export default class Events {

    // Usuário foi selecionado no dropdown
    static onUserSelected(callback) {
        document.addEventListener(events.userSelected, (event) => callback(event.detail));
    }
    static dispatchUserSelected(data) {
        document.dispatchEvent(new CustomEvent(events.userSelected, { detail: data }));
    }

    // Um filme foi marcado como assistido
    static onMovieWatched(callback) {
        document.addEventListener(events.movieWatched, (event) => callback(event.detail));
    }
    static dispatchMovieWatched(data) {
        document.dispatchEvent(new CustomEvent(events.movieWatched, { detail: data }));
    }

    // Pedido de treinamento do modelo (worker)
    static onTrainModel(callback) {
        document.addEventListener(events.trainModel, (event) => callback(event.detail));
    }
    static dispatchTrainModel(data) {
        document.dispatchEvent(new CustomEvent(events.trainModel, { detail: data }));
    }

    // Treinamento concluído (retorno do worker)
    static onTrainingComplete(callback) {
        document.addEventListener(events.trainingComplete, (event) => callback(event.detail));
    }
    static dispatchTrainingComplete(data) {
        document.dispatchEvent(new CustomEvent(events.trainingComplete, { detail: data }));
    }

    // Progresso do treinamento (0–100)
    static onProgressUpdate(callback) {
        document.addEventListener(events.modelProgressUpdate, (event) => callback(event.detail));
    }
    static dispatchProgressUpdate(data) {
        document.dispatchEvent(new CustomEvent(events.modelProgressUpdate, { detail: data }));
    }

    // Log de cada época: epoch, loss, accuracy
    static onTrainingLog(callback) {
        document.addEventListener(events.trainingLog, (event) => callback(event.detail));
    }
    static dispatchTrainingLog(data) {
        document.dispatchEvent(new CustomEvent(events.trainingLog, { detail: data }));
    }

    // Pedido de recomendação (worker)
    static onRecommend(callback) {
        document.addEventListener(events.recommend, (event) => callback(event.detail));
    }
    static dispatchRecommend(data) {
        document.dispatchEvent(new CustomEvent(events.recommend, { detail: data }));
    }

    // Recomendações prontas (retorno do worker)
    static onRecommendationsReady(callback) {
        document.addEventListener(events.recommendationsReady, (event) => callback(event.detail));
    }
    static dispatchRecommendationsReady(data) {
        document.dispatchEvent(new CustomEvent(events.recommendationsReady, { detail: data }));
    }
}