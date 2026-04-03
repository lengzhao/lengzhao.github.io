---
layout: post
tags: AI ClaudeCode Prompt Agent
subtitle: Claude Code 系列｜普通子 Agent 的 prompt 结构
mermaid: false
---

# 普通子 Agent

这个主题对应 `runAgent()` 启动的普通子 Agent。

它和主线程最大的区别是：

- 有自己的角色 prompt
- 会做上下文裁剪
- 默认更强调隔离和受控工具面

---

## 1. 结构模板

### 1.1 `system`

```text
system = [
  {% raw %}{{AGENT_DEFINITION_SYSTEM_PROMPT_OR_DEFAULT_AGENT_PROMPT}}{% endraw %},
  {% raw %}{{SUBAGENT_NOTES_BLOCK}}{% endraw %},
  {% raw %}{{ENVIRONMENT_DETAILS_BLOCK}}{% endraw %},
  {% raw %}{{APPENDED_SUBAGENT_SYSTEM_CONTEXT}}{% endraw %}
]
```

### 1.2 `messages`

```text
messages = [
  {% raw %}{{PREPENDED_SUBAGENT_USER_CONTEXT_META_MESSAGE}}{% endraw %},
  {% raw %}{{FORKED_PARENT_CONTEXT_MESSAGES?}}{% endraw %},
  {% raw %}{{SUBAGENT_PROMPT_MESSAGES}}{% endraw %},
  {% raw %}{{HOOK_ADDITIONAL_CONTEXT_ATTACHMENT?}}{% endraw %},
  {% raw %}{{PRELOADED_SKILL_MESSAGES?}}{% endraw %}
]
```

### 1.3 典型裁剪

```text
resolvedUserContext =
  {% raw %}{{BASE_USER_CONTEXT}}{% endraw %}
  - {% raw %}{{CLAUDE_MD?}}{% endraw %}

resolvedSystemContext =
  {% raw %}{{BASE_SYSTEM_CONTEXT}}{% endraw %}
  - {% raw %}{{GIT_STATUS?}}{% endraw %}
```

`Explore`、`Plan` 这类只读型 Agent 往往会裁掉：

- `claudeMd`
- `gitStatus`

---

## 2. 半实化示例

### 2.1 `system`

```text
You are an agent for Claude Code.
Given the caller's task, use the tools available to complete it fully.

Notes:
- Agent threads always have their cwd reset between bash calls.
- Use absolute file paths.
- Do not use a colon before tool calls.

# Environment
Working directory: {% raw %}{{SUBAGENT_CWD}}{% endraw %}
Is directory a git repo: true
Platform: darwin
Shell: zsh
```

如果这是一个更强角色化的 Agent，前面可能会变成：

```text
You are the Explore agent.
Your job is to quickly inspect the repository, find relevant files, and return a concise explanation to the caller.
```

### 2.2 被裁剪后的上下文

```text
userContext:
  currentDate: 2026-04-02
  {% raw %}{{claudeMd 被省略}}{% endraw %}

systemContext:
  {% raw %}{{gitStatus 被省略}}{% endraw %}
```

### 2.3 `messages`

```text
<system-reminder>
# currentDate
Today's date is 2026-04-02.
</system-reminder>

请在这个仓库里定位主流程入口，说明 QueryEngine、query、context 之间的关系，只返回结构化结论。
```

---

## 3. 关键观察

### 3.1 它不是主线程完整复制

普通子 Agent 拿到的是：

- 更短的角色 prompt
- 更聚焦的任务消息
- 被裁剪过的上下文

### 3.2 工具面会按 AgentDefinition 裁剪

它不是“主线程有什么工具我就全继承”，而是一个角色定义下的受控能力面。

### 3.3 父上下文是选择性继承

只有对子任务有帮助的父消息、上下文和工具结果才会被带进去。

---

## 4. 一页总结

普通子 Agent 的 prompt 可以理解成：

**一个更短、更角色化、更隔离的主线程派生视图。**

---

## 5. 对照源码

- `src/tools/AgentTool/runAgent.ts`
- `src/constants/prompts.ts`
- `src/utils/api.ts`
