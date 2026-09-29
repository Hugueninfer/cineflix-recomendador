// Gera a pasta dist/ com os arquivos estáticos da aplicação (para GitHub Pages).
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

for (const entry of ['index.html', 'style.css', 'data', 'src', 'demo.png']) {
    cpSync(entry, `dist/${entry}`, { recursive: true });
}

console.log('Build concluído: dist/ pronto para publicação.');