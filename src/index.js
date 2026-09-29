import { UserController } from './controller/UserController.js';
import { MovieController } from './controller/MovieController.js';
import { ModelTrainingController } from './controller/ModelTrainingController.js';
import { WorkerController } from './controller/WorkerController.js';
import { UserService } from './service/UserService.js';
import { MovieService } from './service/MovieService.js';
import { UserView } from './view/UserView.js';
import { MovieView } from './view/MovieView.js';
import { ModelTrainingView } from './view/ModelTrainingView.js';
import Events from './events/events.js';

// ============================================================
// Ponto de entrada — monta tudo, igual ao template do módulo.
// ============================================================

// 1) Serviços compartilhados
const userService = new UserService();
const movieService = new MovieService();

// 2) Views
const userView = new UserView();
const movieView = new MovieView();
const modelView = new ModelTrainingView();

// 3) Web Worker que roda o TensorFlow.js fora da thread principal
const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });
const workerController = WorkerController.init({
    worker: mlWorker,
    events: Events,
});

// 4) Controllers (cada um recebe o que precisa)
ModelTrainingController.init({
    modelTrainingView: modelView,
    userService,
    movieService,
    events: Events,
});

MovieController.init({
    movieView,
    userService,
    movieService,
    events: Events,
});

const userController = UserController.init({
    userView,
    userService,
    movieService,
    events: Events,
});

// 5) Carrega usuários e já treina o modelo automaticamente (como o gabarito)
(async () => {
    const users = await userService.getDefaultUsers();
    const movies = await movieService.getMovies();

    userController.renderUsers();

    // Converte os ids de "watched" em filmes completos antes de treinar
    const usersWithMovies = users.map(user => ({
        ...user,
        watched: movies.filter(movie => (user.watched || []).includes(movie.id)),
    }));
    workerController.triggerTrain(usersWithMovies);
})();