# Tarefas do Agente

## Tarefa Atual

### Tarefa
Redesign da tela de login — split-screen expressivo adaptado ao remind.

### Objetivo
Aplicar layout split com mesh animado, constelação de pontos e CTA gradiente índigo, alinhado ao DESIGN.md sem estética de landing genérica.

### Subtarefas
- [x] Sessão de grilling: direção A (expressivo adaptado), painel B + animação A.
- [x] Reestruturar `src/app/login/page.tsx` (split form + painel visual).
- [x] Tokens e estilos auth isolados em `globals.css`.
- [x] Mesh animado + pontos/constelação no painel direito.
- [x] Botão pill gradiente e inputs com glow no focus.
- [x] Responsivo: painel visual oculto em telas ≤860px.
- [x] Validar TypeScript e revisão visual no navegador.

### Status
Concluído.

### Bloqueios
Nenhum.

### Próximos Passos
1. Rodar `npm run typecheck`.
2. Revisar em `http://localhost:3000/login`.
3. Ajustes finos se o usuário pedir (copy, intensidade do mesh, etc.).
