# LangChain4j AI Fitness Assistant Integration

## Context

Add a personalized AI fitness assistant to MakeIt that can create workout plans and manage sessions through natural language conversation. Uses LangChain4j (Java/Kotlin) with concepts that transfer directly to Python LangChain.

**Important**: The LangChain4j Spring Boot starters are not compatible with Spring Boot 4.0.1 yet. We'll use the core libraries with manual `@Configuration` bean wiring instead. This actually teaches more transferable concepts since Python LangChain works the same way (no auto-wiring magic).

## Key LangChain4j Concepts (and Python equivalents)

| LangChain4j | Python LangChain | What it does |
|---|---|---|
| `AiServices.builder()` | `create_tool_calling_agent()` + `AgentExecutor` | Wires model + tools + memory |
| `@SystemMessage` | `SystemMessage` | Persona / instructions |
| `@MemoryId` | `session_id` in `RunnableWithMessageHistory` | Per-user conversation memory |
| `@Tool` | `@tool` decorator | Functions the LLM can call |
| `ChatMemoryStore` | `BaseChatMessageHistory` | Persistent message storage |
| `MessageWindowChatMemory` | `ConversationBufferWindowMemory` | Sliding window memory |
| `AnthropicChatModel` | `ChatAnthropic` | LLM provider |

---

## Implementation Steps

### Step 1: Add Gradle dependencies

**File**: `backend/build.gradle.kts`

Add to `dependencies` block:
```kotlin
val langchain4jVersion = "1.0.0-beta3"
implementation("dev.langchain4j:langchain4j:$langchain4jVersion")
implementation("dev.langchain4j:langchain4j-anthropic:$langchain4jVersion")
```

> We'll verify the latest stable version at implementation time.

### Step 2: Configuration

**New file**: `backend/.../config/AiProperties.kt`
- `@ConfigurationProperties(prefix = "app.ai")` following `JwtProperties` pattern
- Fields: `apiKey`, `modelName` (default `claude-sonnet-4-20250514`), `temperature` (0.7), `maxTokens` (4096), `memoryMaxMessages` (50)

**Modify**: `backend/src/main/resources/application.yml`
- Add `app.ai` section with env var `${ANTHROPIC_API_KEY:}`

### Step 3: Database migration for chat history

**New file**: `backend/.../resources/db/changelog/changes/v1.2.0-chat-messages-table.yaml`
- Table `chat_messages`: `id` (bigint PK), `memory_id` (varchar, unique index), `messages_json` (text), `updated_at` (timestamp)
- One row per user, stores serialized message list as JSON

**Modify**: `changelog-master.yaml` — add include for the new migration

### Step 4: Chat memory persistence (entity + repository + store)

**New file**: `backend/.../model/ChatMessageRecord.kt`
- JPA entity mapping to `chat_messages` table

**New file**: `backend/.../repository/ChatMessageRepository.kt`
- `findByMemoryId(memoryId)`, `deleteByMemoryId(memoryId)`

**New file**: `backend/.../service/PersistentChatMemoryStore.kt`
- Implements LangChain4j's `ChatMemoryStore` interface
- `getMessages()` → deserializes JSON from DB via `ChatMessageDeserializer`
- `updateMessages()` → serializes via `ChatMessageSerializer`, upserts to DB
- `deleteMessages()` → deletes the row

### Step 5: Session tools for the LLM

**New file**: `backend/.../service/SessionTools.kt`

Contains `UserContext` (ThreadLocal<UUID>) for passing authenticated userId into tool calls, and `SessionTools` class with `@Tool`-annotated methods:

| Tool method | Wraps | Description for LLM |
|---|---|---|
| `listAllSessions()` | `sessionService.listSessions(userId)` | Get all user's sessions |
| `getUpcomingSessions(days)` | `sessionService.getUpcomingSessions(userId, days)` | Upcoming incomplete sessions |
| `createSession(type, scheduledDate, notes?, durationMinutes?)` | `sessionService.createSession(userId, ...)` | Create a session |
| `updateSession(sessionId, type?, scheduledDate?, notes?, durationMinutes?)` | `sessionService.updateSession(userId, ...)` | Update a session |
| `deleteSession(sessionId)` | `sessionService.deleteSession(userId, ...)` | Delete a session |
| `toggleSessionCompletion(sessionId)` | `sessionService.toggleCompletion(userId, ...)` | Mark complete/incomplete |
| `getTodaysDate()` | `LocalDate.now()` | Current date for planning |

Tools return formatted strings. Errors from `SessionService` propagate back to the LLM, which handles them in its response.

### Step 6: AI service interface + bean configuration

**New file**: `backend/.../service/FitnessAssistant.kt`
- Kotlin interface with `@SystemMessage` defining the fitness coach persona
- Method: `fun chat(@MemoryId memoryId: String, @UserMessage message: String): String`

