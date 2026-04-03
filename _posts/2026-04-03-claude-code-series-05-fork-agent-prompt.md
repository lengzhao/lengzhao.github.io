---
layout: post
tags: AI ClaudeCode Prompt Agent
subtitle: Claude Code 系列｜fork agent 如何复用父线程前缀
mermaid: false
---

# fork Agent

这个主题对应 `runForkedAgent()`。

fork agent 的重点不是高度定制，而是：

**尽量复用父线程已经稳定下来的 prompt 前缀。**

---

## 1. 结构模板

```text
cacheSafeParams = {
  systemPrompt: {{PARENT_RENDERED_SYSTEM_PROMPT}},
  userContext: {{PARENT_USER_CONTEXT}},
  systemContext: {{PARENT_SYSTEM_CONTEXT}},
  toolUseContext: {{CLONED_PARENT_TOOL_USE_CONTEXT}},
  forkContextMessages: {{PARENT_CONTEXT_MESSAGES}}
}
```

最终请求大致是：

```text
SYSTEM
  {{PARENT_SYSTEM_PROMPT}}
  {{PARENT_SYSTEM_CONTEXT}}

TOOLS
  {{PARENT_OR_EXACT_TOOLS}}

MESSAGES
  {{PARENT_USER_CONTEXT_META_MESSAGE}}
  {{FORK_CONTEXT_MESSAGES}}
  {{FORK_PROMPT_MESSAGES}}
```

可变块通常只有：

- `{{FORK_PROMPT_MESSAGES}}`
- `{{MAX_TURNS_OVERRIDE?}}`
- `{{CALLBACKS?}}`

不应轻易变化的通常是：

- `{{SYSTEM_PROMPT_PREFIX}}`
- `{{USER_CONTEXT}}`
- `{{SYSTEM_CONTEXT}}`
- `{{TOOLS}}`

---

## 2. 半实化示例

### 2.1 `system`

```text
# Intro
You are Claude Code, Anthropic's official CLI for Claude.

# System
You are an interactive coding assistant running inside the user's project.

# auto memory
You have a persistent, file-based memory system at `{{AUTO_MEMORY_DIR}}`.

# Environment
- Primary working directory: {{CWD}}
- Platform: darwin

gitStatus: {{SHORT_GIT_STATUS}}
```

这里最重要的不是字面内容，而是：

**这份 system 通常尽量与父线程保持一致。**

### 2.2 `messages`

```text
<system-reminder>
# claudeMd
{{与主线程相同的 claudeMd 内容}}

# currentDate
Today's date is 2026-04-02.
</system-reminder>

{{父线程已有上下文消息}}

请根据当前会话内容，生成一个简短的阶段性总结，重点保留后续继续工作必须知道的信息。
```

---

## 3. 关键观察

### 3.1 它看起来很像主线程，是刻意设计

fork agent 不是要重新定义身份，而是要尽量保持前缀稳定，从而命中 prompt cache。

### 3.2 它更像“主线程 + 一个新的辅助问题”

可以把它理解成：

```text
主线程 prompt
+ 一个新的辅助问题
= fork agent prompt
```

### 3.3 适合低成本辅助推理

常见用途：

- session memory 提取
- 摘要生成
- 旁路分析
- 低成本辅助判断

---

## 4. 一页总结

fork agent 的 prompt 本质是：

**共享父线程稳定前缀，只在尾部增加一个新的辅助任务窗口。**

---

## 5. 对照源码

- `src/utils/forkedAgent.ts`
- `src/query.ts`
