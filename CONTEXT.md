# remind

Ferramenta interna de gestão de projetos, tarefas e lembretes in-app para uso individual e equipe pequena.

## Language

**Projeto**:
Um agrupamento nomeado de tarefas sob um dono.
_Avoid_: Pasta, board, workspace

**Tarefa**:
Unidade de trabalho com status, prioridade, prazo opcional e vínculo a um projeto.
_Avoid_: Issue, card, item (como nome canônico)

**Status**:
Estado operacional da Tarefa. Os de sistema são A fazer, Em andamento e Concluída; os demais são definidos pelo usuário. Só Concluída fecha a tarefa.
_Avoid_: coluna, etapa, workflow

**Prioridade**:
Grau de urgência da Tarefa. As de sistema são Alta, Média e Baixa; as demais são definidas pelo usuário. A ordem do catálogo (arrastar para cima ou para baixo) define a ordem das tarefas na lista.
_Avoid_: severidade, peso

**Prazo**:
Data opcional de vencimento da Tarefa. Não é um catálogo criável. Lembretes e o sininho só avisam no dia do prazo (amarelo) ou quando a tarefa está atrasada (vermelho).
_Avoid_: rótulo de prazo, sprint name como se fosse prazo

**Subtarefa**:
Passo de um único nível ligado a uma tarefa; não possui projeto próprio nem subtarefas aninhadas. Começa recolhida sob a tarefa pai, com aviso de contagem. Concluir subtarefas não fecha a tarefa pai; concluir a pai marca as subtarefas como concluídas.
_Avoid_: Checklist item (como sinônimo frouxo), sub-issue

**Meu dia**:
Visão da pauta do dia: tarefas abertas com prazo de hoje ou atrasadas, mais as concluídas que venciam hoje. Não é o backlog completo.
_Avoid_: Inbox, todas as tarefas, board do dia

**Etiqueta**:
Rótulo colorido reutilizável que o usuário associa a tarefas para classificação. Nome e cor são editáveis; a exclusão remove o rótulo das tarefas.
_Avoid_: Tag (na UI), label, categoria

**Exclusão**:
Remoção permanente e irreversível de um registro (hard delete), sempre com confirmação explícita.
_Avoid_: Arquivar, soft delete, lixeira (fora de escopo nesta fase)

**Exclusão de Projeto**:
Remove o projeto e, em cascata, todas as suas tarefas, subtarefas e lembretes derivados.
_Avoid_: Desvincular tarefas, mover para “sem projeto”

**Exclusão de Tarefa**:
Remove permanentemente a tarefa, suas subtarefas e lembretes derivados, após confirmação explícita.
_Avoid_: Arquivar tarefa, ocultar

**Edição na lista**:
Alteração imediata de Status, Prioridade, Prazo, Etiqueta e Projeto direto na linha da tarefa.
_Avoid_: Só via modal de edição

**Estimativa**:
Tempo previsto para concluir uma Tarefa, opcional, comparado com o tempo registrado nas Sessões de trabalho.
_Avoid_: Pontos, story points, esforço

**Meta diária de foco**:
Quantidade de tempo registrado por dia que o usuário quer atingir; mostrada como anel no Meu dia e como dias batidos na visão Tempo.
_Avoid_: Cota, target (na UI)

**Ritual do dia**:
Planejar (manhã) e Encerrar (noite) o dia: carga prevista contra a meta, pauta, intenção, pendências para amanhã e destaques.
_Avoid_: Daily, standup, review

**Carga do dia**:
Tempo já registrado hoje somado ao que falta das estimativas das tarefas abertas da pauta (prazo hoje ou atrasadas).
_Avoid_: Capacidade, workload (na UI)

**Modo foco**:
Contagem regressiva (25 ou 50 min) sobre uma Sessão de trabalho, seguida de pausa curta.
_Avoid_: Pomodoro como nome canônico na UI

**Sessão de trabalho**:
Intervalo de tempo trabalhado em uma Tarefa, com início, fim opcional (aberta enquanto o timer roda) e duração. Há no máximo uma sessão aberta por vez.
_Avoid_: Timer (controle de UI, não o registro), cronômetro, apontamento (como nome canônico), time entry (na UI)
