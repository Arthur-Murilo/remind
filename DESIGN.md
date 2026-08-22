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
- Sidebar: Meu dia, Lembretes, lista de projetos com dots e contagem, criar projeto inline.
- Meu dia / Lembretes: toolbar + filtros + lista tabular densa (tarefa | projeto | status | prioridade | prazo | etiqueta | tempo | ações).
- Edição inline nas células de status, prioridade, prazo, projeto e etiqueta; duplo clique no título para rename na linha; modal só para descrição/recorrência.
- Colunas redimensionáveis com largura persistida no navegador.
- Subtarefas expandem sob a linha; a seta fica à esquerda do título.
- Sessões de trabalho: timer na linha + visão Tempo na sidebar (dia/semana/mês, por projeto).
- Projeto: mesma lista (sem coluna projeto) + composer de nova tarefa.

## Components

- Botão primário (accent) para ações principais.
- Campos e selects compactos (altura ~30px).
- Linhas de issue com hover, não cartões.
- Badges de status/prioridade com tint suave.
- Empty states com orientação curta.

## Color tokens (resumo)

- `--bg` / `--surface` / `--surface-hover` / `--ink` / `--ink-soft` / `--line`
- `--primary` (#5b6cff) e soft correspondente
- Semânticos: danger, warn, success

## Responsive behavior

- Desktop como superfície principal.
- Em telas menores: sidebar empilha, colunas da lista colapsam, composer deixa de ser sticky.

## Motion

- Transições curtas (≈140–160ms, ease-out) em hover/focus.
- Respeito a `prefers-reduced-motion`.

## Content and language

- Labels e mensagens em português.
- Vocabulário operacional, curto e direto.
