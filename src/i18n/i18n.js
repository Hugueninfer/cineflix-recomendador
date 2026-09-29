// ============================================================
// i18n — suporte a Português e Inglês
// ============================================================
// Dicionários: pt (padrão) e en. Uso: t('chave', {params}).
// `apply(root)` traduz nós com data-i18n no DOM. A escolha fica
// guardada no localStorage e também respeita o idioma do navegador.

const translations = {
    pt: {
        'nav.profile': 'Perfil',
        'nav.train': 'Treinar',
        'nav.recommend': 'Recomendar',
        'nav.selectPlaceholder': '-- Selecione --',
        'hero.play': 'Assistir',
        'hero.recommend': 'Recomendar para mim',
        'hero.profile': 'Perfil',
        'hero.profileAge': '· {age} anos',
        'hero.badge.preview': 'PRÉVIA',
        'hero.badge.top': '#1 Recomendado',
        'hero.loading': 'Carregando...',
        'panels.profileTitle': 'Perfil do usuário',
        'panels.age': 'Idade',
        'panels.watched': 'Já assistidos',
        'panels.trainingTitle': 'Treinamento — TensorFlow.js',
        'panels.logsSummary': 'Logs de treinamento (época / loss / acurácia)',
        'panels.progressIdle': 'Clique em "Treinar" para (re)treinar o modelo.',
        'panels.progressTraining': 'Treinando na web worker... {p}%',
        'panels.progressDone': 'Treinamento completo! ✅',
        'rows.recommended': 'Recomendados para você',
        'rows.catalog': 'Catálogo de filmes',
        'footer.note': 'Projeto de estudo — arquitetura e ML no navegador (TensorFlow.js + Web Worker)',
        'empty.watched': 'Nenhum filme assistido ainda.',
        'empty.recommendations': 'Nenhuma recomendação ainda. 🍿',
        'catalog.watch': 'Assistir',
        'catalog.watched': '✓ Assistido',
        'catalog.rating': 'nota',
        'catalog.remove': 'remover',
        'stats.ready': 'Pronto para treinar o modelo.',
        'stats.readyDetail': 'Pronto, com {users} usuários e {movies} filmes na base.',
        'stats.alreadyTrained': 'Modelo já treinado! Clique em "Recomendar".',
        'stats.training': 'Treinando a rede neural com {users} usuários e {movies} filmes...',
        'stats.trainingWith': 'Treinando com {users} usuários e {movies} filmes...',
        'stats.selectUser': 'Selecione um usuário primeiro. 🙂',
        'stats.trainFirst': 'Treine o modelo primeiro. 🧠',
        'log.epoch': 'Época {n}',
        'log.loss': 'loss {v}',
        'log.acc': 'acc {v}',
        'rec.score': 'Score do modelo: {p}%',
        'rec.watched': 'já assistido',
        'rec.infoTitle': 'Por que este filme foi recomendado?',
        'rec.historyTitle': 'Seu histórico (base de dados comparada)',
        'rec.emptyHistory': 'Histórico vazio.',
        'rec.note': 'O score vem da rede neural TensorFlow.js (128→64→32→1) treinada no seu navegador. O modelo pondera: gênero 0.4 · nota 0.3 · ano 0.2 · idade do público 0.1.',
        'modal.close': 'Fechar',
        'explain.noHistory1': 'Você ainda não tem histórico assistido, então o modelo usou apenas a sua idade para estimar o gosto (peso 0.1).',
        'explain.noHistory2': 'Assista a alguns filmes para a recomendação ficar cada vez mais personalizada.',
        'explain.itemItem': 'Padrão entre usuários: {x} de {y} usuários que assistiram "{w}" também assistiram "{m}" — influência dos outros perfis da base.',
        'explain.itemItemNone': 'Nenhum outro usuário da base assistiu "{m}" ainda — a recomendação vem das features do perfil (gênero/nota/ano).',
        'explain.genre': 'Compartilha gênero com {titles} — o gênero tem o maior peso no modelo (0.4).',
        'explain.genreNone': 'Nenhum filme do seu histórico é {genre}, mas o modelo ainda achou o perfil compatível por outros fatores.',
        'explain.rating': 'Nota parecida com "{m}" ({a} vs {b}) — a nota tem peso 0.3 no modelo.',
        'explain.ratingNone': 'Nota ({a}) foge um pouco da média que você costuma assistir — o modelo ponderou isso (peso 0.3).',
        'explain.year': 'Época parecida com "{m}" ({a} vs {b}) — o ano tem peso 0.2.',
        'explain.yearNone': 'É de {a}, uma época diferente do seu histórico — o peso 0.2 do ano influenciou menos.',

        'en.note': 'English available below.',
        'en.explain.fallback': 'Sem explicação detalhada para este filme.',
    },
    en: {
        'nav.profile': 'Profile',
        'nav.train': 'Train',
        'nav.recommend': 'Recommend',
        'nav.selectPlaceholder': '-- Select --',
        'hero.play': 'Play',
        'hero.recommend': 'Recommend movies to me',
        'hero.profile': 'Profile',
        'hero.profileAge': '· {age} yrs',
        'hero.badge.preview': 'PREVIEW',
        'hero.badge.top': '#1 Recommended',
        'hero.loading': 'Loading...',
        'panels.profileTitle': 'User profile',
        'panels.age': 'Age',
        'panels.watched': 'Watched',
        'panels.trainingTitle': 'Training — TensorFlow.js',
        'panels.logsSummary': 'Training logs (epoch / loss / accuracy)',
        'panels.progressIdle': 'Click "Train" to (re)train the model.',
        'panels.progressTraining': 'Training in a web worker... {p}%',
        'panels.progressDone': 'Training complete! ✅',
        'rows.recommended': 'Recommended for you',
        'rows.catalog': 'Movie catalog',
        'footer.note': 'Study project — browser ML architecture (TensorFlow.js + Web Worker)',
        'empty.watched': 'No movies watched yet.',
        'empty.recommendations': 'No recommendations yet. 🍿',
        'catalog.watch': 'Watch',
        'catalog.watched': '✓ Watched',
        'catalog.rating': 'rating',
        'catalog.remove': 'remove',
        'stats.ready': 'Ready to train the model.',
        'stats.readyDetail': 'Ready, with {users} users and {movies} movies in the dataset.',
        'stats.alreadyTrained': 'Model already trained! Click "Recommend".',
        'stats.training': 'Training the neural network with {users} users and {movies} movies...',
        'stats.trainingWith': 'Training with {users} users and {movies} movies...',
        'stats.selectUser': 'Select a profile first. 🙂',
        'stats.trainFirst': 'Train the model first. 🧠',
        'log.epoch': 'Epoch {n}',
        'log.loss': 'loss {v}',
        'log.acc': 'acc {v}',
        'rec.score': 'Model score: {p}%',
        'rec.watched': 'already watched',
        'rec.infoTitle': 'Why was this movie recommended?',
        'rec.historyTitle': 'Your history (compared dataset)',
        'rec.emptyHistory': 'Empty history.',
        'en.explain.fallback': 'No detailed explanation for this movie.',
        'rec.note': 'The score comes from the TensorFlow.js neural network (128→64→32→1) trained in your browser. The model weights: genre 0.4 · rating 0.3 · year 0.2 · audience age 0.1.',
        'modal.close': 'Close',
        'explain.noHistory1': "You don't have a watch history yet, so the model only used your age to estimate your taste (weight 0.1).",
        'explain.noHistory2': 'Watch a few movies and the recommendations will keep getting more personal.',
        'explain.itemItem': 'Pattern among users: {x} of {y} users who watched "{w}" also watched "{m}" — influence of the other profiles in the dataset.',
        'explain.itemItemNone': 'No other user in the dataset has watched "{m}" yet — the recommendation comes from the profile features (genre/rating/year).',
        'explain.genre': 'Shares the genre with {titles} — genre has the highest weight in the model (0.4).',
        'explain.genreNone': "None of the movies in your history is {genre}, but the model still found the profile compatible for other reasons.",
        'explain.rating': 'Similar rating to "{m}" ({a} vs {b}) — rating has weight 0.3 in the model.',
        'explain.ratingNone': 'Rating ({a}) is a bit above/below your usual average — the model weighed that (weight 0.3).',
        'explain.year': 'Similar era to "{m}" ({a} vs {b}) — year has weight 0.2.',
        'explain.yearNone': 'It is from {a}, a different era than your history — the year weight (0.2) mattered less.',
    },
};

