# Sincronização entre aparelhos (E1)

> Status: **implementada e testada no ambiente local**, **desligada por padrão**.
> Nada é enviado a servidor nenhum enquanto você não conectar uma conta.

## 1. Como funciona

- O `localStorage` continua sendo a **cópia local**. Sem internet, sem conta e sem
  servidor, o app funciona exatamente como antes.
- Quando a sincronização está ligada, cada gravação (`persist()`) carimba o registro
  com `updatedAt` e marca uma pendência. Um envio em segundo plano (1,5 s após a
  alteração, ao abrir o app, ao voltar a conexão e a cada minuto se houver pendência)
  leva o documento ao servidor.
- **Nada foi reconstruído**: as 23 telas, cálculos e identificadores continuam iguais.
  A sincronização entra como uma camada sobre o `persist()` existente.

## 2. Regras de mesclagem (conflitos)

| Situação | Resultado |
|---|---|
| Registro só existe em um lado | mantido |
| Registro editado nos dois aparelhos | vence o `updatedAt` mais recente |
| Registro excluído em um aparelho | **lápide (tombstone)** com data; vence a edição mais antiga |
| Objeto simples (`notas`, `metas`, `config`, `contadores`) | vence a última alteração daquela chave |
| Disciplinas e notas por componente | mescladas **por id**, uma a uma |
| Gravação simultânea no servidor | controle de revisão (`rev`): a segunda tentativa remescla e reenvia |

Lápides são descartadas após 90 dias.

## 3. Estrutura no Supabase

Uma linha por usuário, com o documento JSON completo (o mesmo formato do backup).

```sql
create table if not exists public.planner_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  doc        jsonb not null default '{}'::jsonb,
  rev        integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.planner_state enable row level security;

create policy "ler o proprio estado"      on public.planner_state for select using (auth.uid() = user_id);
create policy "inserir o proprio estado"  on public.planner_state for insert with check (auth.uid() = user_id);
create policy "atualizar o proprio estado" on public.planner_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apagar o proprio estado"   on public.planner_state for delete using (auth.uid() = user_id);
```

O `user_id` é sempre o usuário do token: um aparelho autenticado não consegue ler
nem gravar a linha de outra conta (testado: 403).

## 4. Como ligar (5 minutos, sem cartão)

1. Crie um projeto gratuito em <https://supabase.com>.
2. Em **SQL Editor**, rode o script da seção 3.
3. Em **Project Settings › API**, copie **Project URL** e a chave **anon public**.
4. No Planner: **⚙️ Config › ☁️ Sincronização** → cole a URL, a chave, seu e-mail e
   uma senha → **Criar conta** (na primeira vez) ou **Entrar**.
5. O primeiro envio cria automaticamente um **ponto de recuperação local**
   ("antes da 1ª sincronização") antes de mandar qualquer dado.
6. No outro aparelho, repita o passo 4 com **o mesmo e-mail e senha**: ele baixa e
   mescla os dados existentes.

> **Chave secreta é bloqueada.** Se você colar a chave `service_role` (ou uma
> `sb_secret_…`) no campo da chave, o app recusa a conexão, apaga o valor e explica o
> motivo — essa chave dá acesso total ao banco e nunca deve ir para o navegador. O
> campo aceita apenas a chave pública (`anon public` / `sb_publishable_…`).

Para desligar: desmarque **Sincronização ativa** ou use **Desconectar**. Nada é
apagado do aparelho.

## 5. Custos e limites (plano gratuito do Supabase)

| Item | Gratuito | Observação |
|---|---|---|
| Banco | 500 MB | seus dados hoje: **~20 KB** (10 períodos, 63 disciplinas) |
| Usuários | 50.000/mês | uso pessoal: 1 |
| Egress | 5 GB/mês | cada sync envia ~20 KB |
| Pausa por inatividade | após 1 semana sem uso | volta a acordar no primeiro acesso |
| Backup automático | não incluído | use os pontos de recuperação + backup exportado |

Plano Pro (US$ 25/mês) só é necessário para backup automático, PITR e remover a pausa.
**Nada foi contratado**: a conta é criada por você, no seu cartão-free.

## 6. Limitações conhecidas

- `pj_notes`, `pj_goals`, `pj_scores` e `pj_config` mesclam **por sub-chave** (semana,
  disciplina ou componente): editar notas de duas semanas diferentes em aparelhos
  diferentes preserva as duas. Listas dentro de uma sub-chave (metas) mesclam por `id`,
  com lápides — exclusão de meta propaga.
- `pj_hist` (médias por período) ainda mescla pela chave inteira: editar médias de dois
  períodos ao mesmo tempo em aparelhos diferentes mantém a última alteração.
- Excluir um **período inteiro** agora gera lápides para todas as disciplinas dele
  (antes elas voltavam na próxima mesclagem).
- O servidor guarda o documento atual; **snapshots no servidor** (histórico de versões)
  ficam para a etapa de auditoria (E6).
- A senha **não é armazenada**; só o token da sessão, no próprio navegador.

## 7. Servidor de teste (não é produção)

`sync-server.mjs` emula o subconjunto do Supabase usado pelo app (Auth por e-mail/senha
e a tabela `planner_state`), com CORS e persistência em volume. Serve para validar dois
"aparelhos" sem conta externa.

```bash
docker compose -f docker-compose.base44.yml up -d        # sobe só o app (3000)
docker compose -f docker-compose.sync-dev.yml up -d      # sobe o dublê (8787), só para testar
curl -s http://localhost:8787/health                     # {"ok":true,...}
```

O `sync-dev` **não** está no compose de publicação: ele fica em
`docker-compose.sync-dev.yml` justamente para não ir junto com o app.

No app, use a URL pública da porta 8787 como "Project URL" e qualquer texto como
"anon key". O serviço pode ser removido do compose sem afetar o app.
