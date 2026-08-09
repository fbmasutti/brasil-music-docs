# Diretrizes de Colaboração Multi-AI (Lovable + Claude Code + Antigravity)

Este repositório (**brasil-music-docs / StageKit**) é mantido em colaboração entre três agentes de IA e o desenvolvedor:

1. **Lovable**: Plataforma de prototipagem e desenvolvimento de interface rápida conectada via Git.
2. **Claude Code**: Assistente CLI para edições e automações de código via terminal.
3. **Antigravity**: Agente de IA para arquitetura, auditoria visual, análises complexas, testes e geração de assets/código.

---

## ⚠️ Regras Fundamentais de Git e Sincronização

1. **Nunca Reescrever Histórico Publicado no Git (`main`)**:
   - Não utilizar `git push --force`, `git rebase` ou `git commit --amend` em commits já enviados ao repositório remoto.
   - O Lovable sincroniza diretamente com o repositório GitHub. Alterar o histórico publicado pode quebrar o estado do projeto no Lovable.

2. **Commits Limpos e Informativos**:
   - Sempre faça commits atômicos com mensagens claras (ex: `feat: adiciona componente de rider técnico` ou `fix: ajusta rotas do TanStack Router`).
   - Mantenha a branch `main` sempre funcional e sem erros de build.

3. **Arquitetura da Aplicação (StageKit)**:
   - **Framework**: React 19 + TanStack Router/Start + Vite.
   - **Estilização**: Tailwind CSS v4 + Radix UI + Lucide React.
   - **Backend / Database**: Supabase JS Client (`@supabase/supabase-js`).
   - **Qualidade**: ESLint + Prettier.

---

## 🔄 Fluxo de Trabalho Integrado

- **Desenvolvimento Visual / UI**: Pode ser iniciado no **Lovable** ou no **Antigravity**.
- **Refatorações e Validações**: **Antigravity** e **Claude Code** executam validações locais (`npm run lint`, `npm run build`), verificando integrações com o Supabase e rotas do TanStack.
- **Resolução de Conflitos**: Sempre resolver mesclando (`git merge`) se houver edições concorrentes, mantendo integridade com a branch conectada ao Lovable.