**New file**: `backend/.../config/AiConfig.kt`
- `@Configuration` class with two `@Bean` methods:
  1. `anthropicChatModel()` → builds `AnthropicChatModel` from `AiProperties`
  2. `fitnessAssistant(chatModel, chatMemoryStore, sessionTools)` → builds via `AiServices.builder(FitnessAssistant::class.java)` with `.chatModel()`, `.chatMemoryProvider()` (creates `MessageWindowChatMemory` per user), and `.tools()`

### Step 7: DTOs + REST controller

**New file**: `backend/.../dto/AssistantDtos.kt`
- `ChatRequest(message: String)` with `@NotBlank` + `@Size(max=5000)`
- `ChatResponse(reply: String)`

**New file**: `backend/.../controller/AssistantController.kt`
- `POST /api/assistant/chat` — sets `UserContext`, calls `fitnessAssistant.chat(userId, message)`, clears `UserContext` in `finally`
- `DELETE /api/assistant/chat` — clears chat history via `chatMemoryStore.deleteMessages()`
- Uses `@AuthenticationPrincipal AuthenticatedUser` — no SecurityConfig changes needed (falls under existing `/api/**` authenticated rule)

### Step 8: Frontend — API service

**New file**: `frontend/src/services/assistantApi.ts`
- Uses existing `api` axios instance (JWT interceptor already configured)
- `sendMessage(request: ChatRequest): Promise<ChatResponse>`
- `clearHistory(): Promise<void>`

### Step 9: Frontend — Chat page

**New file**: `frontend/src/pages/AssistantPage.tsx`
- Scrollable message list (user messages right-aligned, assistant left-aligned)
- Text input + send button at bottom
- Loading indicator while AI processes
- Clear history option
- TailwindCSS styling matching existing app (teal accent, gray backgrounds)
- Messages stored in local component state (backend persists conversation)

### Step 10: Frontend — Routing + navigation

**Modify**: `frontend/src/App.tsx`
- Add `<Route path="/assistant" element={<AssistantPage />} />` inside `ProtectedLayout`

**Modify**: `frontend/src/components/BottomNavigation.tsx`
- Add 5th nav item: `<NavItem to="/assistant" icon={<CoachIcon />} label="Coach" />`
- Add a chat-bubble SVG icon component

### Step 11: Docker compose update

**Modify**: `docker-compose.yml`
- Add `ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}` to backend environment

---

## New Files (12)

| File | Purpose |
|---|---|
| `backend/.../config/AiProperties.kt` | AI configuration properties |
| `backend/.../config/AiConfig.kt` | Bean wiring: ChatModel + FitnessAssistant |
| `backend/.../model/ChatMessageRecord.kt` | JPA entity for chat persistence |
| `backend/.../repository/ChatMessageRepository.kt` | Chat message JPA repository |
| `backend/.../service/PersistentChatMemoryStore.kt` | LangChain4j ChatMemoryStore impl |
| `backend/.../service/SessionTools.kt` | @Tool methods + UserContext |
| `backend/.../service/FitnessAssistant.kt` | AI service interface |
| `backend/.../dto/AssistantDtos.kt` | ChatRequest / ChatResponse |
| `backend/.../controller/AssistantController.kt` | REST endpoint |
| `backend/.../resources/db/changelog/changes/v1.2.0-chat-messages-table.yaml` | DB migration |
| `frontend/src/services/assistantApi.ts` | API client |
| `frontend/src/pages/AssistantPage.tsx` | Chat UI page |

## Modified Files (6)

| File | Change |
|---|---|
| `backend/build.gradle.kts` | Add langchain4j dependencies |
| `backend/.../resources/application.yml` | Add `app.ai` config section |
| `backend/.../resources/db/changelog/changelog-master.yaml` | Include new migration |
| `frontend/src/App.tsx` | Add `/assistant` route |
| `frontend/src/components/BottomNavigation.tsx` | Add Coach nav item |
| `docker-compose.yml` | Add `ANTHROPIC_API_KEY` env var |

## Verification

1. **Backend builds**: `./gradlew clean build` from `backend/`
2. **DB migration runs**: Start app with PostgreSQL — check `chat_messages` table exists
3. **Chat endpoint works**: `curl -X POST http://localhost:8080/api/assistant/chat -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"message": "Create a 3-day running plan for next week"}'`
4. **Tools execute**: Verify sessions are created in the database after the AI responds
5. **Memory persists**: Send a follow-up message and confirm the AI remembers context
6. **Frontend**: Navigate to Coach tab, send a message, verify response renders
7. **Clear history**: `DELETE /api/assistant/chat` clears the conversation
