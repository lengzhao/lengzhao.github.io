---
layout: post
tags: AI ClaudeCode Prompt Agent
subtitle: Claude Code 系列｜teammate 与 swarm 的协作 prompt
mermaid: false
---

# teammate / swarm

这个主题对应 teammate，尤其是 in-process teammate 的典型 prompt 结构。

它的重点不是“又一个子 Agent”，而是：

- 继承主系统 prompt
- 追加团队协作 addendum
- 接收 team lead 的包装消息和 mailbox 上下文

---

## 1. 结构模板

### 1.1 `system`

```text
system = [
  {{FULL_MAIN_THREAD_SYSTEM_PROMPT_PARTS}},
  {{TEAMMATE_SYSTEM_PROMPT_ADDENDUM}},
  {{CUSTOM_AGENT_INSTRUCTIONS?}},
  {{APPENDED_SYSTEM_PROMPT_FROM_CALLER?}}
]
```

其中 team addendum 的核心语义通常是：

```text
# Agent Teammate Communication
IMPORTANT: You are running as an agent in a team.
- Use SendMessage to contact teammates
- Plain text responses are not visible to the team
- The user interacts primarily with the team lead
- Work is coordinated through teammate messaging and task tools
```

### 1.2 `messages`

```text
messages = [
  {{PREPENDED_USER_CONTEXT_META_MESSAGE}},
  {{PREVIOUS_TEAMMATE_CONTEXT_MESSAGES?}},
  {{TEAM_LEAD_WRAPPED_PROMPT}},
  {{TASK_ASSIGNMENT_OR_MAILBOX_ATTACHMENTS?}},
  {{SUBSEQUENT_TOOL_RESULTS_AND_ASSISTANT_MESSAGES}}
]
```

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

# Agent Teammate Communication
IMPORTANT: You are running as an agent in a team.
- Use the SendMessage tool with `to: "<name>"` to send messages to specific teammates.
- Plain text responses are not visible to other teammates.
- The user interacts primarily with the team lead.

# Custom Agent Instructions
You are the repository analyst teammate.
Focus on locating code structure and reporting findings back to the team lead.
```

### 2.2 `messages`

```text
<system-reminder>
# claudeMd
{{项目规则与用户偏好}}

# currentDate
Today's date is 2026-04-02.
</system-reminder>

<teammate_message from="team-lead" summary="分析主流程">
请分析这个仓库的主流程，重点关注 QueryEngine、query、subagent、memory，并把结论回发给我。
</teammate_message>
```

如果已经运行一段时间，还可能附带：

```text
{{之前未压缩的 teammate 历史}}
{{mailbox 中未读消息}}
{{当前领取中的 task 上下文}}
```

---

## 3. 关键观察

### 3.1 它不是从零换掉整套主 prompt

teammate 更像：

**主系统 prompt + 协作约束层**

### 3.2 明文回复不等于团队通信

它必须用 `SendMessage` 才能真正和队友通信，这不是普通子 Agent 的行为模式。

### 3.3 它天然带 leader-worker 语义

teammate 默认面向 team lead 工作，而不是直接面向用户。

---

## 4. 一页总结

teammate prompt 的核心不是“多一个角色块”，而是：

**在主线程 prompt 之上叠加团队身份、通信规则和任务协作语义。**

---

## 5. 对照源码

- `src/utils/swarm/inProcessRunner.ts`
- `src/utils/swarm/teammatePromptAddendum.ts`
- `src/utils/teammateMailbox.ts`
