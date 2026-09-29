// Serviço que explica POR QUE um filme foi recomendado,
// comparando diretamente com a base de dados do usuário
// (os filmes que ele já assistiu) e com os pesos da rede neural TF.js.
export class ExplainService {

    explain(movie, watchedMovies = [], allUsers = [], currentUser = null) {
        const reasons = [];

        // Sem histórico: o modelo só usou a idade do usuário
        if (!watchedMovies || watchedMovies.length === 0) {
            reasons.push({
                text: 'Você ainda não tem histórico assistido, então o modelo usou apenas a sua idade para estimar o gosto (peso 0.1).',
            });
            reasons.push({
                text: 'Assista a alguns filmes para a recomendação ficar cada vez mais personalizada.',
            });
            return reasons;
        }

        // 1) Sinal colaborativo: o que OS OUTROS USUÁRIOS assistiram (item-item)
        const itemItem = this.#itemItemReason(movie, watchedMovies, allUsers, currentUser);
        if (itemItem) {
            reasons.push({ text: itemItem.text });
        }

        // 2) Gênero — o sinal mais forte (peso 0.4 no modelo)
        const sameGenre = watchedMovies.filter(w => w.genre === movie.genre);
        if (sameGenre.length > 0) {
            reasons.push({
                text: `Compartilha gênero com ${sameGenre.slice(0, 3).map(w => `"${w.title}"`).join(', ')} — o gênero tem o maior peso no modelo (0.4).`,
            });
        } else {
            reasons.push({
                text: `Nenhum filme do seu histórico é ${movie.genre.toLowerCase()}, mas o modelo ainda achou o perfil compatível por outros fatores.`,
            });
        }

        // 3) Nota parecida (peso 0.3)
        const closeRating = watchedMovies
            .filter(w => Math.abs(w.rating - movie.rating) <= 1.0)
            .sort((a, b) => Math.abs(b.rating - movie.rating) - Math.abs(a.rating - movie.rating));

        if (closeRating.length > 0) {
            const top = closeRating[0];
            reasons.push({
                text: `Nota parecida com "${top.title}" (${movie.rating} vs ${top.rating}) — a nota tem peso 0.3 no modelo.`,
            });
        } else {
            reasons.push({
                text: `Nota (${movie.rating}) foge um pouco da média que você costuma assistir — o modelo ponderou isso (peso 0.3).`,
            });
        }

        // 4) Época / ano parecido (peso 0.2)
        const closeYear = watchedMovies
            .filter(w => Math.abs(w.year - movie.year) <= 12)
            .sort((a, b) => Math.abs(b.year - movie.year) - Math.abs(a.year - movie.year));

        if (closeYear.length > 0) {
            const top = closeYear[0];
            reasons.push({
                text: `Época parecida com "${top.title}" (${movie.year} vs ${top.year}) — o ano tem peso 0.2.`,
            });
        } else {
            reasons.push({
                text: `É de ${movie.year}, uma época diferente do seu histórico — o peso 0.2 do ano influenciou menos.`,
            });
        }

        return reasons;
    }

    // ====================================================================
    // ITEM-ITEM (filtro colaborativo na base): para cada filme que o usuário
    // já assistiu, conta quantos OUTROS usuários também assistiram ao filme
    // recomendado, e mostra o padrão mais forte.
    // Ex.: "2 de 3 usuários que assistiram 'Matrix' também assistiram 'A Origem'."
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
                text: `Nenhum outro usuário da base assistiu "${movie.title}" ainda — a recomendação vem das features do perfil (gênero/nota/ano).`,
            };
        }

        return {
            text: `Padrão entre usuários: ${best.also} de ${best.viewers} usuários que assistiram "${best.watched.title}" também assistiram "${movie.title}" — influência dos outros perfis da base.`,
        };
    }
}