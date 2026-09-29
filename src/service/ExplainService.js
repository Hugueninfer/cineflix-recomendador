// Serviço que explica POR QUE um filme foi recomendado,
// comparando diretamente com a base de dados do usuário
// (os filmes que ele já assistiu) e com os pesos da rede neural TF.js.
//
// Cada motivo é devolvido como { key, params } para o i18n traduzir
// na língua atual (pt/en).
export class ExplainService {

    explain(movie, watchedMovies = [], allUsers = [], currentUser = null) {
        const reasons = [];

        // Sem histórico: o modelo só usou a idade do usuário
        if (!watchedMovies || watchedMovies.length === 0) {
            reasons.push({ key: 'explain.noHistory1', params: {} });
            reasons.push({ key: 'explain.noHistory2', params: {} });
            return reasons;
        }

        // 1) Sinal colaborativo: o que OS OUTROS USUÁRIOS assistiram (item-item)
        const itemItem = this.#itemItemReason(movie, watchedMovies, allUsers, currentUser);
        if (itemItem) {
            reasons.push(itemItem);
        }

        // 2) Gênero — o sinal mais forte (peso 0.4 no modelo)
        const sameGenre = watchedMovies.filter(w => w.genre === movie.genre);
        if (sameGenre.length > 0) {
            reasons.push({
                key: 'explain.genre',
                params: { titles: sameGenre.slice(0, 3).map(w => `"${w.title}"`).join(', ') },
            });
        } else {
            reasons.push({
                key: 'explain.genreNone',
                params: { genre: movie.genre.toLowerCase() },
            });
        }

        // 3) Nota parecida (peso 0.3)
        const closeRating = watchedMovies
            .filter(w => Math.abs(w.rating - movie.rating) <= 1.0)
            .sort((a, b) => Math.abs(b.rating - movie.rating) - Math.abs(a.rating - movie.rating));

        if (closeRating.length > 0) {
            const top = closeRating[0];
            reasons.push({
                key: 'explain.rating',
                params: { a: movie.rating, b: top.rating, m: top.title },
            });
        } else {
            reasons.push({
                key: 'explain.ratingNone',
                params: { a: movie.rating },
            });
        }

        // 4) Época / ano parecido (peso 0.2)
        const closeYear = watchedMovies
            .filter(w => Math.abs(w.year - movie.year) <= 12)
            .sort((a, b) => Math.abs(b.year - movie.year) - Math.abs(a.year - movie.year));

        if (closeYear.length > 0) {
            const top = closeYear[0];
            reasons.push({
                key: 'explain.year',
                params: { a: movie.year, b: top.year, m: top.title },
            });
        } else {
            reasons.push({
                key: 'explain.yearNone',
                params: { a: movie.year },
            });
        }

        return reasons;
    }

    // ====================================================================
    // ITEM-ITEM (filtro colaborativo na base): para cada filme que o usuário
    // já assistiu, conta quantos OUTROS usuários também assistiram ao filme
    // recomendado, e mostra o padrão mais forte.
    // Ex.: "2 de 2 usuários que assistiram 'Matrix' também assistiram 'A Origem'."
    // ====================================================================
    #itemItemReason(movie, watchedMovies, allUsers, currentUser) {
        const others = (allUsers || []).filter(u => u && u.id !== (currentUser && currentUser.id));
        if (others.length === 0) return null;

        let best = null;

        for (const watched of watchedMovies) {
            const viewers = others.filter(u =>
                (u.watched || []).some(w => w.title === watched.title)
            );
            if (viewers.length === 0) continue;

            const also = viewers.filter(u =>
                (u.watched || []).some(w => w.title === movie.title)
            ).length;

            const support = also / viewers.length;
            if (also > 0 && (!best || support > best.support)) {
                best = { watched, viewers: viewers.length, also, support };
            }
        }

        if (!best) {
            return {
                key: 'explain.itemItemNone',
                params: { m: movie.title },
            };
        }

        return {
            key: 'explain.itemItem',
            params: {
                x: best.also,
                y: best.viewers,
                w: best.watched.title,
                m: movie.title,
            },
        };
    }
}