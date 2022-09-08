---
excerpt_separator: <!--more-->
tags: grpc test json
---

# grpc testtool

1. 这是我参考grpcurl，实现的一个方便测试grpc功能的程序，能够做到无代码测试。
2. 可以简单的通过json文件，就能够测试grpc服务的功能
3. 可以通过proto文件，自动生成测试模版（不含数据的json文件），补充少量数据就能够成为测用例
<!--more-->

## 简单说明

[项目源码](https://github.com/lengzhao/testtools)

### 原理

1. 测试：
   1. 参考grpcurl，从json文件读取测试数据，发送给grpc server
   2. 将收到的结果转成json格式的数据，和用例文件中期望值进行比较
2. 生成测试用例
   1. 加载proto文件
   2. 分析每个service
   3. 对每个method，生成一个json文件
   4. json文件里面保存service name，method name
   5. 将请求/响应的message转成json格式，放到json文件里
   6. 用户只需要在message对应的json里面填充数据，就能够变成一个用例数据。
3. 后续要添加的功能：
   1. 当前仅仅模拟client，测试server的功能
   2. 接下来准备模拟server，从而实现免代码测试client或中间件的功能
