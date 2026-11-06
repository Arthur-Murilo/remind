# Lições do Projeto

## Aprendizados Confirmados

- O projeto precisa manter um protocolo explícito de trabalho para agentes, com atualização prévia de tarefas antes de mudanças relevantes.
- O ambiente local usa PowerShell; quando `npm` falhar por policy, deve-se usar `npm.cmd`.

## Erros Evitáveis

- Não misturar escopo de lembretes in-app com integrações externas nesta v1.
- Não transformar a interface em uma superfície de marketing; ela deve continuar densa, clara e operacional.
- Não deixar o diagrama de arquitetura divergir da implementação real.
- A imagem Next.js standalone não inclui dependências de scripts fora do `server.js`; o entrypoint precisa copiar `node_modules/postgres` para rodar `init-db.mjs`.
- Não expandir todas as subtarefas ao abrir um projeto ou o Meu dia; avisar a continuação com contagem.
- Não tratar o Meu dia como backlog geral; a pauta do dia é prazo de hoje (e atrasadas).
- Não avisar prazo futuro no sininho; o alerta começa no dia do vencimento (amarelo) e fica vermelho se atrasar.
- Não mascarar falha de schema/seed no entrypoint Docker com `|| echo`; o container deve recusar subir se o banco não inicializar.
- Não publicar o Postgres em `0.0.0.0` no Compose de VPS; bind em `127.0.0.1` e senha definida no `.env`.
- Não redefinir a senha de um usuário seed já existente a cada restart; o `.env` vale para a criação inicial.
- Comparar Bearer de MCP com SHA-256 nos dois lados e `timingSafeEqual` só nos digestos de 32 bytes; nunca `timingSafeEqual` em strings de tamanhos diferentes. Isso não é armazenamento de senha (CodeQL `js/insufficient-password-hash` é falso positivo neste caso).
- Nunca enviar stack/detalhe de exceção no corpo HTTP de `/api/mcp`; logar só no servidor em não-produção.
- Nunca logar `Authorization`, nunca aceitar token MCP na query string, nunca usar `NEXT_PUBLIC_*` para o token.
- Rate limit MCP é in-memory por processo e **por IP antes da auth**; rotacionar Bearer falso não dilui o limite. 429 precisa de `Retry-After`.
- Linguagem de domínio no MCP: Tarefa/Subtarefa, não “atividades”.

- Não calcular "hoje" ou limites de período com `new Date()` no servidor: o container roda em UTC. Usar SQL com `TimeZone` da conexão (`APP_TIMEZONE`).
- No postgres.js, um parâmetro string com cast `::timestamp` passa por `new Date()` no cliente e muda de fuso. Para data/hora digitada, usar `${valor}::text::timestamp`.
- Cor de projeto por posição na lista (ou hash do nome) muda quando a lista reordena; derivar da ordem de criação.
- O singleton do Postgres (`globalThis.__remindSql`) sobrevive ao HMR: mudar opções de conexão exige reiniciar o `next dev`.
- Não exibir texto livre vindo de query string na tela de login; usar códigos de erro mapeados.

- Rate limit de login deve contar só falhas; contar todas as tentativas trava a suíte E2E (login por teste) e o uso normal.
- Ao adicionar campo a um formulário compartilhado, não zerar o valor em formulários antigos que não enviam o campo: tratar "campo ausente" como "manter".
- Campos `type="time"` e inputs controlados não respondem a `form_input`/digitação simulada no navegador de teste; validar com setter nativo + evento `input` ou com Playwright `fill`.
- Em `getByRole(..., { name })` o match é por substring: "Período" casa com "Navegar entre períodos". Usar `exact: true`.

- Ao encerrar automaticamente um foco, fechar a sessão no fim planejado (`endsAt`), não em `now()`: aba dormindo ou notebook fechado inflam o tempo.
- Estado compartilhado entre abas (localStorage) não deve ser apagado por uma aba com props antigas; reagir só a mudanças observadas na própria aba.
- Comparação "até o mesmo ponto do período anterior" precisa ser limitada ao início do período atual (meses de tamanhos diferentes).
- Rate limit de login por e-mail puro permite trancar o dono da conta; usar chave IP+e-mail e teto global alto por e-mail.
- Em template literal, `` `\${x}` `` vira o texto `${x}`; reaproveitar `escapeLike` em vez de reescrever o escape.
- Captura rápida: marcador não reconhecido (`#123`) fica no título; só os reconhecidos saem.
- Hora mostrada ao usuário vinda do servidor deve ser formatada no SQL (fuso do app) para não divergir na hidratação.
- `X-Frame-Options: DENY` também bloqueia iframes de teste no mesmo host; validar páginas navegando, não em iframe.

## Padrões Confirmados

- Documentação de operação e produto em português.
- Identificadores internos podem seguir em inglês quando isso reduzir ambiguidade técnica.
- Mudanças estruturais devem ser refletidas em `.codex/arquitetura.md` e no arquivo `.drawio`.
