---
layout: post
tags: nodejs 备忘 版本
subtitle: nodejs版本管理
mermaid: false
---

# NodeJs版本管理

问题：`web3-react@: The engine "node" is incompatible with this module. Expected version "^14 || ^16". Got "18.12.1"`

使用最新的node版本不支持，需要切换为指定版本

```bash
$ nvm list
->     v18.12.1
         system
default -> 18 (-> v18.12.1)
```

列出可用的版本列表

```bash
$ nvm ls-remote
        ......
       v16.18.0   (LTS: Gallium)
       v16.18.1   (Latest LTS: Gallium)
       ......
```

安装指定版本

```bash
$ nvm install v16.18.1
Downloading and installing node v16.18.1...
.....
Now using node v16.18.1 (npm v8.19.2)
```

修改默认版本

```bash
$ nvm alias default v16.18.1
default -> v16.18.1
```

查看版本

```bash
$ node -v
v16.18.1
```

现在默认版本已经是指定的版本，可以安装运行项目了

[更多说明](https://yoember.com/nodejs/the-best-way-to-install-node-js-with-yarn/)
