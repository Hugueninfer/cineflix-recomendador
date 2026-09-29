import Events from '../events/events.js';
import { t } from '../i18n/i18n.js';
import { ExplainService } from '../service/ExplainService.js';

// Controller do treinamento: conecta os botões da UI aos eventos do worker.
// Equivalente à ModelTrainingController do gabarito -z.
export class ModelTrainingController {
    #view;
    #userService;
    #movieService;
    #explainService;
    #events;
    #currentUser = null;
    #alreadyTrained = false;

    constructor({ modelTrainingView, userService, movieService, events }) {
        this.#view = modelTrainingView;
        this.#userService = userService;
        this.#movieService = movieService;
        this.#explainService = new ExplainService();
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new ModelTrainingController(deps);
    }

    init() {
        this.setupCallbacks();

        // Hero com um filme em destaque enquanto o modelo não treinou
        this.#setupInitialHero();

        // Lembra o usuário selecionado
        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            this.#view.updateActiveProfile(user);
            if (this.#alreadyTrained) {
                this.#view.enableRecommendButton();
            }
        });

        // Quando o treino terminar, libera a recomendação (se houver usuário)
        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
            if (this.#currentUser) {
                this.#view.enableRecommendButton();
            }
        });

        // Atualiza a barra de progresso
        this.#events.onProgressUpdate((progress) => {
            this.#view.updateTrainingProgress(progress);
        });

        // Mostra os logs de cada época (loss/acurácia)
        this.#events.onTrainingLog((log) => {
            this.#view.addTrainingLog(log);
        });

        // Renderiza as recomendações calculadas pelo modelo (retorno do worker)
        this.#events.onRecommendationsReady(async ({ user, recommendations }) => {
            // Base de dados completa (com as listas resolvidas) para o item-item
            const movies = await this.#movieService.getMovies();
            const usersRaw = await this.#userService.getUsers();
            const allUsers = usersRaw.map(u => ({
                ...u,
                watched: movies.filter(movie => (u.watched || []).includes(movie.id)),
            }));

            const watchedMovies = user?.watched || [];
            const watchedTitles = new Set(watchedMovies.map(movie => movie.title));

            // Enriquece cada filme com a explicação "por que foi recomendado?"
            const enriched = recommendations.map(movie => ({
                ...movie,
                explanation: this.#explainService.explain(movie, watchedMovies, allUsers, user),
                watchedMovies,
            }));

            this.#view.renderRecommendations(enriched, watchedTitles);
        });

        // Estado inicial
        this.#refreshStats();
    }

    setupCallbacks() {
        this.#view.registerTrainModelCallback(this.handleTrainModel.bind(this));
        this.#view.registerRunRecommendationCallback(this.handleRunRecommendation.bind(this));
    }

    async #setupInitialHero() {
        const movies = await this.#movieService.getMovies();
        if (movies.length) {
            this.#view.updateHero(movies[0], t('hero.badge.preview'));
        }
    }

    async #getDatasetInfo() {
        const movies = await this.#movieService.getMovies();
        const users = await this.#userService.getUsers();
        const comHistorico = users.filter(u => (u.watched || []).length).length;
        return { users: comHistorico, movies: movies.length };
    }

    async #refreshStats() {
        const { users, movies } = await this.#getDatasetInfo();
        this.#view.renderStats(t('stats.readyDetail', { users, movies }));
    }

    async handleTrainModel() {
        if (this.#alreadyTrained) {
            this.#view.renderStats(t('stats.alreadyTrained'));
            return;
        }

        const movies = await this.#movieService.getMovies();
        const users = await this.#userService.getUsers();

        // Converte os ids de "watched" em objetos completos de filme
        // (mesma forma que o gabarito manda "purchases" completos ao worker)
        const usersWithMovies = users.map(user => ({
            ...user,
            watched: movies.filter(movie => (user.watched || []).includes(movie.id)),
        }));

        this.#view.renderStats(t('stats.trainingWith', {
            users: usersWithMovies.length,
            movies: movies.length,
        }));
        this.#events.dispatchTrainModel(usersWithMovies);
    }

    async handleRunRecommendation() {
        if (!this.#currentUser) {
            this.#view.renderStats(t('stats.selectUser'));
            return;
        }
        if (!this.#alreadyTrained) {
            this.#view.renderStats(t('stats.trainFirst'));
            return;
        }

        const movies = await this.#movieService.getMovies();
        const user = await this.#userService.getUserById(this.#currentUser.id);
        const userWithMovies = {
            ...user,
            watched: movies.filter(movie => (user.watched || []).includes(movie.id)),
        };

        this.#events.dispatchRecommend(userWithMovies);
    }

    // Chamado ao trocar o idioma: recalcula textos e redesenha as recomendações
    async refreshLanguage() {
        if (this.#alreadyTrained) {
            this.#view.updateTrainingProgress({ progress: 100 });
        }
        if (this.#currentUser) {
            this.#view.updateActiveProfile(this.#currentUser);
        }
        await this.#refreshStats();
        await this.#setupInitialHero();
        if (this.#alreadyTrained && this.#currentUser) {
            await this.handleRunRecommendation();
        }
    }
}