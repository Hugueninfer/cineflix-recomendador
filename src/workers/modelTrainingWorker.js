import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _globalCtx = {};
let _model = null;

// ====================================================================
// Pesos de cada grupo de feature na recomendação
// (mesma ideia do gabarito -z, adaptado para filmes)
// ====================================================================
const WEIGHTS = {
    genre: 0.4,  // gênero é o sinal mais forte
    rating: 0.3, // nota média
    year: 0.2,   // "recência" do filme
    age: 0.1,    // idade média de quem gosta do filme
};

// 🎬 Normaliza valores contínuos para 0–1.
// Por quê? Mantém todas as features balanceadas, nenhuma domina o treino.
// Fórmula: (valor - mínimo) / (máximo - mínimo)
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

// Monta o "contexto" com os mínimos/máximos e os índices one-hot
// (categorias e posições). Também calcula a idade média de quem
// assistiu cada filme — isso personifica a recomendação.
function makeContext(movies, users) {
    const ages = users.map(u => u.age);
    const years = movies.map(m => m.year);
    const ratings = movies.map(m => m.rating);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    const genres = [...new Set(movies.map(m => m.genre))];
    const genresIndex = Object.fromEntries(
        genres.map((genre, index) => [genre, index])
    );

    // Idade média (normalizada) de quem assistiu cada filme
    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        (user.watched || []).forEach(movie => {
            ageSums[movie.title] = (ageSums[movie.title] || 0) + user.age;
            ageCounts[movie.title] = (ageCounts[movie.title] || 0) + 1;
        });
    });

    const movieAvgAgeNorm = Object.fromEntries(
        movies.map(movie => {
            const avg = ageCounts[movie.title] ?
                ageSums[movie.title] / ageCounts[movie.title] :
                midAge;

            return [movie.title, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        movies,
        users,
        genresIndex,
        movieAvgAgeNorm,
        minAge,
        maxAge,
        minYear,
        maxYear,
        minRating,
        maxRating,
        numGenres: genres.length,
        // nota + ano + idade média + gêneros (one-hot)
        dimentions: 3 + genres.length,
    };
}

// one-hot (vetor com 1 na posição do índice e 0 no resto),
// multiplicado pelo peso do grupo de feature.
const oneHotWeighted = (index, length, weight) =>
    tf.oneHot(index, length).cast('float32').mul(weight);

// Converte um filme num VETOR NUMÉRICO (tudo entre 0–1).
// O modelo NÃO vê títulos ou palavras — só números.
function encodeMovie(movie, context) {
    const rating = tf.tensor1d([
        normalize(movie.rating, context.minRating, context.maxRating) * WEIGHTS.rating
    ]);

    const year = tf.tensor1d([
        normalize(movie.year, context.minYear, context.maxYear) * WEIGHTS.year
    ]);

    const age = tf.tensor1d([
        (context.movieAvgAgeNorm[movie.title] ?? 0.5) * WEIGHTS.age
    ]);

    const genre = oneHotWeighted(
        context.genresIndex[movie.genre],
        context.numGenres,
        WEIGHTS.genre
    );

    return tf.concat1d([rating, year, age, genre]);
}

// Converte um usuário num vetor:
// - com histórico: média dos vetores dos filmes que já assistiu;
// - sem histórico: preço/nota/gênero ignorados, só a idade entra.
function encodeUser(user, context) {
    if (user.watched.length) {
        return tf.stack(
            user.watched.map(movie => encodeMovie(movie, context))
        )
            .mean(0)
            .reshape([1, context.dimentions]);
    }

    return tf.concat1d([
        tf.zeros([1]), // nota ignorada
        tf.zeros([1]), // ano ignorado
        tf.tensor1d([
            normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
        ]),
        tf.zeros([context.numGenres]), // gênero ignorado
    ]).reshape([1, context.dimentions]);
}

// Cada usuário vira (usuário, filme) para cada filme do catálogo.
// O rótulo (label) = 1 se o usuário já assistiu aquele filme, senão 0.
function createTrainingData(context) {
    const inputs = [];
    const labels = [];

    context.users
        .filter(u => u.watched.length)
        .forEach(user => {
            const userVector = encodeUser(user, context).dataSync();

            context.movies.forEach(movie => {
                const movieVector = encodeMovie(movie, context).dataSync();
                const label = user.watched.some(
                    watched => watched.title === movie.title ? 1 : 0
                );
                // combinar user + movie no mesmo exemplo
                inputs.push([...userVector, ...movieVector]);
                labels.push(label);
            });
        });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimention: context.dimentions * 2,
        // tamanho = userVector + movieVector
    };
}

// ====================================================================
// 🧠 Configuração e treinamento da rede neural (igual ao gabarito)
// ====================================================================
async function configureNeuralNetAndTrain(trainData) {
    const model = tf.sequential();

    // Camada de entrada: 128 neurônios para detectar padrões
    model.add(
        tf.layers.dense({
            inputShape: [trainData.inputDimention],
            units: 128,
            activation: 'relu',
        })
    );

    // Camada oculta 1: 64 neurônios (comprime a informação)
    model.add(
        tf.layers.dense({ units: 64, activation: 'relu' })
    );

    // Camada oculta 2: 32 neurônios (destila os padrões mais fortes)
    model.add(
        tf.layers.dense({ units: 32, activation: 'relu' })
    );

    // Camada de saída: 1 neurônio, sigmoid → score entre 0 e 1
    model.add(
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
    );

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    await model.fit(trainData.xs, trainData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch: epoch,
                    loss: logs.loss,
                    accuracy: logs.acc,
                });
            },
        },
    });

    return model;
}

// ====================================================================
// Fluxo de treinamento (disparado pela thread principal)
// ====================================================================
async function trainModel({ users }) {
    console.log('Treinando modelo com usuários:', users);
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });

    const movies = await (await fetch('../../data/movies.json')).json();
    const context = makeContext(movies, users);
    context.movieVectors = movies.map(movie => ({
        title: movie.title,
        meta: { ...movie },
        vector: encodeMovie(movie, context).dataSync(),
    }));
    _globalCtx = context;

    const trainData = createTrainingData(context);
    _model = await configureNeuralNetAndTrain(trainData);

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

// ====================================================================
// Recomendação usando o modelo treinado
// ====================================================================
function recommend({ user }) {
    if (!_model) return;
    const context = _globalCtx;

    // 1️⃣ Converte o usuário no mesmo formato numérico do treinamento
    const userVector = encodeUser(user, context).dataSync();

    // 2️⃣ Cria pares (usuário, filme) para TODOS os filmes do catálogo
    // Em apps reais: guarde os vetores num banco vetorial e rode o
    // predict só nos candidatos mais próximos (visão do gabarito).
    const inputs = context.movieVectors.map(({ vector }) => [...userVector, ...vector]);

    // 3️⃣ Vira um Tensor e roda a rede em todos os pares de uma vez
    const inputTensor = tf.tensor2d(inputs);
    const predictions = _model.predict(inputTensor);

    // 4️⃣ Extrai as pontuações (0–1) e ordena do maior para o menor
    const scores = predictions.dataSync();
    const recommendations = context.movieVectors.map((item, index) => ({
        ...item.meta,
        title: item.title,
        score: scores[index],
    }));

    const sortedItems = recommendations.sort((a, b) => b.score - a.score);

    // 5️⃣ Envia para a thread principal (a UI exibe agora)
    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: sortedItems,
    });
}

const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend,
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};