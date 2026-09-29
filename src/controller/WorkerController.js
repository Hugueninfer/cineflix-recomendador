import { workerEvents } from "../events/constants.js";

// Controla a comunicação com o Web Worker (igual ao template/gabarito).
// Recebe os eventos da UI, repassa para o worker e devolve as respostas.
// A thread principal não trava: o TF.js roda no worker.
export class WorkerController {
    #worker;
    #events;
    #alreadyTrained = false;

    constructor({ worker, events }) {
        this.#worker = worker;
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new WorkerController(deps);
    }

    init() {
        this.setupCallbacks();
    }

    setupCallbacks() {
        // ----- lado de ENVIAR: eventos da UI → mensagens para o worker -----
        this.#events.onTrainModel((data) => {
            this.#alreadyTrained = false;
            this.triggerTrain(data);
        });

        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
        });

        this.#events.onRecommend((data) => {
            // não recomenda antes do treino terminar
            if (!this.#alreadyTrained) return;
            this.triggerRecommend(data);
        });

        // ----- lado de RECEBER: respostas do worker → eventos da UI -----
        this.#worker.onmessage = (event) => {
            // Progresso do treinamento (1 → 100)
            if (event.data.type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(event.data.progress);
            }

            // Log de cada época (epoch, loss, accuracy)
            if (event.data.type === workerEvents.trainingLog) {
                this.#events.dispatchTrainingLog(event.data);
            }

            // Modelo pronto
            if (event.data.type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete(event.data);
            }

            // Recomendações calculadas pelo modelo
            if (event.data.type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(event.data);
            }
        };
    }

    triggerTrain(users) {
        this.#worker.postMessage({ action: workerEvents.trainModel, users });
    }

    triggerRecommend(user) {
        this.#worker.postMessage({ action: workerEvents.recommend, user });
    }
}