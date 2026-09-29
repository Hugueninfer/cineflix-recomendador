// Serviço de usuários: igual ao template do módulo, mas com chave própria.
// Os dados ficam no sessionStorage (somem ao fechar a aba = sempre começa limpo).
export class UserService {
    #storageKey = 'recomendador-filmes-users';

    // Busca os usuários do JSON e semeia o sessionStorage (primeira execução).
    async getDefaultUsers() {
        const response = await fetch('./data/users.json');
        const users = await response.json();
        this.#setStorage(users);
        return users;
    }

    async getUsers() {
        return this.#getStorage();
    }

    async getUserById(userId) {
        const users = this.#getStorage();
        return users.find(user => user.id === userId);
    }

    async updateUser(user) {
        const users = this.#getStorage();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex] = { ...users[userIndex], ...user };
        this.#setStorage(users);
        return users[userIndex];
    }

    #getStorage() {
        const data = sessionStorage.getItem(this.#storageKey);
        return data ? JSON.parse(data) : [];
    }

    #setStorage(data) {
        sessionStorage.setItem(this.#storageKey, JSON.stringify(data));
    }
}