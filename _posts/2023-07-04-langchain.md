---
layout: post
tags: AI langchain
subtitle: AI工具类
mermaid: false
---

# LangChain

LangChain是一个用于开发由语言模型支持的应用程序的框架。

## 什么是LangChain?

使用ChatGPT大家可能都是知道prompt：

1. 想像一下，如果我需要快速读一本书，想通过本书作为prompt，使用ChatGPT根据书本中来回答问题，我们需要怎么做？
2. 假设你需要一个问答任务用到prompt A，摘要任务要使用到prompt B，那如何管理这些prompt呢？因此需要用LangChain来管理这些prompt。

LangChain的出现，简化了我们在使用ChatGPT的工程复杂度。

**LangChain中的模块，每个模块如何使用？**

**前提**：运行一下代码，需要OPENAI\_API\_KEY（OpenAI申请的key，配置到ENV中）,同时统一引入这些库：

    # 导入LLM包装器
    from langchain import OpenAI, ConversationChain
    from langchain.agents import initialize_agent
    from langchain.agents import load_tools
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate

**LLM**：从语言模型中输出预测结果，和直接使用OpenAI的接口一样，输入什么就返回什么。

    llm = OpenAI(model_name="text-davinci-003", temperature=0.9) // 这些都是OpenAI的参数
    text = "What would be a good company name for a company that makes colorful socks?"
    print(llm(text)) 
    // 以上就是打印调用OpenAI接口的返回值，相当于接口的封装，实现的代码可以看看github.com/hwchase17/langchain/llms/openai.py的OpenAIChat

以上代码运行结果：

    Cozy Colours Socks.

**Prompt Templates**：管理LLMs的Prompts，就像我们需要管理变量或者模板一样。

    prompt = PromptTemplate(
        input_variables=["product"],
        template="What is a good name for a company that makes {product}?",
    )
    // 以上是两个参数，一个输入变量，一个模板字符串，实现的代码可以看看github.com/hwchase17/langchain/prompts
    // PromptTemplate实际是基于StringPromptTemplate，可以支持字符串类型的模板，也可以支持文件类型的模板

以上代码运行结果：

    What is a good name for a company that makes colorful socks?

**Chains**：将LLMs和prompts结合起来，前面提到提供了OpenAI的封装和你需要问的字符串模板，就可以执行获得返回了。

    from langchain.chains import LLMChain
    chain = LLMChain(llm=llm, prompt=prompt) // 通过LLM的llm变量，Prompt Templates的prompt生成LLMChain
    chain.run("colorful socks") // 实际这里就变成了实际问题：What is a good name for a company that makes colorful socks？

**Agents**：基于用户输入动态地调用chains，LangChani可以将问题拆分为几个步骤，然后每个步骤可以根据提供个Agents做相关的事情。

    # 导入一些tools，比如llm-math
    # llm-math是langchain里面的能做数学计算的模块
    tools = load_tools(["llm-math"], llm=llm)
    # 初始化tools，models 和使用的agent
    agent = initialize_agent(
        tools, llm, agent="zero-shot-react-description", verbose=True)
    text = "12 raised to the 3 power and result raised to 2 power?"
    print("input text: ", text)
    agent.run(text)

通过如上的代码，运行结果（拆分为两个部分）：

    > Entering new AgentExecutor chain...
     I need to use the calculator for this
    Action: Calculator
    Action Input: 12^3
    Observation: Answer: 1728
    Thought: I need to then raise the previous result to the second power
    Action: Calculator
    Action Input: 1728^2
    Observation: Answer: 2985984
    
    Thought: I now know the final answer
    Final Answer: 2985984
    > Finished chain.

**Memory**：就是提供对话的上下文存储，可以使用Langchain的ConversationChain，在LLM交互中记录交互的历史状态，并基于历史状态修正模型预测。

    # ConversationChain用法
    llm = OpenAI(temperature=0)
    # 将verbose设置为True，以便我们可以看到提示
    conversation = ConversationChain(llm=llm, verbose=True)
    print("input text: conversation")
    conversation.predict(input="Hi there!")
    conversation.predict(
      input="I'm doing well! Just having a conversation with an AI.")

