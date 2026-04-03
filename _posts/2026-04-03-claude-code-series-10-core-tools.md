---
layout: post
tags: AI ClaudeCode Tool Runtime
subtitle: Claude Code 系列｜核心工具如何构成执行面
mermaid: false
---

# Claude Code 核心工具详解

本文档专门讲 Claude Code 里最核心的一批工具，不是简单罗列名字，而是解释：

- 它们在系统里的定位
- 模型为什么会用它
- prompt / schema 在哪里
- 运行时有哪些关键行为
- 什么时候该用，什么时候不该用

这份文档重点覆盖：

- `AgentTool`
- `BashTool`
- `Read` / `FileReadTool`
- `Edit` / `FileEditTool`
- `GrepTool`
- `GlobTool`
- `TaskCreateTool`
- `TaskUpdateTool`

如果用一句话概括：

**这些工具共同构成了 Claude Code 的执行面，其中 `AgentTool` 负责委托，`BashTool` 负责真实命令执行，文件与搜索工具负责感知代码库，任务工具负责外显化工作状态。**

---

## 1. 先理解：工具信息并不都在 `system prompt` 里

很多人第一次看会误以为“工具说明就是 system prompt 里的自然语言段落”，但实际上 Claude Code 里工具通常有三层信息：

1. **tool schema / description**
2. **工具自己的 prompt 文本**
3. **运行时实现**

从最终请求看：

- 工具定义主要作为 `tools[]` sideband 字段给模型
- 部分额外行为约束会体现在系统提示中
- 真正的执行语义还是由运行时代码决定

所以一个工具要看三件事：

- 它怎么被介绍给模型
- 它能接收哪些参数
- 它实际会如何执行

---

## 2. `AgentTool`

### 2.1 工具定位

`AgentTool` 是 Claude Code 最关键的高阶工具之一。

它解决的不是“读一个文件”这种原子操作，而是：

**把一个复杂、多步、可独立推进的子问题交给新的执行单元。**

从系统设计上说，它负责：

- 创建普通子 Agent
- 在某些模式下 fork 自己
- 支持并行发起多个 Agent
- 支持后台运行
- 支持团队 / swarm 协作场景

所以 `AgentTool` 本质上不是普通工具，而是一个**工具中的调度器**。

### 2.2 模型侧看到的核心语义

从 `src/tools/AgentTool/prompt.ts` 来看，它强调几个核心点：

- 适合处理复杂、多步任务
- agent type 有不同能力面
- 如果是 fork 模式，可以继承当前上下文
- 如果是 fresh agent，需要在 prompt 里补足背景
- 可以并行启动多个 agent

尤其重要的是它对 prompt 的要求：

- fresh subagent：要像 briefing 一个新同事
- fork：不要重复背景，直接下达 directive

这说明它不是只暴露“启动一个 Agent”的能力，而是**顺带教模型如何正确委托**。

### 2.3 关键参数

典型关键参数包括：

- `description`
- `prompt`
- `subagent_type`
- `run_in_background`
- `name`
- `team_name`
- `mode`

其中最关键的分叉是：

- 指定 `subagent_type`：更像 fresh specialized agent
- 省略 `subagent_type`：更像 fork self

### 2.4 运行时关键行为

运行时主要由 `runAgent()` 和相关 fork 逻辑承接，核心行为包括：

- 分配 `agentId`
- 构造独立 `ToolUseContext`
- 选择工具集合
- 设置权限模式
- 构造 sidechain transcript
- 启动新的 `query()` 循环

这意味着 `AgentTool` 的 tool result 不是普通数据，而往往代表：

- 启动了一个独立执行单元
- 或收到了一个子执行单元的结果

### 2.5 什么时候应该用

适合：

- 开放式调查
- 可独立推进的实现任务
- 搜索 / 实现 / 验证分治
- 希望并行多个子任务

不适合：

- 只读一个已知文件
- 搜索 1~2 个已知文件
- 非常小的单步问题

