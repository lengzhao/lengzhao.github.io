---
layout: post
tags: AI ClaudeCode Prompt Memory
subtitle: Claude Code 系列｜memory 相关块如何进入上下文
mermaid: false
---

# memory 相关块

这个主题不描述完整请求，而是把 memory 相关块单独抽出来看，帮助区分：

- 哪些内容进入 `system`
- 哪些内容进入 `messages`
- 哪些内容作为运行时 recall attachment 注入

---

## 1. 结构模板

### 1.1 memory policy 块

这类块通常进入 `system`：

```text
# {% raw %}{{MEMORY_DISPLAY_NAME}}{% endraw %}

You have a persistent, file-based memory system at `{% raw %}{{MEMORY_DIR}}{% endraw %}`.
{% raw %}{{DIR_EXISTS_GUIDANCE}}{% endraw %}

{% raw %}{{HOW_TO_SAVE_MEMORIES_SECTION}}{% endraw %}
{% raw %}{{WHAT_NOT_TO_SAVE_SECTION}}{% endraw %}

## MEMORY.md
{% raw %}{{MEMORY_INDEX_CONTENT_OR_EMPTY_MESSAGE}}{% endraw %}
```

### 1.2 agent memory 块

```text
# Persistent Agent Memory

{% raw %}{{BASE_MEMORY_POLICY}}{% endraw %}
{% raw %}{{SCOPE_NOTE}}{% endraw %}

## MEMORY.md
{% raw %}{{AGENT_MEMORY_INDEX}}{% endraw %}
```

### 1.3 `messages` 开头的 context 块

```text
<system-reminder>
# claudeMd
{% raw %}{{DISCOVERED_CLAUDE_MD_AND_RULE_FILES}}{% endraw %}

# currentDate
{% raw %}{{CURRENT_DATE}}{% endraw %}
</system-reminder>
```

### 1.4 relevant memories attachment

```text
Attachment: relevant_memories
|
|-- {% raw %}{{MEMORY_HEADER_1}}{% endraw %}
|   {% raw %}{{MEMORY_CONTENT_1}}{% endraw %}
|-- {% raw %}{{MEMORY_HEADER_2}}{% endraw %}
|   {% raw %}{{MEMORY_CONTENT_2}}{% endraw %}
`-- ...
```

---

## 2. 半实化示例

### 2.1 `system` 里的 memory policy

```text
# auto memory

You have a persistent, file-based memory system at `{% raw %}{{AUTO_MEMORY_DIR}}{% endraw %}`.
This directory already exists — write to it directly with the Write tool.

If the user explicitly asks you to remember something, save it immediately.
If they ask you to forget something, find and remove the relevant entry.

## MEMORY.md
- [User Preferences](user_preferences.md) — coding style and collaboration habits
- [Project Context](project_context.md) — non-code background and decisions
```

### 2.2 `messages` 开头的项目规则

```text
<system-reminder>
# claudeMd
Always respond in 中文.
如果输出文档，有流程图，使用 mermaid 格式。

go项目不需要internal文件夹
golang日志使用slog
python用uv管理

# currentDate
Today's date is 2026-04-02.
</system-reminder>
```

### 2.3 relevant memories attachment

```text
Attachment: relevant_memories

Memory: user_preferences.md
- 用户更喜欢先给结论，再给细节
- 生成文档时偏好中文

Memory: project_context.md
- 该项目是对 Claude Code TypeScript 快照的研究仓库
- 目标是理解 harness 架构、工具编排和 agent 工作流
```

### 2.4 Agent memory 示例

```text
# Persistent Agent Memory

You have a persistent, file-based memory system at `{% raw %}{{AGENT_MEMORY_DIR}}{% endraw %}`.
- Since this memory is project-scope, tailor your memories to this project.

## MEMORY.md
- [Review Heuristics](review_heuristics.md) — how this reviewer agent prioritizes findings
- [Common Risks](common_risks.md) — recurring regression patterns in this repository
```

---

## 3. 一眼区分三类内容

### 3.1 policy

```text
告诉模型：memory 怎么用
```

### 3.2 context

```text
告诉模型：当前用户/项目有哪些长期规则
```

### 3.3 recall

```text
告诉模型：基于当前问题，补充哪些相关记忆
```

这三类内容都和“记忆”有关，但进入最终请求的位置并不相同。

---

## 4. 位置速查

| 记忆相关内容 | 最终位置 |
|------|------|
| memory policy / how to save | `system` |
| agent memory policy | `system` |
| team memory policy | `system` |
| `MEMORY.md` 索引内容 | 通常在 `system` memory block 内 |
| CLAUDE.md / rules 文件内容 | `messages` 开头的 meta user message |
| relevant memories | `messages` 中的 attachment |

---

## 5. 一页总结

memory 相关 prompt 不应被混成一类，它至少分成三层：

- policy
- context
- recall

只有把这三层分开看，才能真正理解 Claude Code 的 memory 是怎么进模型的。

---

## 6. 对照源码

- `src/memdir/memdir.ts`
- `src/context.ts`
- `src/utils/attachments.ts`
- `src/tools/AgentTool/agentMemory.ts`
