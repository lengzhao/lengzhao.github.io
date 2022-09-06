---
title: Lengzhao(郑桂庆)'s Blog
---
## 个人介绍

1. 08年毕业于厦门大学
2. 11年进入华为
3. 19年自己全新设计/实现基于分片的区块链系统
4. 21年进入Ambergroup

## Latest Posts

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      {{ post.excerpt }}
    </li>
  {% endfor %}
</ul>
