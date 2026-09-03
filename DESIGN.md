# DESIGN.md

## Product overview

`remind` é uma ferramenta interna para gestão de projetos, tarefas e lembretes in-app. A experiência prioriza densidade operacional, leitura rápida e navegação previsível — no espírito de ferramentas como Linear Issues, adaptada a um app pessoal de lembretes e organização leve de projetos.

## Design principles

1. Clareza antes de ornamentação.
2. Densidade alta com boa escaneabilidade (lista tipo Issues).
3. Navegação objetiva: sidebar com projetos, conteúdo em lista.
4. Estados de prioridade e prazo visíveis sem ruído.
5. Pouco chrome: sem cards decorativos ou painéis laterais competindo com a lista.

## Visual direction

- Tema escuro (Restrained): superfícies near-black, tipografia clara, accent índigo só em ação/seleção.
- Superfície de produto, não de marketing.
- Tipografia: Inter, escala compacta (~13px base), títulos enxutos.
- Bordas hairline, hover de linha sutil, badges discretos.

## Layout

- App shell: sidebar (~244px) + topbar fina + área principal full-bleed.
- Sidebar: Meu dia, lista de projetos com dots e contagem, criar projeto inline.
- Meu dia: só tarefas abertas com prazo de hoje ou atrasadas. Tarefa criada nessa visão já nasce com prazo de hoje. O atalho Abertas mostra a lista completa.
- Lembretes: toolbar + filtros + lista tabular densa via pílulas Hoje/Atrasadas (tarefa | projeto | status | prioridade | prazo | etiqueta | tempo | ações).
- Edição inline nas células de status, prioridade, prazo, projeto e etiqueta; duplo clique no título para rename na linha; modal só para descrição/recorrência.
- Prioridades reordenáveis por arrastar no menu do catálogo; a lista de tarefas segue essa ordem.
- Prazo de hoje em amarelo e prazo atrasado em vermelho, na lista e no sininho.
- Colunas redimensionáveis: a largura inicial acompanha o conteúdo (títulos longos expandem a coluna) e o ajuste manual continua persistido no navegador.
- Subtarefas começam recolhidas; a seta à esquerda do título abre a lista. Recolhida, um aviso discreto (três barrinhas + contagem) fica abaixo do nome.
- Sessões de trabalho: timer e chip de tempo na linha da tarefa + visão Tempo (filtros de dia/semana/mês e agrupamento do gráfico por projeto ou tarefa).
- Projeto: mesma lista (sem coluna projeto) + composer de nova tarefa.

## Components

- Botão primário (accent) para ações principais.
- Marca: glifo de lembrete (nota com aba e check) na sidebar, login e favicon.
- Campos e selects compactos (altura ~30px).
- Linhas de issue com hover, não cartões.
- Badges de status/prioridade com tint suave.
- Empty states com orientação curta.

## Color tokens (resumo)

- `--bg` / `--surface` / `--surface-hover` / `--ink` / `--ink-soft` / `--line`
- `--primary` (#5b6cff) e soft correspondente
- Semânticos: danger, warn, success

## Responsive behavior

- Desktop (≥960px): sidebar persistente + lista tabular densa.
- Tablet e telefone (<960px): a sidebar vira drawer por cima do conteúdo, aberta pelo menu no topbar.
- Telefone (<720px): a lista empilha título, metadados e ações; cabeçalho de colunas some; métricas, filtros, Tempo e modais ocupam a largura da tela.
- Alvos de toque maiores em `pointer: coarse`; `viewport-fit: cover` e safe-area para recortes e home indicator.

## Motion

- Transições curtas (≈140–160ms, ease-out) em hover/focus.
- Respeito a `prefers-reduced-motion`.

## Content and language

- Labels e mensagens em português.
- Vocabulário operacional, curto e direto.