通过多轮运行以后，就会出现：

    Prompt after formatting:
    The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.
    
    Current conversation:
    
    Human: Hi there!
    AI:  Hi there! It's nice to meet you. How can I help you today?
    Human: I'm doing well! Just having a conversation with an AI.
    AI:  That's great! It's always nice to have a conversation with someone new. What would you like to talk about?

### 具体代码

需要配置ENV: OPENAI\_API\_KEY

    # 导入LLM包装器
    from langchain import OpenAI, ConversationChain
    from langchain.agents import initialize_agent
    from langchain.agents import load_tools
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
    # 初始化包装器，temperature越高结果越随机
    llm = OpenAI(temperature=0.9)
    # 进行调用
    text = "What would be a good company name for a company that makes colorful socks?"
    print("input text: ", text)
    print(llm(text))
    
    prompt = PromptTemplate(
      input_variables=["product"],
      template="What is a good name for a company that makes {product}?",
    )
    print("input text: product")
    print(prompt.format(product="colorful socks"))
    
    chain = LLMChain(llm=llm, prompt=prompt)
    chain.run("colorful socks")
    
    # 导入一些tools，比如llm-math
    # llm-math是langchain里面的能做数学计算的模块
    tools = load_tools(["llm-math"], llm=llm)
    # 初始化tools，models 和使用的agent
    agent = initialize_agent(tools,
                             llm,
                             agent="zero-shot-react-description",
                             verbose=True)
    text = "12 raised to the 3 power and result raised to 2 power?"
    print("input text: ", text)
    agent.run(text)
    
    # ConversationChain用法
    llm = OpenAI(temperature=0)
    # 将verbose设置为True，以便我们可以看到提示
    conversation = ConversationChain(llm=llm, verbose=True)
    print("input text: conversation")
    conversation.predict(input="Hi there!")
    conversation.predict(
      input="I'm doing well! Just having a conversation with an AI.")

## Agent的原理

基于用户输入动态地调用chains，LangChani可以将问题拆分为几个步骤，然后每个步骤可以根据提供个Agents做相关的事情。

### 工具代码

    from langchain.tools import BaseTool
    
    # 搜索工具
    class SearchTool(BaseTool):
        name = "Search"
        description = "如果我想知道天气，'鸡你太美'这两个问题时，请使用它"
        return_direct = True  # 直接返回结果
    
        def _run(self, query: str) -> str:
            print("\nSearchTool query: " + query)
            return "这个是一个通用的返回"
    
        async def _arun(self, query: str) -> str:
            raise NotImplementedError("暂时不支持异步")
    
    # 计算工具
    class CalculatorTool(BaseTool):
        name = "Calculator"
        description = "如果是关于数学计算的问题，请使用它"
    
        def _run(self, query: str) -> str:
            print("\nCalculatorTool query: " + query)
            return "3"
    
        async def _arun(self, query: str) -> str:
            raise NotImplementedError("暂时不支持异步")

以上代码提供了两个基于langchain的BaseTool工具：

1. SearchTool逻辑是实现搜索功能  
   1. description="如果我想知道或者查询'天气'，'鸡你太美'知识时，请使用它"，意思是查询类似的问题会走到SearchTool.\_run方法，无论什么这里我都返回"这个是一个通用的返回"  
   2. return\_direct=True，表示只要执行完SearchTool就不会进步一步思考，直接返回  
2. CalculatorTool逻辑是实现计算功能  
   1. description = "如果是关于数学计算的问题，请使用它"，意思是计算类的问题会走到CalculatorTool.\_run方法，无论什么这里我都返回100  
   2. return\_direct是默认值（False），表示执行完CalculatorTool，OpenAI会继续思考问题

### 执行逻辑

1、先问一个问题

    llm = OpenAI(temperature=0)
    tools = [SearchTool(), CalculatorTool()]
    agent = initialize_agent(
        tools, llm, agent="zero-shot-react-description", verbose=True)
    
    print("问题：")
    print("答案：" + agent.run("告诉我'鸡你太美'是什么意思"))

