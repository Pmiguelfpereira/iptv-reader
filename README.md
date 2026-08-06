# IPTVReader

Cliente IPTV para **Android TV** (e Android/iOS) construído com Expo SDK 57 e `react-native-tvos`.
Liga-se a um servidor **Xtream Codes**, sincroniza o catálogo para uma base de dados **SQLite local** e delega a reprodução ao **VLC**.

---

## Stack

| Área          | Tecnologia                                         |
| ------------- | -------------------------------------------------- |
| Runtime       | Expo SDK 57, React 19.2, `react-native-tvos`       |
| Navegação     | `expo-router` (rotas tipadas)                      |
| Base de dados | `expo-sqlite` + `drizzle-orm` / `drizzle-kit`      |
| Estado        | `zustand`                                          |
| TV            | `@react-native-tvos/config-tv`, `TVFocusGuideView` |
| Player        | VLC via `expo-intent-launcher`                     |
| Linguagem     | TypeScript (`strict`)                              |

O React Compiler está ativo (`experiments.reactCompiler`).

---

## Requisitos

- Node.js 20+
- Android Studio / SDK (para `expo run:android`)
- Xcode (apenas para iOS)
- **VLC instalado** no dispositivo Android — sem ele não há reprodução (`org.videolan.vlc` está declarado nas `queries` do `app.json`)

---

## Arranque

```bash
npm install --legacy-peer-deps
npm run android      # build nativo + instalação (Android / Android TV)
npm run ios          # iOS
npm start            # Metro apenas
```

> O projeto usa módulos nativos e uma configuração TV, por isso **não corre no Expo Go** — é preciso um development build (`expo run:*`).

### Pré-preencher credenciais (opcional)

O ecrã de _Settings_ aceita valores por defeito de variáveis de ambiente. Cria um `.env`:

```bash
EXPO_PUBLIC_XTREAM_URL=https://o-teu-servidor.tld
EXPO_PUBLIC_XTREAM_USERNAME=utilizador
EXPO_PUBLIC_XTREAM_PASSWORD=password
```

Estas variáveis são embutidas no bundle (prefixo `EXPO_PUBLIC_`) — usa-as só em desenvolvimento.

---

## Notas

- **Reprodução só em Android**: VLC
- Gravar novas credenciais em _Settings_ **apaga todo o catálogo** já sincronizado.
