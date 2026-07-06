# Tarefas do Agente

## Tarefa Atual

### Tarefa
Reformular a interface inicial do `remind` para uma experiencia mais minimalista.

### Objetivo
Reduzir a carga visual da dashboard, mover o usuario para o topo direito, deixar a sidebar mais limpa e aproximar a experiencia de um app individual moderno de tarefas/projetos.

### Subtarefas
- [concluida] Revisar shell, sidebar e topo do app.
- [concluida] Simplificar a primeira tela do painel operacional.
- [concluida] Reorganizar projetos, filtros, tarefas e lembretes com menos ruido.
- [concluida] Atualizar estilos globais para uma linguagem visual mais moderna e minimalista.
- [concluida] Validar TypeScript e build.

### Status
Concluido.

### Bloqueios
- `npm` via PowerShell exige uso de `npm.cmd`.
- O PostgreSQL local continua fora do escopo imediato; validacao funcional com dados reais depende do banco ativo.

### Próximos Passos
1. Subir PostgreSQL local quando for validar a area logada com dados reais.
2. Executar `npm.cmd run db:seed`.
3. Rodar `npm.cmd run dev` e revisar a tela no navegador com a referencia visual que o usuario enviar.
