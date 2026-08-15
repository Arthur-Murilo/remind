# Tarefas do Agente

## Tarefa Atual

### Tarefa
Bateria de testes E2E com TestSprite MCP e correção de funcionalidades quebradas.

### Objetivo
Validar cada funcionalidade do sistema `remind` via TestSprite (E2E frontend), analisar falhas e corrigir o que não estiver funcionando corretamente.

### Subtarefas
- [x] Autenticar/verificar conta TestSprite e créditos disponíveis (Free, 150 créditos).
- [x] Garantir app local rodando (`npm run dev` em http://localhost:3000).
- [x] Bootstrap TestSprite (config criada em `testsprite_tests/tmp/config.json`).
- [x] Gerar sumário de código, PRD padronizado e plano de testes frontend (~50 casos).
- [x] Executar Batch 1 (TC001–TC015): login, dashboard, concluir/reabrir, logout, filtro — **15/15 Passed**.
- [x] Executar Batch 2 (CRUD/filtros/recorrência/lembretes/subtarefas/tags/validação) — **15/15 Passed**.
- [x] Analisar relatório de falhas: **nenhum bug de produto detectado**.
- [x] Gerar relatório consolidado em `testsprite_tests/testsprite-mcp-test-report.md`.
- [ ] (Opcional) Instalar browsers Playwright e revalidar `npm run test:e2e` localmente.

### Status
Concluído com sucesso (30/30 testes TestSprite Passed; sem correções de código necessárias).

### Bloqueios
Nenhum bloqueio de produto. Ambiente local Playwright sem Chromium instalado no sandbox (não afeta TestSprite).

### Próximos Passos
1. Apresentar relatório ao usuário.
2. Se desejar cobertura extra: `npx playwright install` + `npm run test:e2e`, ou Batch 3 no TestSprite em production mode.
