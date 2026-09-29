// Nomes dos eventos usados no barramento (pub/sub) da aplicação.
export const events = {
    userSelected: 'user:selected',
    movieWatched: 'movie:watched',
    trainModel: 'training:train',
    trainingComplete: 'training:complete',
    modelProgressUpdate: 'model:progress-update',
    trainingLog: 'training:log',
    recommendationsReady: 'recommendations:ready',
    recommend: 'recommend',
};

// Eventos trafegados pelo Web Worker (via postMessage).
export const workerEvents = {
    trainingComplete: 'training:complete',
    trainModel: 'train:model',
    recommend: 'recommend',
    trainingLog: 'training:log',
    progressUpdate: 'progress:update',
};