const DEFAULT_LANG = 'pt';
const STORAGE_KEY = 'cineflix-lang';

let currentLang = DEFAULT_LANG;

try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
        currentLang = saved;
    } else if (navigator.language && navigator.language.toLowerCase().startsWith('en')) {
        currentLang = 'en';
    }
} catch (_) {
    // localStorage indisponível → mantém o padrão
}

export const i18n = {
    get lang() {
        return currentLang;
    },

    isEnglish() {
        return currentLang === 'en';
    },

    setLang(lang) {
        if (translations[lang]) {
            currentLang = lang;
            try {
                localStorage.setItem(STORAGE_KEY, lang);
            } catch (_) { /* ignore */ }
            this.apply(document);
        }
    },

    // Traduz uma chave, interpolando {param}
    t(key, params = {}) {
        let text = translations[currentLang]?.[key] ?? translations[DEFAULT_LANG]?.[key] ?? key;
        for (const [name, value] of Object.entries(params)) {
            text = text.split(`{${name}}`).join(value);
        }
        return text;
    },

    // Aplica traduções em nós com data-i18n (texto), data-i18n-placeholder
    // e data-i18n-title, dentro do container informado.
    apply(root = document) {
        root.querySelectorAll?.('[data-i18n]').forEach(node => {
            node.textContent = this.t(node.dataset.i18n);
        });
        root.querySelectorAll?.('[data-i18n-placeholder]').forEach(node => {
            node.placeholder = this.t(node.dataset.i18nPlaceholder);
        });
        root.querySelectorAll?.('[data-i18n-title]').forEach(node => {
            node.title = this.t(node.dataset.i18nTitle);
        });
    },
};

export const t = i18n.t.bind(i18n);