import Events from '../events/events.js';

// Controller do catálogo: renderiza os filmes e cuida do clique em "Assistir".
// Equivalenta à ProductController do template do módulo.
export class MovieController {
    #view;
    #userService;
    #movieService;
    #events;
    #currentUser = null;

    constructor({ movieView, userService, movieService, events }) {
        this.#view = movieView;
        this.#userService = userService;
        this.#movieService = movieService;
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new MovieController(deps);
    }

    async init() {
        this.setupCallbacks();
        this.setupEventListeners();

        const movies = await this.#movieService.getMovies();
        this.#view.render(movies, true);
    }

    setupCallbacks() {
        this.#view.registerWatchMovieCallback(this.handleWatchMovie.bind(this));
    }

    setupEventListeners() {
        // Habilita os botões quando um usuário é escolhido.
        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            this.#view.onUserSelected(user);
        });
    }

    async handleWatchMovie(movie) {
        const user = await this.#userService.getUserById(this.#currentUser.id);
        this.#events.dispatchMovieWatched({ user, movie });
    }

    // Re-renderiza o catálogo (útil ao trocar o idioma)
    async refreshCatalog() {
        const movies = await this.#movieService.getMovies();
        this.#view.render(movies, !this.#currentUser);
    }
}