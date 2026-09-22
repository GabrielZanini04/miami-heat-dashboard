@AGENTS.md

# Dashboard do Miami Heat

## Sobre o projeto
Dashboard do time de basquete Miami Heat (NBA) exibindo dados reais obtidos via API.
O repositório se chama `corinthians-dashboard` porque o projeto começou como um dashboard
do Corinthians; o foco agora é exclusivamente o Miami Heat.

## Dados
- Fase de testes: usar dados da temporada 2025-26 (`NBA_SEASON=2025`, já encerrada, dados estáveis).
- Depois: migrar para a temporada 2026-27 (`NBA_SEASON=2026`, dados ao vivo/atualizados).
- A temporada é configurável via variável de ambiente `NBA_SEASON`, lida em [lib/config.ts](lib/config.ts)
  (nunca espalhar o número da temporada pelo código).
- API utilizada: [BALLDONTLIE](https://www.balldontlie.io/) (`https://api.balldontlie.io/v1`).
  Plano gratuito tem limite de requisições — por isso as respostas são cacheadas por 30 min
  (`config.revalidateSeconds`). Consulte o painel da própria API para os limites atuais do seu plano.
- Limitação conhecida do plano grátis: `/players/active` e `/stats` retornam `Unauthorized` (exigem
  plano pago). Por isso o elenco em [lib/heat/service.ts](lib/heat/service.ts) usa `/players`, que é
  histórico (inclui aposentados) — não há como filtrar apenas o elenco atual sem upgrade de plano.
- Nunca commitar chaves de API. Usar `.env.local` (ignorado pelo `.gitignore` via `.env*`) e manter
  o [.env.example](.env.example) atualizado com os nomes das variáveis.

## Stack
- Framework: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript.
- Estilo: Tailwind CSS v4 (tema com as cores do Miami Heat em [app/globals.css](app/globals.css)).
- Banco de dados / cache: nenhum banco; cache de dados via `fetch` nativo do Next.js.

## Ordem de desenvolvimento
1. Back-end primeiro: buscar dados da API, tratar e expor endpoints próprios.
2. Front-end depois: consumir apenas os endpoints/funções do nosso back-end, nunca a API externa
   diretamente (evita expor chave e facilita trocar de API no futuro).

## Estrutura de pastas
- `app/page.tsx` — dashboard (Server Component), consome `lib/heat/service.ts` diretamente.
- `app/api/heat/summary|games|roster/route.ts` — endpoints HTTP próprios (uso externo/futuro consumo client-side).
- `lib/balldontlie/` — `client.ts` (chamadas HTTP + paginação) e `types.ts` (tipos da API externa).
- `lib/heat/` — `service.ts` (regras de negócio: resumo da temporada, jogos, elenco) e `api-response.ts` (helper das rotas).
- `lib/config.ts` — configuração central (temporada, ID do time, tempo de cache).

## Comandos úteis
- Instalar dependências: `npm install`
- Rodar em desenvolvimento: `npm run dev`
- Build de produção: `npm run build`
- Lint: `npm run lint`
- Testes: ainda não há suíte de testes configurada.

## Convenções
- Comentários e mensagens de commit em português.
- Commits pequenos e descritivos.
- Antes de mudanças grandes (trocar biblioteca, reestruturar pastas), explicar o plano
  e esperar confirmação.
- Sou estagiário e estou aprendendo: ao introduzir um conceito novo, explicar
  brevemente o porquê da escolha.