### 2.6 为什么它重要

没有 `AgentTool`，Claude Code 依然能做很多事；但有了它之后，系统才真正从：

**单线程工具代理**

变成：

**可分治、可并行、可协作的多执行体代理**

---

## 3. `BashTool`

### 3.1 工具定位

`BashTool` 负责把模型的操作意图落到真实 Shell 命令上。

它是 Claude Code 最强、也最危险的工具之一。

它能触达：

- git
- 包管理器
- 编译 / 测试
- 构建命令
- 外部 CLI
- 任何工作区相关命令

### 3.2 模型侧看到的核心语义

`src/tools/BashTool/prompt.ts` 给了模型一整套使用策略，而不是只给一句“执行命令”：

- 可以用 `run_in_background`
- git / PR 有专门的安全规范
- sandbox 有明确策略
- 出现 sandbox 证据时如何处理
- 不要乱用危险命令

这使得 `BashTool` 的 prompt 本身就像一个**操作规程手册**。

### 3.3 关键参数

典型关键参数包括：

- `command`
- `run_in_background`
- `timeout`
- `dangerouslyDisableSandbox`

其中最关键的两个是：

- `run_in_background`
- `dangerouslyDisableSandbox`

### 3.4 `run_in_background`

这是 `BashTool` 很关键的能力。

它的含义不是简单“后台跑一下”，而是：

- 允许命令脱离当前同步等待
- 系统后续用 task / monitor / notification 机制追踪
- 模型不需要用 `&`
- 模型也不应反复轮询

这说明 Claude Code 的 Bash 不是一次性同步调用，而是支持**任务化命令执行**。

### 3.5 sandbox 语义

`BashTool` 的另一大特点是 sandbox 策略非常明确：

- 默认应在 sandbox 中执行
- 只有出现明确证据表明是 sandbox 限制导致失败，才考虑 `dangerouslyDisableSandbox`
- 某些配置下根本不允许关闭 sandbox

这代表系统把 Shell 权限控制放在了非常核心的位置。

### 3.6 什么时候应该用

适合：

- git 状态、diff、log
- 构建、测试、运行
- 依赖安装
- 工作区 CLI 操作

不适合：

- 能由专用工具完成的读文件、搜索、编辑
- 需要结构化结果的任务但已有专门工具

### 3.7 为什么它重要

`BashTool` 决定了 Claude Code 能不能真正落地到开发环境。

没有它，系统更多是“代码理解器”；有了它，系统才是“开发代理”。

---

## 4. `Read` / `FileReadTool`

### 4.1 工具定位

`Read` 是最基础的观察类工具之一，用于把文件内容带入消息流。

它不只是“cat 文件”，而是：

- 支持 offset / limit
- 支持图片
- 支持 PDF
- 支持 notebook
- 对输出格式做了统一规范

### 4.2 模型侧看到的核心语义

`src/tools/FileReadTool/prompt.ts` 强调几点：

- 必须用绝对路径
- 默认最多读一定行数
- 已知范围时应只读局部
- 读目录不要用它，要走 bash `ls`

这个工具的设计目标很清晰：

**尽量让文件读取结构化、可控、可分页。**

### 4.3 关键参数

- `file_path`
- `offset`
- `limit`
- `pages`（PDF 场景）

### 4.4 运行时特点

`Read` 和 `readFileState` 关联很强，它不仅仅是把内容吐给模型，还承担：

- 去重
- 文件状态缓存
- 变化检测
- 配合 memory surfacing 去重

所以它在运行时里是“观察”和“上下文预算控制”的关键节点。

### 4.5 为什么它重要

Claude Code 的很多其他能力都建立在它之上：

- Edit 前往往要先 Read
- memory 去重依赖 readFileState
- 子 Agent 上下文复制也会复制 readFileState

可以把它理解成：

**所有高质量代码操作的观测入口。**

---

## 5. `Edit` / `FileEditTool`

### 5.1 工具定位

