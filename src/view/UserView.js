import { View } from './View.js';
import { t } from '../i18n/i18n.js';

// View do perfil do usuário: dropdown, idade e lista "Já assistidos".
// Mesma função da UserView do template do módulo.
export class UserView extends View {
    #userSelect = document.querySelector('#userSelect');
    #userAge = document.querySelector('#userAge');
    #watchedList = document.querySelector('#watchedList');

    #watchedTemplate;
    #onUserSelect;
    #onWatchedRemove;

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#watchedTemplate = await this.loadTemplate('./src/view/templates/watched-item.html');
        this.attachUserSelectListener();
    }

    registerUserSelectCallback(callback) {
        this.#onUserSelect = callback;
    }

    registerWatchedRemoveCallback(callback) {
        this.#onWatchedRemove = callback;
    }

    renderUserOptions(users) {
        const options = users.map(user => {
            return `<option value="${user.id}">${user.name}</option>`;
        }).join('');

        this.#userSelect.innerHTML =
            `<option value="">${t('nav.selectPlaceholder')}</option>` + options;

        // Deixa o primeiro perfil já selecionado: a app já nasce pronta
        if (users.length > 0) {
            this.#userSelect.value = String(users[0].id);
        }
    }

    renderUserDetails(user) {
        this.#userAge.value = user.age || '';
    }

    renderWatched(watchedMovies) {
        if (!this.#watchedTemplate) return;

        if (!watchedMovies || watchedMovies.length === 0) {
            this.#watchedList.innerHTML =
                `<p class="text-muted mb-0">${t('empty.watched')}</p>`;
            return;
        }

        const html = watchedMovies.map(movie => {
            return this.replaceTemplate(this.#watchedTemplate, {
                title: movie.title,
                removeBtn: t('catalog.remove'),
                movie: JSON.stringify(movie)
            });
        }).join('');

        this.#watchedList.innerHTML = html;
        this.attachRemoveHandlers();
    }

    addWatched(movie) {
        // Limpa a mensagem de "nenhum filme assistido" se estiver visível
        const emptyMsg = this.#watchedList.querySelector('p.text-muted');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const html = this.replaceTemplate(this.#watchedTemplate, {
            title: movie.title,
            removeBtn: t('catalog.remove'),
            movie: JSON.stringify(movie)
        });
        this.#watchedList.insertAdjacentHTML('afterbegin', html);
        this.attachRemoveHandlers();
    }

    attachUserSelectListener() {
        this.#userSelect.addEventListener('change', (event) => {
            const userId = event.target.value ? Number(event.target.value) : null;

            if (userId && this.#onUserSelect) {
                this.#onUserSelect(userId);
            }
        });
    }

    attachRemoveHandlers() {
        document.querySelectorAll('.remove-watch-btn').forEach(button => {
            button.onclick = () => {
                const movie = JSON.parse(button.dataset.movie);
                const userId = this.getSelectedUserId();
                if (this.#onWatchedRemove) {
                    this.#onWatchedRemove({ userId, movie });
                }
            };
        });
    }

    getSelectedUserId() {
        return this.#userSelect.value ? Number(this.#userSelect.value) : null;
    }
}