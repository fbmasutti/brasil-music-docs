<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Multi-AI Collaboration (Lovable + Claude Code + Antigravity)

- **Git Source of Truth**: Todos os assistentes utilizam o repositório GitHub `https://github.com/fbmasutti/brasil-music-docs` como ponte de sincronização.
- **Antigravity**: Atua na arquitetura, inspeção visual, análise estática, testes locais (`npm run lint`, `npm run build`) e geração de mockups/funcionalidades.
- **Claude Code**: Atua no terminal via CLI para tarefas ágeis de edição e automação.
- **Lovable**: Interface visual e prototipagem contínua.
- **Regras Gerais**: Consultar [.agents/rules/collaboration.md](file:///Users/fbmasutti/.gemini/antigravity/scratch/brasil-music-docs/.agents/rules/collaboration.md).
