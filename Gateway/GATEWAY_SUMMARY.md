# Gateway — summary для UI

## Что сделано

### AuthService: переход на X-User-Id
- Убраны самостоятельные проверки access token (JwtStrategy, AuthGuard) для защищённых ручек.
- Эндпоинты `GET /auth/me`, `PUT /auth/update`, `POST /auth/logoutAll` теперь принимают заголовок **X-User-Id** (как остальные сервисы). Выдачу JWT (login/register/refresh) AuthService по-прежнему делает сам; проверка токена перенесена в Gateway.

### Gateway
- Единая точка входа под префиксом **`/api`**.
- Для маршрутов, требующих авторизации, Gateway проверяет **Bearer JWT**, извлекает `sub` (userId) и подставляет заголовок **X-User-Id** во все запросы к бэкенд-сервисам.
- Проксирование по первому сегменту пути:
  - ` /api/auth/*` → AuthService  
  - ` /api/feed/*` → FeedService  
  - ` /api/profiles/*` → ProfileService  
  - ` /api/posts/*`, ` /api/comments/*` → ContentService  
  - ` /api/communities/*`, ` /api/friends/*` → SocialService  
  - ` /api/media/*` → MediaService  
- BFF-трансформация: для `POST /api/auth/login` и `POST /api/auth/register` в ответ добавляется поле **`token`** (копия `accessToken`) под ожидания UI (LoginResponse.token).
- **BFF: подмешивание `login` в ответы Profile** — после успешного ответа ProfileService (GET/PATCH `profiles/me`, GET `profiles/search`, POST `profiles/batch`, GET `profiles/:id`) Gateway собирает `id` профилей, вызывает **AuthService** `POST /auth/users/public-batch` с заголовком **`X-Gateway-Secret`** (общий секрет `GATEWAY_SECRET` в Gateway и Auth) и добавляет в каждый объект профиля поле **`login`**. Так UI получает ник без дублирования логина в таблице профилей.
- Cookie при refresh/logout пробрасываются на AuthService (заголовок `cookie` и ответный `set-cookie`).

### Покрытые потребности UI (через прокси)
- **Auth**: login, register, refresh, logout, getMe (session), update credentials, logoutAll.
- **Auth**: delete account через `DELETE /api/auth/me` (JWT в `Authorization`, cleanup во всех сервисах).
- **Feed**: GET feed/me, GET feed/community/:communityId (оба с X-User-Id).
- **Profile**: GET/PATCH profiles/me, GET profiles/:id, GET profiles/search, POST profiles/batch.
- **Content**: CRUD постов, like/unlike, комментарии (POST/DELETE).
- **Social**: friends (me, requests, accept/decline/cancel, remove), communities (CRUD, join/leave, details).
- **Media**: upload, get by id, get URL, delete (с X-User-Id где нужно).

---

## Дыры / не реализовано
1. **Multipart upload (медиа)**  
   - Загрузка файлов через `POST /api/media/upload` (multipart/form-data) проксируется «как есть» (тело и заголовки).  
   - Если в будущем понадобится стриминг тела запроса без буферизации или особая обработка multipart, Gateway нужно будет доработать. Сейчас для типичного размера файла текущая схема должна работать.

2. **Форматы ответов и агрегация**  
   - Для **профилей** Gateway уже обогащает ответ полем **`login`** (см. выше).  
   - Для **ленты** отдельной склейки «пост + профиль автора» в одном JSON нет: лента — **GET /api/feed/me** (FeedService); UI маппит `FeedItemResponseDto[]`.  
   - Посты комьюнити — **GET /api/feed/community/:communityId**.

3. **Список всех комьюнити без поиска**  
   - UI: `CommunityService.getAll()`.  
   - В SocialService есть только `GET /communities/search?q=...` (при пустом `q` отдаётся список с лимитом).  
   - Сейчас запрос «все комьюнити» можно направлять на `GET /api/communities/search` без параметра `q` (или с пустым). Если позже появится отдельный `GET /communities`, его достаточно будет добавить в прокси без изменений Gateway-логики.

---

## Запуск и конфигурация

- **Порт**: `GATEWAY_PORT` (по умолчанию 4000).
- **Секрет JWT**: `ACCESS_TOKEN_SECRET` — тот же, что в AuthService (для верификации токена).
- **BFF / Auth batch**: `GATEWAY_SECRET` — тот же в **Gateway** и **AuthService**; без него обогащение профилей `login` отключено (ответ Profile без изменений).
- **URL сервисов** (по умолчанию localhost с разными портами):
  - `AUTH_SERVICE_URL`
  - `PROFILE_SERVICE_URL`
  - `CONTENT_SERVICE_URL`
  - `SOCIAL_SERVICE_URL`
  - `MEDIA_SERVICE_URL`
  - `FEED_SERVICE_URL`
- **CORS**: `CORS_ORIGIN` — список разрешённых origin через запятую (по умолчанию localhost:5173, localhost:3000).

Фронт должен ходить на базовый URL Gateway (например `http://localhost:4000`) с префиксом **`/api`** (например `POST /api/auth/login`, `GET /api/feed/me`) и передавать Bearer token в заголовке `Authorization` для защищённых запросов.
