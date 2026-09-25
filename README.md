# IPTVReader

Cliente IPTV para **Android TV** (também corre em Android/iOS) construído com Expo SDK 57 e `react-native-tvos`.

Liga-se a um servidor **Xtream Codes**, sincroniza o catálogo (TV, Filmes e Séries) para uma base de dados **SQLite local** e reproduz os streams num **player interno** (`react-native-video` / ExoPlayer) ou, opcionalmente, no **VLC**. Depois de sincronizado, a navegação é 100% offline — todas as listagens, pesquisas e paginações são queries à BD local, nunca à API.

---

## Índice

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Arranque](#arranque)
- [Como funciona](#como-funciona)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Base de dados](#base-de-dados)
- [Ecrãs e navegação](#ecrãs-e-navegação)
- [Estado global](#estado-global)
- [Suporte a TV](#suporte-a-tv)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Stack

| Área          | Tecnologia                                                       |
| ------------- | ---------------------------------------------------------------- |
| Runtime       | Expo SDK 57, React 19.2, `react-native-tvos` 0.86                |
| Navegação     | `expo-router` (rotas tipadas)                                    |
| Base de dados | `expo-sqlite` + `drizzle-orm` / `drizzle-kit`                    |
| Estado        | `zustand`                                                        |
| Listas        | `@shopify/flash-list`                                            |
| Imagens       | `expo-image` (cache em disco)                                    |
| TV            | `@react-native-tvos/config-tv`, `TVFocusGuideView`               |
| Player        | `react-native-video` (interno) ou VLC via `expo-intent-launcher` |
| Linguagem     | TypeScript (`strict`)                                            |
| Testes        | Jest (`jest-expo`) + `@testing-library/react-native`             |

O **React Compiler** está ativo (`experiments.reactCompiler`) e as **rotas tipadas** também (`experiments.typedRoutes`).
O **React Compiler** está ativo (`experiments.reactCompiler`) e as **rotas tipadas** também (`experiments.typedRoutes`).

---

## Requisitos

- Node.js 20+
- Android Studio / Android SDK (para `expo run:android`)
- Xcode (apenas se quiseres correr em iOS)
- **VLC instalado no dispositivo Android** — só é necessário se ativares o _External Player_ nas Settings. O package `org.videolan.vlc` está declarado nas `queries` do [app.json](app.json)

---

## Arranque

```bash
npm install                 # legacy-peer-deps já está no .npmrc
npm run android             # build nativo + instalação (Android / Android TV)
npm run ios                 # iOS
npm start                   # Metro apenas
npm install                 # legacy-peer-deps já está no .npmrc
npm run android             # build nativo + instalação (Android / Android TV)
npm run ios                 # iOS
npm start                   # Metro apenas
```

> O projeto usa módulos nativos e a configuração TV, por isso **não corre no Expo Go** — é preciso um development build (`expo run:*`).
> O projeto usa módulos nativos e a configuração TV, por isso **não corre no Expo Go** — é preciso um development build (`expo run:*`).

### Pré-preencher credenciais (opcional)

O ecrã de _Settings_ usa variáveis de ambiente como valores por defeito. Cria um `.env` na raiz:
O ecrã de _Settings_ usa variáveis de ambiente como valores por defeito. Cria um `.env` na raiz:

```bash
EXPO_PUBLIC_XTREAM_URL=https://o-teu-servidor.tld
EXPO_PUBLIC_XTREAM_USERNAME=utilizador
EXPO_PUBLIC_XTREAM_PASSWORD=password
```

Estas variáveis são **embutidas no bundle** (prefixo `EXPO_PUBLIC_`) — usa-as só em desenvolvimento.
Estas variáveis são **embutidas no bundle** (prefixo `EXPO_PUBLIC_`) — usa-as só em desenvolvimento.

---

## Como funciona

```
Xtream Codes API                     SQLite local                      UI
────────────────                     ────────────                      ──
player_api.php  ──[Sync]──▶  categories / tv / movies / series  ──▶  listagens
                                     serie_episode                    paginadas
                                                                        │
                                                            item ──▶ URL de stream
                                                                        │
                                                         externalPlayer?├── não ──▶ /player (react-native-video)
                                                                        │
                                                                        └── sim ──▶ Intent VIEW ──▶ VLC
```

1. **Credenciais** — em [settings.tsx](src/app/settings.tsx) gravas servidor/utilizador/password e a preferência _External Player_ na tabela `account`. Gravar **apaga todo o catálogo existente** e volta a puxar apenas a lista de categorias dos três tipos.
2. **Escolher categorias** — no ecrã [(sync)](<src/app/(sync)/index.tsx>) as categorias começam todas escondidas (`hidden = true`). Um toque numa categoria escondida torna-a visível **e** sincroniza o seu conteúdo; um toque numa já visível re-sincroniza; um _long press_ alterna a visibilidade. O switch **Only Sync** filtra a lista para mostrar só as categorias visíveis (já sincronizadas).
3. **Fila de sincronização** — cada tarefa entra em [syncQueue.ts](src/store/syncQueue.ts), que corre no máximo **2 em paralelo** e ignora chaves duplicadas. Os inserts vão em lotes de 400 linhas dentro de uma transação.
4. **Navegar** — o ecrã [(browse)](<src/app/(browse)/index.tsx>) lê só o que está em BD: `innerJoin` com `categories` filtrando `hidden = false`, páginas de 60 itens, pesquisa com `LIKE` e _debounce_ de 350 ms.
5. **Reproduzir** — o `XtreamClient` constrói a URL (`live/`, `movie/` ou `series/`). O destino depende de `account.externalPlayer` (lido por [useExternalPlayer](src/hook/useExternalPlayer.ts)):
   - **Player interno** (por defeito) — navega para [/player/[type]/[id]](src/app/player/[type]/[id].tsx), que resolve o item na BD com [useMedia](src/hook/useMedia.ts) e reproduz com `react-native-video` (ExoPlayer com HLS ativo, `User-Agent` de VLC, barra de seek escondida). O botão _Back_ fecha o player.
   - **VLC** — [vlc.ts](src/utils/vlc.ts) lança um Intent `VIEW` para `org.videolan.vlc`, com fallback para o chooser do sistema. Um _lock_ por promise evita lançamentos duplicados.

   Nos episódios de séries, abrir um episódio marca-o como `watched` em qualquer dos modos.

6. **Invalidação** — em vez de observar a BD, as sincronizações incrementam contadores em [sync.ts](src/store/sync.ts) (`categoryVersions` / `contentVersions`); os hooks têm essa versão nas dependências e recarregam.

### Camada Xtream

[xtream.ts](src/lib/xtream.ts) expõe uma factory `createXtreamClient({ baseUrl, username, password })` com os endpoints (`get_live_categories`, `get_vod_streams`, `get_series_info`, …) e os construtores de URL de playback. [config.ts](src/lib/config.ts) é o ponto onde os três tipos de media convergem: para cada `live | movie | series` declara a tabela, o fetch de categorias/streams, as colunas do `select` e o `map` da resposta da API para a linha da BD. Adicionar comportamento por tipo é mexer aqui, não nos ecrãs.

---

## Estrutura do projeto

```
db/                      schema Drizzle + abertura da BD (xtream.db)
drizzle/                 migrações SQL geradas + journal
src/
  app/                   rotas expo-router
    index.tsx            redirect: catálogo se há conta, senão settings
    settings.tsx         credenciais Xtream
    (browse)/            catálogo (TV / Filmes / Séries) com pesquisa
    (sync)/              seleção e sincronização de categorias
    serie/[id].tsx       episódios de uma série
    player/[type]/[id]   player interno (react-native-video)
  components/            UI (MediaGrid/List/Card, Select, SyncButton, ToastHost, …)
  hook/                  useCategories, useContent, useCategorySync, useMedia, useExternalPlayer, usePlayInVlc, …
  lib/                   cliente Xtream + CONFIG por tipo de media
  store/                 zustand: account, sync, syncQueue, focus, toast
  types/                 tipos da API Xtream e dos tipos de media
  utils/                 logger, integração VLC
```

Alias de import: `@/*` → `src/*` e `@/assets/*` → `assets/*` (definidos em [tsconfig.json](tsconfig.json) e replicados no [jest.config.js](jest.config.js)).

---

## Base de dados

`xtream.db`, aberta em [db/index.ts](db/index.ts) com `PRAGMA foreign_keys = ON`. As migrações correm no arranque através de `useMigrations` em [\_layout.tsx](src/app/_layout.tsx) — o splash só desaparece quando terminam.

| Tabela          | Conteúdo                                                           |
| --------------- | ------------------------------------------------------------------ |
| `account`       | uma linha: url, username, password, status, `externalPlayer`       |
| `categories`    | categorias dos 3 tipos; `unique(category_id, type)`; flag `hidden` |
| `tv`            | canais live (`tv_id` único)                                        |
| `movies`        | filmes (`movie_id` único) + `container_extension`                  |
| `series`        | séries (`serie_id` único)                                          |
| `serie_episode` | episódios por série, com temporada, número e flag `watched`        |

Convenção: `id` é a PK interna autoincrementada, os campos `*Id` são os ids externos da API Xtream.

### Alterar o schema

```bash
npx drizzle-kit generate    # gera o SQL em drizzle/ a partir de db/schema.ts
```

O SQL é importado no bundle via `babel-plugin-inline-import` e `sourceExts` do Metro — ver [babel.config.js](babel.config.js) e [metro.config.js](metro.config.js). Depois de gerar, basta reiniciar a app: as novas migrações aplicam-se no arranque.

---

## Ecrãs e navegação

| Rota                  | Ecrã                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `/`                   | Espera a hidratação da conta e redireciona para `/(browse)` ou `/settings`                     |
| `/settings`           | Credenciais Xtream + toggle _External Player_; gravar limpa o catálogo e re-importa categorias |
| `/(browse)`           | Tabs TV / Filmes / Séries, seletor de categoria, pesquisa, grid ou lista                       |
| `/(sync)`             | Tabs por tipo, filtro _Only Sync_, botão de sync global e sync/visibilidade por categoria      |
| `/serie/[id]`         | Poster, sync de episódios e lista com marcação de vistos                                       |
| `/player/[type]/[id]` | Player interno em ecrã inteiro (fundo preto, status bar escondida)                             |

Filmes e séries usam **grid** com poster (`MEDIA[...].hasImage`); TV usa **lista** de texto. Ao abrir uma série, o botão _Sync_ puxa `get_series_info` e reescreve os episódios dessa série.

---

## Estado global

| Store                                  | Responsabilidade                                                         |
| -------------------------------------- | ------------------------------------------------------------------------ |
| [account.ts](src/store/account.ts)     | Conta hidratada da BD + instância do `XtreamClient`                      |
| [sync.ts](src/store/sync.ts)           | Contadores de versão por tipo, usados para invalidar os hooks de leitura |
| [syncQueue.ts](src/store/syncQueue.ts) | Fila com concorrência 2                                                  |
| [focus.ts](src/store/focus.ts)         | Handle e estado de foco da barra de tabs (navegação D-pad)               |
| [toast.ts](src/store/toast.ts)         | Toast único, renderizado pelo `ToastHost` no layout raiz                 |

---

## Suporte a TV

- `@react-native-tvos/config-tv` com `isTV: true`, banner e ícone de TV
- `TVFocusGuideView` com `autoFocus` e `trapFocus*` nos containers principais (só quando `Platform.isTV`)
- `nextFocusUp` aponta as primeiras linhas/cards de volta à barra de tabs, cujo handle é guardado no `focus` store
- [useBackToTabs](src/hook/useBackToTabs.ts) intercepta o botão _Back_: só deixa sair do ecrã quando o foco já está nas tabs
- Transições de ecrã desativadas em TV (`animation: "none"`)

---

## Testes

```bash
npm test           # suite completa
npm run test:watch
```

22 ficheiros de teste cobrem componentes, hooks, stores e o cliente Xtream, colocados ao lado do código (`*.test.ts` / `*.test.tsx`).

---

## Limitações conhecidas

- **VLC só em Android** — o modo _External Player_ depende do Intent do VLC; em iOS/web o `playInVlc` é um no-op (usa o player interno)
- Erros do player interno são apenas registados na consola, sem feedback visual
- Gravar credenciais em _Settings_ **apaga todo o catálogo** já sincronizado
- `usesCleartextTraffic` está ativo no Android para permitir servidores em HTTP
- As credenciais ficam em claro na BD local e nas URLs de stream (é o desenho do protocolo Xtream)
- Sem EPG, sem gravações, sem continuação de posição — `watched` é apenas um booleano por episódio

---
