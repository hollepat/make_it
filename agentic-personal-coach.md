# Agentic Personal Coach

## Current State: Phase 1 Complete (Chat + Session Management)

The AI fitness coach is integrated as a chat-based assistant that can manage training sessions on behalf of the user through LangChain4j tool calling.

### What's implemented

**Backend**
- `FitnessAssistant` - LangChain4j `AiServices` interface with a system prompt defining the coach persona
- `SessionTools` - Tool methods the LLM can call: create/update/delete sessions, list sessions, get upcoming sessions, list programs, get today's date
- `PersistentChatMemoryStore` - Conversation history persisted to PostgreSQL (`chat_messages` table), keyed by user ID, with configurable memory window (default 50 messages)
- `AiConfig` - Multi-provider support: Claude (Anthropic), Gemini (Google AI), e-INFRA CZ (OpenAI-compatible). Selected via `AI_PROVIDER` env var
- `AssistantController` - REST API (`POST /api/assistant/chat`, `DELETE /api/assistant/chat`). Returns 503 when no API key is configured
- `UserContext` - ThreadLocal-based user scoping so tools operate on the authenticated user's data

**Frontend**
- `AssistantPage` - Chat UI with message bubbles, typing indicator, suggestion chips, and clear history button
- `assistantApi` - API client for chat and history clearing

**Database**
- `chat_messages` table (Liquibase v1.3.0) - stores serialized conversation JSON per user

### Architecture

```
User -> AssistantPage -> POST /api/assistant/chat
                              |
                        AssistantController
                              |
                        UserContext.set(userId)
                              |
                        FitnessAssistant.chat()  (LangChain4j AiServices proxy)
                              |
                     ChatLanguageModel (Claude / Gemini / e-INFRA)
                              |
                     LLM decides to call tools ──> SessionTools.*()
                              |                         |
                     LLM generates response      SessionService / ProgramService
                              |
                        ChatResponse { reply }
```

### Configuration

| Env Variable | Description | Default |
|---|---|---|
| `AI_PROVIDER` | `claude`, `gemini`, or `einfra` | `claude` |
| `ANTHROPIC_API_KEY` | Anthropic API key (for claude) | - |
| `GEMINI_API_KEY` | Google AI API key (for gemini) | - |
| `EINFRA_API_KEY` | e-INFRA CZ API key (for einfra) | - |
| `AI_MODEL_NAME` | Claude model name | `claude-sonnet-4-20250514` |
| `AI_GEMINI_MODEL_NAME` | Gemini model name | `gemini-2.0-flash` |
| `AI_EINFRA_MODEL_NAME` | e-INFRA model name | `deepseek-v3.2` |

### Available tools the LLM can call

| Tool | Description |
|---|---|
| `listAllSessions` | Get all training sessions for the user |
| `getUpcomingSessions` | Get upcoming incomplete sessions (configurable days) |
| `createSession` | Create a session (type, date, notes, duration, program) |
| `updateSession` | Update session fields by ID |
| `deleteSession` | Delete a session by ID |
| `toggleSessionCompletion` | Mark session complete/incomplete |
| `getTodaysDate` | Get current date for planning |
| `listPrograms` | List user's programs with session counts |

### LangChain4j concepts (Python equivalents)

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

## Next Phases

### Phase 2 - User Knowledge Base
- Create a digital twin / user profile with relevant fitness info (age, fitness level, goals, injuries, preferences)
- Agent should consider user context when giving advice and planning sessions

### Phase 3 - Training Studies Knowledge Base
- Integrate a DB of studies focused on training/sports
- RAG (Retrieval-Augmented Generation) to ground recommendations in evidence