`Edit` 是最核心的写操作工具之一，用于对已有文件做精确替换。

### 5.2 模型侧看到的核心语义

`src/tools/FileEditTool/prompt.ts` 最重要的规则有三条：

- 编辑前必须先 `Read`
- `old_string` 必须唯一
- 优先编辑已有文件，而不是新建文件

这说明 `Edit` 的哲学不是“自由生成新内容”，而是：

**基于已观察内容做精确、可定位的变更。**

### 5.3 关键参数

- `old_string`
- `new_string`
- `replace_all`

### 5.4 运行时行为特点

`Edit` 的成功非常依赖上下文精确性，因此它天然更适合：

- 小范围修改
- 精准替换
- 基于刚读取的内容做局部改动

而不太适合：

- 大量生成全新文件
- 大规模重构时跨很多文件乱改

### 5.5 为什么它重要

`Edit` 是 Claude Code 保持“有控制地修改代码”的关键工具。

相比直接覆盖式写文件，它更安全，也更利于人类和模型共同理解改动边界。

---

## 6. `GrepTool`

### 6.1 工具定位

`GrepTool` 是内容搜索工具，建立在 ripgrep 语义之上。

它的目标不是找文件名，而是找：

- 符号
- 文本模式
- 正则匹配
- 某些行为痕迹

### 6.2 模型侧看到的核心语义

`src/tools/GrepTool/prompt.ts` 明确要求：

- 搜索任务优先用 `GrepTool`
- 不要自己在 Bash 里跑 `grep` / `rg`
- 支持 regex、glob、type、multiline
- 开放式搜索应考虑 `AgentTool`

这说明 `GrepTool` 被设计成：

**代码搜索的标准入口。**

### 6.3 关键参数

- `pattern`
- `glob`
- `type`
- `output_mode`
- `multiline`

### 6.4 为什么它和 `AgentTool` 有边界

`GrepTool` 适合单轮、明确模式搜索。

如果问题变成：

- 要多次迭代搜索
- 要边找边判断
- 要跨多个区域建立综合结论

那就应该升级到 `AgentTool`。

---

## 7. `GlobTool`

### 7.1 工具定位

`GlobTool` 负责按路径模式找文件。

它不是内容搜索，而是：

- 按文件名 / 目录模式筛选
- 快速找候选文件集

### 7.2 模型侧看到的核心语义

`src/tools/GlobTool/prompt.ts` 给的定位非常简单但非常明确：

- 快速文件匹配
- 按 glob 模式找路径
- 开放式多轮搜寻还是该交给 `AgentTool`

### 7.3 典型用途

适合：

- 找 `**/*.ts`
- 找 `src/**/*.tsx`
- 找某类目录结构

不适合：

- 搜内容
- 做复杂归因分析

### 7.4 和 `GrepTool` 的区别

- `GlobTool`：找文件名 / 路径
- `GrepTool`：找文件内容

很多理解代码库的流程都会先 `Glob`，再 `Grep`，再 `Read`。

---

## 8. `TaskCreateTool`

### 8.1 工具定位

`TaskCreateTool` 用于把当前复杂工作显式外化成结构化任务列表。

这不是后台进程 task，而是**会话层的工作拆解工具**。

### 8.2 模型侧看到的核心语义

`src/tools/TaskCreateTool/prompt.ts` 强调：

- 复杂、多步、非平凡任务应主动创建任务
- 只有单一简单任务时不要用
- 任务要写清楚 subject / description
- 在 swarm 模式下要考虑可分配给 teammate

这说明它的作用不仅是“记个 todo”，还是：

**把复杂任务显式结构化，帮助模型持续推进。**

### 8.3 为什么它重要

Claude Code 的推理虽然是动态的，但任务列表提供了一个稳定外显层：

- 帮模型记住当前在做什么
- 帮用户看到进度
- 帮 swarm 模式做任务分配

---

## 9. `TaskUpdateTool`

### 9.1 工具定位

