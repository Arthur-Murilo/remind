# Tarefas do Agente

## Tarefa Atual

### Tarefa
Implementar o piloto de UX **Meu dia (telefone)** a partir do Figma e das decisões travadas.

### Objetivo
Em viewports ≤767px, Meu dia passa a cards + bottom sheet + bottom nav + FAB, sem regressão da tabela/modal no desktop. Sem novas regras de negócio.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`) e o Figma (frames 01–04 + tokens).
- [x] Mapear shell, lista de tarefas e modais atuais.
- [x] Extrair `TaskForm` compartilhado; casca `TaskDialog` (sheet no telefone, modal no desktop).
- [x] Cards/stack no Meu dia ≤767; grupos Atrasadas / Hoje; empty state acordado.
- [x] Bottom nav (Meu dia / Projetos / Tempo / Mais) com polish e ícones claros.
- [x] FAB +; menu ⋯ (Editar / Concluir / Excluir); sem swipe.
- [x] Safe-area, alvos ≥44px, inputs ≥16px no telefone.
- [x] Projetos/Mais como rotas simples; Tempo reutiliza a rota existente.
- [x] Smoke Playwright no viewport de telefone.
- [x] Typecheck, E2E e verificação visual; abrir PR.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.

---

## Tarefa Anterior

### Tarefa
Resolver conflitos de merge do PR de segurança solicitado em comentário.

### Objetivo
Sincronizar o branch do PR com `main`, resolver conflitos preservando os upgrades de segurança e validar que o projeto continua íntegro.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`).
- [x] Inspecionar estado do git e identificar branch base padrão.
- [x] Executar merge de `main` no branch atual e resolver conflitos.
- [x] Validar com `npm run typecheck` e tentar `npm run build` (falha de rede ao baixar Google Fonts no ambiente).
- [ ] Responder ao comentário no PR com o commit de resolução.

### Status
Em andamento.

### Bloqueios
Build depende de acesso externo a `fonts.googleapis.com` no ambiente de execução.

### Próximos Passos
Finalizar commit de merge e responder ao comentário no PR.
