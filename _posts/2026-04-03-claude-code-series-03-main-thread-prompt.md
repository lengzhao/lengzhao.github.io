---
layout: post
tags: AI ClaudeCode Prompt
subtitle: Claude Code 系列｜主线程 prompt 如何拼装
mermaid: false
---

# 主线程

这个主题对应主线程最常见的 prompt 结构，也就是 `QueryEngine` 进入 `query()` 前后的主请求形态。

---

## 1. 结构模板

### 1.1 `system`

```text
system = [
  {% raw %}{{INTRO_SECTION}}{% endraw %},
  {% raw %}{{SYSTEM_SECTION}}{% endraw %},
  {% raw %}{{DOING_TASKS_SECTION}}{% endraw %},
  {% raw %}{{ACTIONS_SECTION}}{% endraw %},
  {% raw %}{{USING_TOOLS_SECTION}}{% endraw %},
  {% raw %}{{TONE_AND_STYLE_SECTION}}{% endraw %},
  {% raw %}{{OUTPUT_EFFICIENCY_SECTION}}{% endraw %},
  {% raw %}{{SESSION_GUIDANCE_SECTION}}{% endraw %},
  {% raw %}{{MEMORY_PROMPT_BLOCK}}{% endraw %},
  {% raw %}{{ENVIRONMENT_SECTION}}{% endraw %},
  {% raw %}{{LANGUAGE_SECTION}}{% endraw %},
  {% raw %}{{OUTPUT_STYLE_SECTION}}{% endraw %},
  {% raw %}{{OPTIONAL_MCP_SECTION}}{% endraw %},
  {% raw %}{{OPTIONAL_SCRATCHPAD_SECTION}}{% endraw %},
  {% raw %}{{APPENDED_SYSTEM_CONTEXT}}{% endraw %}
]
```

### 1.2 `messages`

```text
messages = [
  {% raw %}{{PREPENDED_USER_CONTEXT_META_MESSAGE}}{% endraw %},
  {% raw %}{{OLDER_MESSAGES_AFTER_COMPACT_BOUNDARY}}{% endraw %},
  {% raw %}{{ATTACHMENT_MESSAGES}}{% endraw %},
  {% raw %}{{CURRENT_USER_MESSAGE}}{% endraw %},
  {% raw %}{{ASSISTANT_MESSAGES_FROM_PREVIOUS_ITERATIONS?}}{% endraw %},
  {% raw %}{{TOOL_RESULT_MESSAGES?}}{% endraw %}
]
```

其中最关键的 meta user message 大致是：

```text
<system-reminder>
# claudeMd
{% raw %}{{CLAUDE_MD_AND_RULE_FILES}}{% endraw %}

# currentDate
{% raw %}{{CURRENT_DATE}}{% endraw %}
</system-reminder>
```

---

## 2. 半实化示例

### 2.1 `system`

```text
# Intro
You are Claude Code, Anthropic's official CLI for Claude.

# System
You are an interactive coding assistant running inside the user's project.

# Doing Tasks
- Keep working until the user's request is actually complete.
- Prefer tool use over guessing.

# Actions
- Read files before editing when needed.
- Verify your changes when practical.

# auto memory
You have a persistent, file-based memory system at `{% raw %}{{AUTO_MEMORY_DIR}}{% endraw %}`.

# Environment
- Primary working directory: {% raw %}{{CWD}}{% endraw %}
- Platform: darwin
- Shell: zsh

gitStatus: {% raw %}{{SHORT_GIT_STATUS}}{% endraw %}
```

### 2.2 `messages`

```text
<system-reminder>
# claudeMd
- Go 项目不需要 internal 文件夹
- golang 日志使用 slog
- python 用 uv 管理

# currentDate
Today's date is 2026-04-02.
</system-reminder>

请帮我分析这个仓库的主流程，并整理成文档。
```

### 2.3 后续轮次观感

```text
assistant:
  我先查看项目结构与核心入口。

assistant:
  <tool_use name="Glob" input="{...}" />

user:
  <tool_result tool_use_id="toolu_123">...</tool_result>

assistant:
  我已经定位到 QueryEngine、query、context 等关键入口。
```

---

## 3. 关键观察

### 3.1 `userContext` 不在 `system`

- `userContext` 通过 `prependUserContext()` 进入 `messages`
- `systemContext` 通过 `appendSystemContext()` 进入 `system`

### 3.2 memory policy 和 CLAUDE.md 不是一层

- memory policy：进 `system`
- 具体项目规则：进 `messages` 开头

### 3.3 relevant memory 不是常驻前缀

它多数时候作为运行时 attachment 注入，不是一开始就固定写进 `system`。

---

## 4. 一页总结

主线程 prompt 的本质是：

**长周期稳定规则放 `system`，用户/项目上下文放 `messages` 前缀，运行时证据通过 tool result 和 attachment 继续回灌。**

---

## 5. 对照源码

- `src/constants/prompts.ts`
- `src/utils/api.ts`
- `src/QueryEngine.ts`
- `src/query.ts`
