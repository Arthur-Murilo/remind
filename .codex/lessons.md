# Lições do Projeto

## Aprendizados Confirmados

- O projeto precisa manter um protocolo explícito de trabalho para agentes, com atualização prévia de tarefas antes de mudanças relevantes.
- O ambiente local usa PowerShell; quando `npm` falhar por policy, deve-se usar `npm.cmd`.

## Erros Evitáveis

- Não misturar escopo de lembretes in-app com integrações externas nesta v1.
- Não transformar a interface em uma superfície de marketing; ela deve continuar densa, clara e operacional.
- Não deixar o diagrama de arquitetura divergir da implementação real.
- Não mascarar falha de schema/seed no entrypoint Docker com `|| echo`; o container deve recusar subir se o banco não inicializar.
- Não publicar o Postgres em `0.0.0.0` no Compose de VPS; bind em `127.0.0.1` e senha definida no `.env`.
- Não redefinir a senha de um usuário seed já existente a cada restart; o `.env` vale para a criação inicial.

## Padrões Confirmados

- Documentação de operação e produto em português.
- Identificadores internos podem seguir em inglês quando isso reduzir ambiguidade técnica.
- Mudanças estruturais devem ser refletidas em `.codex/arquitetura.md` e no arquivo `.drawio`.