`TaskUpdateTool` 负责更新工作任务状态。

### 9.2 模型侧看到的核心语义

`src/tools/TaskUpdateTool/prompt.ts` 最关键的点包括：

- 开始做时标记 `in_progress`
- 真正完成后再标记 `completed`
- 不要在有未解决问题时误标完成
- 需要时可设置 owner、依赖、metadata

### 9.3 为什么它重要

如果只有 `TaskCreateTool` 没有更新，任务列表很快会失真。

`TaskUpdateTool` 让 Claude Code 的 task list 具备：

- 生命周期
- 依赖关系
- owner 机制
- 任务协作能力

所以它是任务系统可用性的关键。

---

## 10. 这些工具怎么组合起来

一条典型链路往往是：

1. `TaskCreateTool`
2. `GlobTool`
3. `GrepTool`
4. `Read`
5. `Edit`
6. `BashTool`
7. `TaskUpdateTool`

如果问题太复杂，则在中间插入：

8. `AgentTool`

这说明核心工具并不是平铺并列的，而是形成一个典型工作流：

- 任务外显
- 路径搜索
- 内容搜索
- 精读文件
- 修改文件
- 执行命令
- 更新状态
- 必要时委托子 Agent

---

## 11. 哪个工具最关键

如果按系统层次来分：

- **执行面核心**：`BashTool`
- **委托面核心**：`AgentTool`
- **感知面核心**：`Read`、`GrepTool`、`GlobTool`
- **修改面核心**：`Edit`
- **任务管理面核心**：`TaskCreateTool`、`TaskUpdateTool`

它们合起来才构成 Claude Code 的完整能力面。

---

## 12. 对照源码

| 工具 | Prompt 入口 | 相关运行时入口 |
|------|------|------|
| `AgentTool` | `src/tools/AgentTool/prompt.ts` | `src/tools/AgentTool/runAgent.ts`、`src/utils/forkedAgent.ts` |
| `BashTool` | `src/tools/BashTool/prompt.ts` | `src/services/tools/toolExecution.ts`、`src/tools/BashTool/shouldUseSandbox.ts` |
| `Read` | `src/tools/FileReadTool/prompt.ts` | `src/tools/FileReadTool/FileReadTool.ts` |
| `Edit` | `src/tools/FileEditTool/prompt.ts` | `src/tools/FileEditTool/*` |
| `GrepTool` | `src/tools/GrepTool/prompt.ts` | `src/tools/GrepTool/GrepTool.ts` |
| `GlobTool` | `src/tools/GlobTool/prompt.ts` | `src/tools/GlobTool/GlobTool.ts` |
| `TaskCreateTool` | `src/tools/TaskCreateTool/prompt.ts` | `src/tools/TaskCreateTool/TaskCreateTool.ts`、`src/utils/tasks.ts` |
| `TaskUpdateTool` | `src/tools/TaskUpdateTool/prompt.ts` | `src/tools/TaskUpdateTool/TaskUpdateTool.ts`、`src/utils/tasks.ts` |

---

## 13. 相关 Prompt 文档

如果你关心的不是“工具做什么”，而是“工具定义最终怎么进入模型请求”，建议继续看：

- [请求外壳]({{ site.baseurl }}{% post_url 2026-04-03-claude-code-series-02-request-envelope %})
  看 `tools[]` 作为 sideband 字段在总请求里的位置。

- [主线程]({{ site.baseurl }}{% post_url 2026-04-03-claude-code-series-03-main-thread-prompt %})
  看主线程里工具定义如何和 `system`、`messages` 一起构成真实请求。

- [普通子 Agent]({{ site.baseurl }}{% post_url 2026-04-03-claude-code-series-04-subagent-prompt %})
  看子 Agent 的工具面如何按角色裁剪。

---

## 14. 一句总结

Claude Code 的工具不是“附着在 prompt 后面的说明文本”，而是：

**和 `system`、`messages` 并列组成模型工作面的结构化能力定义。**
