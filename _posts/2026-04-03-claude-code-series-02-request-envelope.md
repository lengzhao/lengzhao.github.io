---
layout: post
tags: AI ClaudeCode Prompt
subtitle: Claude Code 系列｜一次模型请求的完整外壳
mermaid: false
---

# 请求外壳

这个主题回答的是：**Claude Code 最终发给模型的不是一段大 prompt，而是一个结构化请求。**

---

## 1. 结构模板

```text
MODEL REQUEST
|
|-- system: string[]
|    |-- {{SYSTEM_PROMPT_PARTS}}
|    `-- {{APPENDED_SYSTEM_CONTEXT}}
|
|-- messages: Message[]
|    |-- {{PREPENDED_USER_CONTEXT_META_MESSAGE}}
|    |-- {{CONVERSATION_MESSAGES}}
|    |-- {{ATTACHMENTS}}
|    `-- {{TOOL_RESULTS}}
|
|-- tools: ToolDefinition[]
|    `-- {{TOOL_DEFINITIONS_SIDEBAND}}
|
|-- model / thinking / budget / maxTurns / querySource / ...
|
`-- streaming / cache / telemetry related fields
```

这里最容易看错的三点是：

- `system` 是数组，不是一整段单字符串
- `userContext` 不进 `system`，而是进 `messages` 开头
- 工具定义不属于自然语言 prompt，而是 API sideband

---

## 2. 完整请求示例

```text
REQUEST
|
|-- model: {{MAIN_LOOP_MODEL}}
|-- thinkingConfig: {{THINKING_CONFIG}}
|-- querySource: "sdk" | "repl_main_thread" | ...
|-- maxTurns: {{MAX_TURNS}}
|-- tools: ToolDefinition[]
|-- system: string[]
`-- messages: Message[]
```

### 2.1 `system` 示例

```text
[
  "# Intro\nYou are Claude Code, Anthropic's official CLI for Claude.",
  "# System\nYou are an interactive coding assistant running inside the user's project.",
  "# Doing Tasks\n- Keep working until the user's request is complete.",
  "# Actions\n- Read before editing when needed.",
  "# Using Your Tools\n- Use tools when direct evidence is needed.",
  "# auto memory\nYou have a persistent, file-based memory system at `{{AUTO_MEMORY_DIR}}`.",
  "# Environment\n- Primary working directory: {{CWD}}",
  "# Language\n- Default language: 中文",
  "gitStatus: {{SHORT_GIT_STATUS}}"
]
```

### 2.2 `messages` 示例

```text
[
  {
    type: "user",
    isMeta: true,
    content: "<system-reminder>\n# claudeMd\n{{RULES_AND_CONTEXT}}\n\n# currentDate\n{{CURRENT_DATE}}\n</system-reminder>"
  },
  {
    type: "user",
    content: "帮我分析这个仓库的主流程，并整理成文档。"
  }
]
```

### 2.3 `tools` 示例

```text
[
  { name: "ReadFile", input_schema: {...} },
  { name: "Glob", input_schema: {...} },
  { name: "Shell", input_schema: {...} },
  { name: "Agent", input_schema: {...} }
]
```

---

## 3. Tool 和 Attachment 的位置

很多“看起来像 prompt 的东西”其实不在 `system` 文本里。

### 3.1 tools

```text
tools = [
  {
    name: "{{TOOL_NAME}}",
    description: "{{TOOL_DESCRIPTION}}",
    input_schema: {{TOOL_INPUT_SCHEMA}}
  }
]
```

### 3.2 attachments

```text
messages = [
  {{USER_CONTEXT_META_MESSAGE}},
  Attachment({{RELEVANT_MEMORIES}}),
  Attachment({{HOOK_CONTEXT}}),
  Attachment({{TEAMMATE_MAILBOX}}),
  ...
]
```

所以真实请求通常是三层一起起作用：

1. `system`
2. `messages`
3. `tools`

---

## 4. 最终位置速查

| 内容 | 最终位置 |
|------|------|
| 主系统说明 | `system[]` |
| memory policy | `system[]` |
| gitStatus | `system[]` 末尾 |
| CLAUDE.md / rules | `messages[]` 开头 meta user message |
| currentDate | `messages[]` 开头 meta user message |
| relevant memories | `messages[]` 中的 attachment |
| tool schema | `tools[]` |
| tool result | `messages[]` 中的 `tool_result` |

---

## 5. 一页总结

如果只记一件事，可以记这个：

**Claude Code 的最终请求不是“system prompt + 用户问题”，而是 `system + messages + tools + 运行中回灌的 tool results / attachments`。**

---

## 6. 对照源码

- `src/constants/prompts.ts`
- `src/utils/api.ts`
- `src/query.ts`