2、执行结果

    问题：
    > Entering new AgentExecutor chain...
     I should try to find an answer online
    Action: Search
    Action Input: '鸡你太美'
    SearchTool query: '鸡你太美'
    
    Observation: 这个是一个通用的返回
    
    > Finished chain.
    答案：这个是一个通用的返回

3、如何实现的呢？  
LangChain Agent中，内部是一套问题模板：

    PREFIX = """Answer the following questions as best you can. You have access to the following tools:"""
    FORMAT_INSTRUCTIONS = """Use the following format:
    
    Question: the input question you must answer
    Thought: you should always think about what to do
    Action: the action to take, should be one of [{tool_names}]
    Action Input: the input to the action
    Observation: the result of the action
    ... (this Thought/Action/Action Input/Observation can repeat N times)
    Thought: I now know the final answer
    Final Answer: the final answer to the original input question"""
    SUFFIX = """Begin!
    
    Question: {input}
    Thought:{agent_scratchpad}"""

通过这个模板，加上我们的问题以及自定义的工具，会变成下面这个样子（# 后面是增加的注释）：

    # 尽可能的去回答以下问题，你可以使用以下的工具：
    Answer the following questions as best you can.  You have access to the following tools: 
    
    Calculator: 如果是关于数学计算的问题，请使用它
    Search: 如果我想知道天气，'鸡你太美'这两个问题时，请使用它 
    Use the following format: # 请使用以下格式(回答)
    
    # 你必须回答输入的问题
    Question: the input question you must answer 
    # 你应该一直保持思考，思考要怎么解决问题
    Thought: you should always think about what to do
    # 你应该采取[计算器,搜索]之一
    Action: the action to take, should be one of [Calculator, Search] 
    Action Input: the input to the action # 动作的输入
    Observation: the result of the action # 动作的结果
    # 思考-行动-输入-输出 的循环可以重复N次
    ...  (this Thought/Action/Action Input/Observation can repeat N times) 
    # 最后，你应该知道最终结果
    Thought: I now know the final answer 
    # 针对于原始问题，输出最终结果
    Final Answer: the final answer to the original input question 
    
    Begin! # 开始
    Question: 告诉我'鸡你太美'是什么意思 # 问输入的问题
    Thought: 

通过这个模板向openai规定了一系列的规范，包括目前现有哪些工具集，你需要思考回答什么问题，你需要用到哪些工具，你对工具需要输入什么内容等。  
如果仅仅是这样，openai会完全补完你的回答，中间无法插入任何内容。  
因此LangChain使用OpenAI的stop参数，截断了AI当前对话。"stop": \["\\nObservation: ", "\\n\\tObservation: "\]。  
做了以上设定以后，OpenAI仅仅会给到Action和 Action Input两个内容就被stop停止。  
最后根据LangChain的参数设定就能实现得到返回值『这个是一个通用的返回』，如果return\_direct设置为False，openai将会继续执行，直到找到正确答案（具体可以看下面这个『计算的例子』）。

4、计算的例子

    llm = OpenAI(temperature=0)
    tools = [SearchTool(), CalculatorTool()]
    agent = initialize_agent(
        tools, llm, agent="zero-shot-react-description", verbose=True)
    
    print("问题：")
    print("答案：" + agent.run("告诉我10的3次方是多少?"))

执行结果：

    问题：
    > Entering new AgentExecutor chain...
     这是一个数学计算问题，我应该使用计算器来解决它。
    Action: Calculator
    Action Input: 10^3
    CalculatorTool query: 10^3
    
    Observation: 5
    Thought: 我现在知道最终答案了
    Final Answer: 10的3次方是1000
    
    > Finished chain.
    答案：10的3次方是1000

发现经过CalculatorTool执行后，拿到的Observation: 5，但是openai认为答案是错误的，于是返回最终代码『10的3次方是1000』。

