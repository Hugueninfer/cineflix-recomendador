import Events from '../events/events.js';

// Controller do usuário: orquestra seleção, "assistir" e remover do histórico.
// Equivalenta à UserController do template do módulo.
export class UserController {
    #view;
    #userService;
    #movieService;
    #events;
    #currentUserId = null;

    constructor({ userView, userService, movieService, events }) {
        this.#view = userView;
        this.#userService = userService;
        this.#movieService = movieService;
        this.#events = events;
    }

    static init(deps) {
        return new UserController(deps);
    }

    // Carrega os usuários do JSON e liga callbacks + listeners de eventos.
    async renderUsers() {
        const users = await this.#userService.getDefaultUsers();

        this.#view.renderUserOptions(users);
        this.setupCallbacks();
        this.setupEventListeners();

        // Perfil padrão já selecionado: dispara o fluxo como se o usuário
        // tivesse escolhido no dropdown (habilita botões, mostra histórico...)
        if (users.length > 0) {
            await this.handleUserSelect(users[0].id);
        }
    }

    setupCallbacks() {
        this.#view.registerUserSelectCallback(this.handleUserSelect.bind(this));
        this.#view.registerWatchedRemoveCallback(this.handleWatchedRemove.bind(this));
    }

    setupEventListeners() {
        // Quando o MovieController avisa que um filme foi assistido...
        this.#events.onMovieWatched(async ({ user, movie }) => {
            return this.handleWatchedAdded({ user, movie });
        });
    }

    async handleUserSelect(userId) {
        this.#currentUserId = userId;
        const user = await this.#userService.getUserById(userId);
        this.#events.dispatchUserSelected(user);
        return this.displayUserDetails(user);
    }

    // Re-renderiza o perfil atual (útil ao trocar o idioma)
    async refreshUserUI() {
        if (!this.#currentUserId) return;
        const user = await this.#userService.getUserById(this.#currentUserId);
        if (user) {
            return this.displayUserDetails(user);
        }
    }

    async handleWatchedAdded({ user, movie }) {
        const updatedUser = await this.#userService.getUserById(user.id);

        if (!updatedUser.watched.includes(movie.id)) {
            updatedUser.watched.push(movie.id);
        }

        await this.#userService.updateUser(updatedUser);
        return this.displayUserDetails(updatedUser);
    }

    async handleWatchedRemove({ userId, movie }) {
        const user = await this.#userService.getUserById(userId);
        const index = user.watched.indexOf(movie.id);

        if (index !== -1) {
            user.watched.splice(index, 1);
            await this.#userService.updateUser(user);
            return this.displayUserDetails(user);
        }
    }

    async displayUserDetails(user) {
        this.#view.renderUserDetails(user);

        const movies = await this.#movieService.getMovies();
        const watchedMovies = movies.filter(movie => (user.watched || []).includes(movie.id));
        this.#view.renderWatched(watchedMovies);
    }
}