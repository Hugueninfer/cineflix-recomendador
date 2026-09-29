import { View } from './View.js';

// Gradientes por gênero usados nos "posters" (nenhuma imagem externa).
const GENRE_GRADIENTS = {
    'Ação': ['#8b1a1a', '#e50914'],
    'Aventura': ['#1b4965', '#5fa8d3'],
    'Animação': ['#b45309', '#f59e0b'],
    'Comédia': ['#14532d', '#22c55e'],
    'Drama': ['#3b0764', '#a855f7'],
    'Ficção Científica': ['#0c4a6e', '#38bdf8'],
    'Romance': ['#500724', '#f43f5e'],
    'Suspense': ['#312e81', '#6366f1'],
    'Terror': ['#111111', '#4b5563'],
};

const genreGradient = (genre) => {
    const [a, b] = GENRE_GRADIENTS[genre] || ['#1f2937', '#6b7280'];
    return `linear-gradient(135deg, ${a}, ${b})`;
};

// View do catálogo de filmes: renderiza os posters e o botão "Assistir".
// Equivalente à ProductView do template do módulo.
export class MovieView extends View {
    #movieList = document.querySelector('#movieList');

    #movieTemplate;
    #buttons;
    #onWatchMovie;

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#movieTemplate = await this.loadTemplate('./src/view/templates/movie-card.html');
    }

    registerWatchMovieCallback(callback) {
        this.#onWatchMovie = callback;
    }

    onUserSelected(user) {
        // Só permite "Assistir" quando existe um usuário selecionado.
        this.setButtonsState(!user);
    }

    render(movies, disabled = true) {
        if (!this.#movieTemplate) return;

        const html = movies.map(movie => {
            return this.replaceTemplate(this.#movieTemplate, {
                title: movie.title,
                genre: movie.genre,
                year: movie.year,
                rating: movie.rating,
                gradient: genreGradient(movie.genre),
                movie: JSON.stringify(movie)
            });
        }).join('');

        this.#movieList.innerHTML = html;
        this.attachWatchListeners();
        this.setButtonsState(disabled);
    }

    setButtonsState(disabled) {
        if (!this.#buttons) {
            this.#buttons = document.querySelectorAll('.watch-btn');
        }
        this.#buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    attachWatchListeners() {
        this.#buttons = document.querySelectorAll('.watch-btn');
        this.#buttons.forEach(button => {
            button.addEventListener('click', () => {
                const movie = JSON.parse(button.dataset.movie);

                button.innerText = '✓ Assistido';
                button.style.backgroundColor = '#22c55e';
                button.style.color = '#ffffff';
                setTimeout(() => {
                    button.innerText = 'Assistir';
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 800);

                if (this.#onWatchMovie) {
                    this.#onWatchMovie(movie);
                }
            });
        });
    }
}