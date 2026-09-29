# 🎬 CineFlix — Recomendador de Filmes com TensorFlow.js

> **🌐 Idiomas:** [Português](README.md) · [English](README.en.md)
>
> **🔗 Links**
> - **Produção (Vercel):** https://recomendador-de-filmes-rho.vercel.app
> - **GitHub Pages:** https://hugueninfer.github.io/cineflix-recomendador/
> - **Código (GitHub):** https://github.com/Hugueninfer/cineflix-recomendador
> - Deploy automático: cada push na `main` publica uma nova versão.

Projeto pessoal fiel à versão **gabarito `-z`** do
`exemplo-01-ecommerce-recomendations` do módulo 01 da UNIPDS:
uma aplicação web com **MVC + event bus** que treina uma **rede neural
TensorFlow.js** dentro de um **Web Worker**, recomenda filmes e **explica o
porquê de cada recomendação**, comparando com a base de dados.

100% frontend, sem backend e sem banco. Dados fictícios locais.

---

## 🚀 Como rodar

```bash
npm install
npm start
```

Abra `http://localhost:3000`. Ao abrir, o modelo **já treina sozinho**
(veja a barra de progresso e os logs). Depois:

1. Selecione um **perfil** no topo (navbar).
2. Clique em **Assistir** nos posters do catálogo (ou remova do histórico).
3. Com o modelo treinado, clique em **Recomendar**.
4. Passe o mouse em qualquer card recomendado e clique no **ℹ**
   para ver **por que aquele filme foi recomendado** (comparado ao seu histórico).

> A UI não trava durante o treinamento: o TensorFlow.js roda em um **Web Worker**.

---

## 📁 Estrutura do projeto

```
├─ index.html / style.css        → tema estilo Netflix (dark)
├─ package.json
├─ data/
│  ├─ movies.json                → 51 filmes (id, título, gênero, ano, nota)
│  └─ users.json                 → 15 usuários (nome, idade, watched=[ids])
├─ src/
│  ├─ index.js                   → monta tudo + dispara o treino inicial
│  ├─ events/
│  │  ├─ constants.js            → nomes dos eventos (pub/sub)
│  │  └─ events.js               → barramento de CustomEvent (desacopla UI/modelo)
│  ├─ service/
│  │  ├─ UserService.js          → usuários + histórico no sessionStorage
│  │  ├─ MovieService.js         → leitura do catálogo (JSON)
│  │  └─ ExplainService.js       → gera a explicação "por que este filme?"
│  ├─ controller/
│  │  ├─ UserController.js       → seleção de perfil + assistir/remover
│  │  ├─ MovieController.js      → catálogo + botão "Assistir"
│  │  ├─ ModelTrainingController.js → botões de treinar/recomendar + explicações
│  │  └─ WorkerController.js     → ponte de mensagens main-thread ↔ worker
│  ├─ view/
│  │  ├─ View.js                 → base com templates {{placeholders}}
│  │  ├─ UserView.js             → perfil e lista "Já assistidos"
│  │  ├─ MovieView.js            → posters do catálogo
│  │  ├─ ModelTrainingView.js    → progresso, logs, hero, recomendações e modal ℹ
│  │  └─ templates/              → movie-card.html, watched-item.html
│  └─ workers/
│     └─ modelTrainingWorker.js  → rede neural TF.js (igual ao gabarito)
└─ demo.png                      → print da aplicação
```

A arquitetura espelha o template do módulo: **Views** manipulam o DOM,
**Controllers** orquestram, **Services** acessam dados, tudo desacoplado por um
**event bus** (`CustomEvent` no `document`). O "motor" de IA roda isolado no
Web Worker.

---

## 🧠 Como a recomendação funciona (passo a passo)

1. **Vetor de filme** — cada filme vira uma lista de números, ponderada:
   - `gênero` em one-hot (peso **0.4**) — o sinal mais forte
   - `nota` normalizada (peso **0.3**)
   - `ano` normalizado (peso **0.2**)
   - `idade média de quem gosta do filme` (peso **0.1**) ← sinal da multidão
2. **Vetor de usuário** —
   - com histórico: **média** dos vetores dos filmes que assistiu;
   - sem histórico: só a idade dele entra (gênero/nota/ano zerados).