### 完整样例

    from langchain.agents import initialize_agent
    from langchain.llms import OpenAI
    from langchain.tools import BaseTool
    
    
    # 搜索工具
    class SearchTool(BaseTool):
        name = "Search"
        description = "如果我想知道天气，'鸡你太美'这两个问题时，请使用它"
        return_direct = True  # 直接返回结果
    
        def _run(self, query: str) -> str:
            print("\nSearchTool query: " + query)
            return "这个是一个通用的返回"
    
        async def _arun(self, query: str) -> str:
            raise NotImplementedError("暂时不支持异步")
    
    
    # 计算工具
    class CalculatorTool(BaseTool):
        name = "Calculator"
        description = "如果是关于数学计算的问题，请使用它"
    
        def _run(self, query: str) -> str:
            print("\nCalculatorTool query: " + query)
            return "5"
    
        async def _arun(self, query: str) -> str:
            raise NotImplementedError("暂时不支持异步")
    
    
    llm = OpenAI(temperature=0.5)
    tools = [SearchTool(), CalculatorTool()]
    agent = initialize_agent(
        tools, llm, agent="zero-shot-react-description", verbose=True)
    
    print("问题1：")
    print("答案：" + agent.run("查询这周天气"))
    print("问题2：")
    print("答案：" + agent.run("告诉我'鸡你太美'是什么意思"))
    print("问题3：")
    print("答案：" + agent.run("告诉我'hello world'是什么意思"))
    print("问题4：")
    print("答案：" + agent.run("告诉我10的3次方是多少?"))

执行结果

    问题1：

    > Entering new  chain...
    我需要查询天气信息
    Action: Search
    Action Input: 这周天气
    SearchTool query: 这周天气

    Observation: 这个是一个通用的返回

    > Finished chain.
    答案：这个是一个通用的返回
    问题2：

    > Entering new  chain...
    This is not a mathematical question, so I should use a search engine.
    Action: Search
    Action Input: '鸡你太美'
    SearchTool query: '鸡你太美'

    Observation: 这个是一个通用的返回

    > Finished chain.
    答案：这个是一个通用的返回
    问题3：

    > Entering new  chain...
    'hello world' is usually a phrase used to introduce someone to programming
    Action: Search
    Action Input: 'hello world' 意思
    SearchTool query: 'hello world' 意思

    Observation: 这个是一个通用的返回


    > Finished chain.
    答案：这个是一个通用的返回
    问题4：


    > Entering new  chain...
    I need to use a calculator to solve this math question.
    Action: Calculator
    Action Input: 10^3
    CalculatorTool query: 10^3

    Observation: 5
    Thought: I now know the final answer
    Final Answer: 10的3次方是1000

    > Finished chain.
    答案：10的3次方是1000

## tools

1. Example selectors:如果您有大量示例，您可能需要选择要包含在提示中的示例。示例选择器是负责执行此操作的类。更接近的示例，gpt给的结果也就更准确。
2. Pydantic (JSON) parser：该输出解析器允许用户指定任意 JSON 模式并查询 LLM 以获得符合该模式的 JSON 输出。结构化结果，方便与其他程序交互。
3. Document loaders：用于加载各种文档，如csv/json/pdf/txt等
4. Text splitters：gpt有tokens限制，所以交给gpt的内容不能太长。如果有大文件，则需要分块处理。
5. Text embedding models：embedding创建一段文本的矢量表示。它意味着我们可以在向量空间中思考文本，并执行语义搜索之类的操作，在向量空间中查找最相似的文本片段。
6. Vector stores：存储和搜索非结构化数据的最常见方法之一是embedding它并存储生成的embedding向量，然后在查询时embedding非结构化查询并检索与embedding查询“最相似”的向量。
7. Agent：使用 LLM 来确定采取哪些行动以及采取什么顺序。操作可以是使用工具并观察其输出，也可以是向用户返回响应。
8. [PlanAndExecute](https://python.langchain.com/docs/modules/agents/agent_types/plan_and_execute)：计划和执行代理通过首先计划要做什么，然后执行子任务来实现目标。如AutoGPT的功能

## 链接

1. [官方文档](https://python.langchain.com/docs/get_started)
2. [快速构建应用-来自知乎](https://zhuanlan.zhihu.com/p/625890521)
3. [如何通过GPT问一本书的问题](https://juejin.cn/post/7215398854640386104)
