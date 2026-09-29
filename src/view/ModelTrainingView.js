import { View } from './View.js';
import { t } from '../i18n/i18n.js';

// Gradientes por gênero usados nos "posters" da recomendação e no hero.
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

// View da seção de IA: botões de treino/recomendação, barra de progresso,
// logs de treinamento, hero com o destaque e a lista de recomendações.
export class ModelTrainingView extends View {
    #trainBtn = document.querySelector('#trainModelBtn');
    #recommendBtn = document.querySelector('#runRecommendationBtn');
    #progressBar = document.querySelector('#trainingProgress');
    #progressLabel = document.querySelector('#trainingProgressLabel');
    #trainingStats = document.querySelector('#trainingStats');
    #trainingLogs = document.querySelector('#trainingLogs');
    #recommendationsList = document.querySelector('#recommendationsList');

    #hero = document.querySelector('#hero');
    #heroBadge = document.querySelector('#heroBadge');
    #heroTitle = document.querySelector('#heroTitle');
    #heroMeta = document.querySelector('#heroMeta');
    #heroPlay = document.querySelector('#heroPlay');
    #heroMore = document.querySelector('#heroMore');
    #heroProfile = document.querySelector('#heroProfile');

    // Modal de explicação "por que este filme?"
    #infoModal = document.querySelector('#infoModal');
    #infoTitle = document.querySelector('#infoTitle');
    #infoMeta = document.querySelector('#infoMeta');
    #infoScore = document.querySelector('#infoScore');
    #infoReasons = document.querySelector('#infoReasons');
    #infoWatched = document.querySelector('#infoWatched');
    #infoNote = document.querySelector('#infoNote');
    #lastRecommendations = [];

    #onTrain;
    #onRecommend;

    constructor() {
        super();

        this.#trainBtn.addEventListener('click', () => {
            if (this.#onTrain) this.#onTrain();
        });

        this.#recommendBtn.addEventListener('click', () => {
            if (this.#onRecommend) this.#onRecommend();
        });

        // Atalhos do hero usam o mesmo fluxo de recomendação
        this.#heroPlay.addEventListener('click', () => {
            if (this.#onRecommend) this.#onRecommend();
        });
        this.#heroMore.addEventListener('click', () => {
            if (this.#onRecommend) this.#onRecommend();
        });

        // Fecha o modal clicando no fundo ou no X
        this.#infoModal.addEventListener('click', (event) => {
            if (event.target === this.#infoModal) this.closeInfo();
        });
        this.#infoModal.querySelector('.nf-modal-close').addEventListener('click', () => this.closeInfo());
    }

    registerTrainModelCallback(callback) {
        this.#onTrain = callback;
    }

    registerRunRecommendationCallback(callback) {
        this.#onRecommend = callback;
    }

    updateTrainingProgress({ progress }) {
        this.#progressBar.style.width = `${progress}%`;
        this.#progressBar.innerText = `${progress}%`;
        this.#progressLabel.innerText = progress >= 100
            ? t('panels.progressDone')
            : t('panels.progressTraining', { p: progress });
    }

    enableRecommendButton() {
        this.#recommendBtn.disabled = false;
    }

    renderStats(text) {
        this.#trainingStats.innerText = text;
    }

    addTrainingLog({ epoch, loss, accuracy }) {
        const row = document.createElement('div');
        row.className = 'training-log-row d-flex justify-content-between border-bottom py-1 px-1';
        row.innerHTML = `<span>${t('log.epoch', { n: epoch + 1 })}</span>` +
            `<span>${t('log.loss', { v: Number(loss).toFixed(4) })}</span>` +
            `<span>${t('log.acc', { v: (Number(accuracy) * 100).toFixed(1) + '%' })}</span>`;
        this.#trainingLogs.prepend(row);
    }

    // Atualiza o hero (destaque no topo da página)
    updateHero(movie, badge = t('hero.badge.preview')) {
        if (!movie) return;

        this.#heroBadge.innerText = badge;
        this.#heroTitle.innerText = movie.title;
        this.#heroMeta.innerText =
            `${movie.genre} · ${movie.year} · ${t('catalog.rating')} ${movie.rating}`;
        this.#hero.style.setProperty(
            '--hero-gradient',
            genreGradient(movie.genre)
        );
        this.#hero.style.backgroundImage =
            'linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.25)), var(--hero-gradient)';
    }

    // Mostra qual perfil está selecionado (deixa a escolha visível)
    updateActiveProfile(user) {
        if (!user) return;

        this.#heroProfile.innerHTML =
            `<i class="bi bi-person-circle"></i> ${t('hero.profile')}: ` +
            `<strong>${user.name}</strong>` +
            `<span class="nf-hero-profile-age">${t('hero.profileAge', { age: user.age })}</span>`;
    }

    renderRecommendations(recommendations, watchedTitles = new Set()) {
        if (!recommendations || recommendations.length === 0) {
            this.#recommendationsList.innerHTML = '';
            return;
        }

        this.#lastRecommendations = recommendations;

        const html = recommendations.map((movie, index) => {
            const isWatched = watchedTitles.has(movie.title);
            const watchedBadge = isWatched
                ? `<span class="badge nf-watched-badge">${t('rec.watched')}</span>`
                : '';
            const rank = index < 3
                ? `<div class="nf-rank">${index + 1}</div>`
                : '';

            return `
                <div class="movie-card" style="background:${genreGradient(movie.genre)}">
                    ${rank}
                    <div class="movie-card-title">${movie.title}</div>
                    <div class="movie-card-meta">${movie.genre} · ${movie.year}</div>
                    <div class="movie-card-overlay">
                        <span class="badge nf-score">${Math.round(movie.score * 100)}%</span>
                        ${watchedBadge}
                        <button class="btn nf-info-btn" data-idx="${index}" title="${t('rec.infoTitle')}">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');

        this.#recommendationsList.innerHTML = html;
        this.attachInfoButtons();
        this.updateHero(recommendations[0], t('hero.badge.top'));
    }

    // Abre o modal de explicação do filme clicado
    attachInfoButtons() {
        this.#recommendationsList.querySelectorAll('.nf-info-btn').forEach(button => {
            button.addEventListener('click', () => {
                const movie = this.#lastRecommendations[Number(button.dataset.idx)];
                if (movie) this.openInfo(movie);
            });
        });
    }

    openInfo(movie) {
        const watchedMovies = movie.watchedMovies || [];

        this.#infoTitle.innerText = movie.title;
        this.#infoMeta.innerText = `${movie.genre} · ${movie.year} · ${t('catalog.rating')} ${movie.rating}`;
        this.#infoScore.innerText = t('rec.score', { p: Math.round(movie.score * 100) });

        const reasons = movie.explanation && movie.explanation.length
            ? movie.explanation
            : [{ key: 'en.explain.fallback', params: {} }];

        this.#infoReasons.innerHTML = reasons.map((reason, i) => `
            <li class="nf-reason">
                <span class="nf-reason-num">${i + 1}</span>
                <span>${t(reason.key, reason.params || {})}</span>
            </li>`).join('');

        this.#infoWatched.innerHTML = watchedMovies.length
            ? watchedMovies.map(w => `
                <span class="nf-chip">${w.title} <span class="nf-chip-meta">${w.genre} · ${w.year}</span></span>`).join('')
            : `<span class="nf-muted small">${t('rec.emptyHistory')}</span>`;

        this.#infoNote.innerText = t('rec.note');

        this.#infoModal.hidden = false;
    }

    closeInfo() {
        this.#infoModal.hidden = true;
    }
}