3. **Treinamento** — monta pares `(usuário, filme)` para **todos** os usuários,
   com rótulo `1 = assistiu / 0 = não assistiu`, e treina:
   - arquitetura **128 → 64 → 32 → 1 (sigmoid)**
   - otimizador **Adam (lr 0.01)**, perda **binaryCrossentropy**, métrica **accuracy**
   - **100 épocas**, batch 32
4. **Recomendação** — para cada filme do catálogo, o modelo prevê um
   **score 0–1** de compatibilidade e os filmes são ordenados do maior para o
   menor. O hero mostra o **#1** com destaque.

---

## 👥 O modelo usa os outros usuários?

**Sim.** É um modelo **híbrido** (conteúdo + sinal dos outros usuários):

- **Treinamento global:** os pares `(usuário, filme)` de **todos** os usuários
  alimentam a mesma rede. Os pesos aprendem "perfis parecidos → filmes
  parecidos".
- **Feature da multidão:** cada filme carrega a `idade média de quem gosta
  dele` (calculada na base inteira) — esse é um dado **colaborativo** de
  verdade dentro do vetor do filme.

**Limite (e honestidade técnica):** não é um **filtro colaborativo puro**
(estilo Netflix Prize), porque o modelo **não cria embeddings** de IDs de
usuário ou filme (ex.: um vetor aprendido para o "Bruno" ou para "Matrix").
O usuário é representado pela média dos filmes que viu + idade; o filme, pelas
features + sinal da multidão.

**Evolução possível:** adicionar **item-item** ("quem assistiu X também
assistiu Y") e/ou **matrix factorization** (embeddings usuário×filme).

---

## 🔍 O botão "ℹ" — explicação das recomendações

Cada card recomendado tem um botão **ℹ** que abre um modal explicando o porquê,
gerado pelo `ExplainService` **comparando com a base de dados**:

- **Item-item (colaborativo):** "2 de 2 usuários que assistiram 'Matrix' também
  assistiram 'De Volta para o Futuro' — influência dos outros perfis"
  (calculado na base inteira, excluindo o próprio usuário)
- **Gênero:** "compartilha gênero com 'Matrix' e 'De Volta para o Futuro' (peso 0.4)"
- **Nota:** "nota parecida com 'Toy Story' (8.8 vs 8.3) — peso 0.3"
- **Época:** "ano parecido com 'Matrix' (2010 vs 1999) — peso 0.2"
- **Sem histórico:** explica que o modelo usou apenas a idade
- Mostra o **score da rede neural**, os **chips com o seu histórico** (a base
  comparada) e um rodapé com os pesos do modelo.

Isso é um primeiro passo de **IA explicável (XAI)**: em vez de só mostrar o
resultado, o app mostra a evidência na base de dados.

---

## 📊 Dados do exemplo

| Usuário | Idade | Histórico | Perfil predominante |
|---|---|---|---|
| Ana | 24 | Matrix, Toy Story, De Volta para o Futuro | Ficção Científica + Animação |
| Bruno | 31 | Mad Max, Vingadores, Se Beber | Ação + Comédia |
| Carla | 28 | Orgulho e Preconceito, Brilho Eterno, Sonho de Liberdade | Romance + Drama |
| Elisa | 26 | Corra!, It | Terror |
| Diego | 19 | — (sem histórico) | só idade |
| Marina | 22 | Matrix, De Volta, Blade Runner 2049, Ex Machina | Ficção Científica |
| Fernando / Gustavo | 35 / 30 | Ação de blockbuster | Ação |
| Juliana / Sofia | 27 / 26 | Romance | Romance |
| Rafael | 29 | Terror clássico/psicológico | Terror |

---

## 🚧 Evoluções planejadas

- **Matrix factorization** (embeddings de usuário e filme).
- **Banco vetorial** (Neo4j/Pinecone): guardar os vetores e rodar o `predict`
  só nos candidatos mais próximos — como o gabarito sugere (e liga com o
  `exemplo-12/13` do curso).
- **Dataset real do Kaggle** (ex.: Olist) no mesmo formato dos JSONs.
- Trocar o CDN do TF.js por cópia local (funciona sem internet).