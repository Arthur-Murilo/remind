# DESIGN.md

## Product overview

`remind` é uma ferramenta interna para gestão de projetos e tarefas. A experiência deve favorecer leitura rápida, baixa fricção operacional e uma navegação previsível entre projetos, tarefas, filtros e lembretes.

## Design principles

1. Clareza antes de ornamentação.
2. Densidade moderada com boa escaneabilidade.
3. Navegação objetiva e consistente.
4. Estados de prioridade e prazo visíveis sem ruído.
5. Componentes orientados a trabalho recorrente.

## Visual direction

- Superfície de produto, não de marketing.
- Paleta sóbria com contraste firme, priorizando legibilidade.
- Hierarquia tipográfica enxuta, com títulos compactos e texto utilitário.
- Espaçamento estável para listas, filtros, tabelas leves e painéis laterais.

## Layout

- App shell com navegação lateral simples e cabeçalho funcional.
- Área principal orientada a listas, filtros e detalhes contextuais.
- Filtros sempre próximos da listagem de tarefas.
- Lembretes in-app visíveis sem competir com a operação principal.

## Components

- Botões primários para ações claras.
- Campos compactos para busca e filtros.
- Tabelas/listas híbridas para tarefas.
- Badges de status e prioridade.
- Painéis simples para resumo de projeto e lembretes.

## Responsive behavior

- Desktop como superfície principal.
- Em telas menores, priorizar empilhamento claro, filtros recolhíveis e preservação da legibilidade.
- Evitar overflow textual em badges, botões e cabeçalhos.

## Motion

- Animações discretas e utilitárias.
- Nada de transições longas ou decorativas.
- Estados interativos devem funcionar mesmo com movimento reduzido.

## Content and language

- Labels, mensagens e textos em português.
- Vocabulário operacional, curto e direto.
