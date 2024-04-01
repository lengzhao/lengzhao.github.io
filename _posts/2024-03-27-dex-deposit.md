---
layout: post
tags: blockchain dex DeFi 研究
subtitle: 关于DEX的入金调研
mermaid: true
---

# DEX

## dydx(v4)

v3版本只支持ethereum链，v4版本支持很多的链

v4所有的usdc都是直接通过跨链桥(Axelar + Squid)转到cosmos的应用链上

### 支持的链

### ethereum

1. [usdc deposit](https://etherscan.io/tx/0x088fc79ca6e66e66e8edbf79830bdcb6630634daef3449983f43c7eca9fc8b8e#eventlog)
   1. 直接通过Axelar: Gateway，将USDC转到osmosis链
   2. event：
      1. destinationChain :osmosis
      2. destinationContractAddress :osmo1tqctx98qz2aa25j5knzuztxaerl3z0ld8q6c72
      3. payload :000000007B7D
      4. symbol :USDC
      5. amount :149990000000
2. [eth deposit](https://etherscan.io/tx/0xdbde1f0156e7b93b6af39bae988db500627f61871bfdb304ed291a1637ae0365)
   1. eth->uniswap->Axelar
3. [withdrawal](https://etherscan.io/tx/0xc7c7d0a625363b36f4750250d003376954f7f717980c9a69d4be8f4ece7a4717#eventlog)
   1. 用户点击withdrawal->Axelar: Gateway->usdc->user
   2. event
      1. sourceChain :osmosis
      2. sourceAddress :osmo15jw7xccxaxk30lf4xgag8f7aeg53pgkh74e39rv00xfnymldjaas2fk627
      3. payloadHash :FF1D229475BD3CAEA0D5186DC174349EC355C81DD2B91913A71A9A56FE140F8E
      4. symbol :USDC

### polygon

1. 代理合约，将matic转成usdc[0xce16F69375520ab01377ce7B88f5BA8C48F8D666](https://polygonscan.com/address/0xce16F69375520ab01377ce7B88f5BA8C48F8D666#readContract)
   1. 通过Axelar + Squid进行跨链
   2. 合约更新过，没有完全公开：Implementation contract is now on 0x9c01172bdbed2eea06e4e18ad534bf651c9089ea but NOT verified. Please request for the new implementation contract to be verified. Currently displaying ABI for the previous implementation contract at 0x0c05bbc439c59861ebc7d504b5d74d2701f91e62, using the EIP-1967 Transparent Proxy pattern.
2. 通过Axelar: Gateway将资产axlUSDC跨到osmosis
   1. [Axelar github](https://github.com/axelarnetwork/axelar-cgp-solidity/tree/main)
   2. Axelar 是一个去中心化的互操作性网络，通过一组通用的协议和 API 连接所有区块链、资产和应用程序。它构建在 Cosmos SDK 之上。用户/应用程序可以使用 Axelar 网络在任何 Cosmos 和 EVM 链之间发送代币。
   3. 基于POS，定期更新私钥
3. [tx](https://polygonscan.com/tx/0x304178d978f72a967c2c0b738669b7b5425b799be5f38d00936f8b6f4d9fec46#eventlog)
4. [tx2](https://polygonscan.com/tx/0x3f75e53e5ca98f7d6685f262246487087543260a84d0014c9d7fa2dbce58b10c#eventlog)

### 怎么运行的

Squid 是一键跨链交易构建器，支持 20 秒内跨链交换。 Squid 通过 API、SDK 和前端开发工具为 60 多个区块链的团队提供互操作性服务。

目标：向 dYdX Chain 地址存款或取款。

1. 示例1：用户想要在 dYdX 链上获得 USDC，他们在以太坊 L1 上有 USDC。 
   1. 路线： USDC通过Axelar通用消息传递（GMP）发送到Osmosis，然后在Osmosis上交换到Noble USDC，通过Noble链从Osmosis桥接Noble USDC到dYdX Chain。一键完成所有操作。
2. 示例2：用户想要在 dYdX 链上获得 USDC，他们在 Arbitrum 上有 ETH。
   1. 路线： ETH 在 Kyberswap 上兑换成axlUSDC，axlUSDC 通过 Axelar GMP 发送到 Osmosis，axlUSDC 在 Osmosis 上兑换成 Noble USDC，然后通过 Noble 链从 Osmosis 桥接到 dYdX Chain。一键完成所有操作。

## apex

### ethereum

1. [deposit eth tx](https://etherscan.io/tx/0x57c15ae9934e9b976285cdb5af79d5e6b61534451dfa143e032674e9c6d87b34#eventlog)
   1. eth->weth->uniswap->usdc->smart contract of StarkWare->LogDeposit
   2. event:
      1. depositorEthKey :0x698192C9F0996eEa12B492d6806A98d2Fa928658
      2. starkKey :808407040787762513185759491072534470387110845926366575446650258276089325647
      3. vaultId :469614243172319823
      4. assetType :1147032829293317481173155891309375254605214077236177772270270553197624560221
      5. nonQuantizedAmount :1017200956
      6. quantizedAmount :1017200956
2. [withdrawal](https://dashboard.tenderly.co/tx/mainnet/0xc3b0d723752b2af974f994e5f46a8717ec7252c3119e623708bac79976b3d1f4)
   1. smart contract of StarkWare->usdc->user

### polygon

应该是基于多签钱包，代收用户的usdc

1. [deposit matic tx](https://dashboard.tenderly.co/tx/polygon/0x5183eb515a2286c43edcc0e8b61ef1f572eebb4182a08eec6d125ddebdf0ee09)
   1. matic->1inch->usdc->多签钱包0xddfd32b73212ed7854095112a53d9bdd53f0355f->Deposit(event)
   2. event:
      1. from :0x76ae6dfeF288ddb48D01d681962A2e116a161B8d
      2. token :0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
      3. spentAmount :470000000000000000000
      4. swapReturnAmount :481155921
      5. starkKey :2791924463036245725970956876677735830981960493118295976627707692225922138948
      6. positionId :524684241225646404
2. [withdrawal](https://dashboard.tenderly.co/tx/polygon/0xe8cb367b0792cd578d5dceb1b1564cf2c63b0927e2c32b544783e26b5af7f0fc)
   1. 通过多签验证，转给用户
   2. event: WithdrawERC20
      1. orderId :560971839916998770
      2. token :0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
      3. to :0x872D3Fb74CB230FAF1746b4E66971551A010bA6d
      4. amount :50000000000

#### 多签地址

1. [多签地址](https://polygonscan.com/address/0xddfd32b73212ed7854095112a53d9bdd53f0355f#readContract)
   1. [address1](https://polygonscan.com/address/0x9C5E4D586B38bfcFF9b64EAC7e78FF05068f9641)
   2. [address2](https://polygonscan.com/address/0x7798846E01916fa907A25678c1adAf1779F8E260)
   3. [address3](https://polygonscan.com/address/0x22c89137525b593Dd2A18434348b550ffA5984Fe)
2. [流程](https://apex-pro.gitbook.io/apex-pro/start-here/accounts-and-wallets/deposits-and-withdrawals/non-ethereum-deposits-and-withdrawals)

## vertex

Arbitrum 上的垂直整合 DEX，具有现货、永续和综合货币市场。通用全仓保证金。
Vertex 由混合统一中央限价订单簿 (CLOB) 和集成自动做市商 (AMM) 提供支持，随着配对 LP 市场的头寸填充订单簿，其流动性得到增强。

集成的 AMM 位于链上——位于协议层内。链上 AMM 充当智能合约级别控制的协议的默认状态，称为“慢动作模式”。

Vertex 的订单簿（“排序器”）作为链下节点运行，位于智能合约之上并包含在 Arbitrum 协议层中。订单簿以 10 - 30 毫秒的执行速度匹配入站订单，与大多数中心化交易所 (CEX) 相比具有竞争力。

跨链：Axelar + Squid

跨链方式和dydx的polygon方式一样，使用的是相同的合约0xce16F69375520ab01377ce7B88f5BA8C48F8D666进行跨链

[docs](https://docs.vertexprotocol.com/)

### 撮合

订单仍然需要双方的明确签名才能在链上执行。

[tx](https://arbiscan.io/tx/0x71c29f0a285c0cf88d90a8ed62570b70c4c733d53eade451137274c6286c0a5d#eventlog)

2023 年 12 月 23 日：为了减少链上提交的匹配订单的 Gas / Calldata 成本，订单签名将仅在排序器级别进行验证。要在链下独立查询和验证签名，您可以访问存档服务的签名注册表，并确保签名对于每个摘要都是有效的。存档的 API 签名端点如下，它将为提交到链上的每个订单返回唯一的签名。

存档服务签名 API 端点：https://vertex-protocol.gitbook.io/docs/developer-resources/api/archive-indexer/signatures

随着 Vertex V2 中排序器层很快变得去中心化，排序器级签名验证将在许多验证器中进行。我们预计此次更新将大幅增加每周以 USDC.e 形式支付给 VRTX 质押者的平均协议收入，而不是被链上通话数据成本所消耗。

## aevo

[Aevo](https://docs.aevo.xyz/aevo-exchange/introduction) 的智能合约在 Aevo Rollup 上运行，Aevo Rollup 是一种基于 EVM 的以太坊乐观汇总。交易是根据 Aevo Rollup 上的智能合约创建和结算的。 Aevo Rollup 与 Conduit 合作运营。

Conduit 为 Aevo Rollup 运行一个排序器，每 1 小时将批量交易发布到以太坊主网。 Aevo Rollup 上交易的争议期为 2 小时。这意味着当交易发布到以太坊主网上后，需要 2 小时才能得到完全确认。实际上，这意味着从 Aevo 提款将需要 2-3 小时才能得到完全确认。

使用 Optimism Standard Bridge 存款到 Aevo Rollup。标准桥由两个主要合约组成：L1StandardBridge（针对第 1 层）和 L2StandardBridge（针对第 2 层）。存入 Aevo Rollup 所需的确认时间与常规以太坊主网交易相同，约为 10 分钟。

Aevo 推出 Optimism 和 Arbitrum 存款，由[Socket](https://docs.socket.tech/)提供桥接支持

1. [eth deposit](https://etherscan.io/tx/0xa9ce64c9e079d13bb768ec5ef252d8722000f5a12303c3bb8052e621b2e54a51#eventlog)
   1. 通过官方桥直接转到L2,[调试信息](https://dashboard.tenderly.co/tx/mainnet/0xa9ce64c9e079d13bb768ec5ef252d8722000f5a12303c3bb8052e621b2e54a51)
2. [arbitrum deposit](https://arbiscan.io/tx/0xbad452887083a4347d6394a882766ebd810701b7b71281bb732d074f5f398950#eventlog)
3. [eth withdrawal](https://etherscan.io/tx/0x0932e3356d913f858de507027d49565abb7c4280f50a3487bb9cda7971d29e0d#eventlog)

## paradex

Paradex 是一个基于 Starknet 应用链构建的高性能加密货币衍生品交易所。只支持ethereum。

## orderly network

来自不同链的订单进入同一个订单簿，使其与多链 DEX 不同，统一流动性。订单匹配后，上传并结算到使用 OP Stack 构建的 Orderly L2 链上，定期结算到以太坊。
