# 鉴谣台 · 家庭群谣言核查台

把爸妈群里转的养生截图、新闻链接丢进来，自动读图、模型核查权威来源、给四档判定，还能生成一张能直接转回家庭群的辟谣卡。

由 **Doubao-Seed-Evolving**（火山方舟）驱动，对应 8/27 版本更新的四大特性：视觉理解（读群截图）、深度搜索与真实性（溯源 + 时效性判定）、工具调用（web_search + 结构化函数工具）、长程规划（核查记录积累）。

## 为什么做

家庭群谣言的坑不在「信不信」，在「子女没法一条条查」。一条「吃过夜菜致癌」，你要查权威来源、组织长辈听得懂的话、还得给个能转回群里的结论。鉴谣台把这三步自动化了。

## 功能

- **粘贴文字 / 上传截图**双入口，截图走模型视觉读图，逐条拆说法
- **本地预扫**：内置经典谣言词典 + 话术信号识别，输入瞬间出预警，不耗额度
- **深度核查**：调用 `doubao-seed-evolving`，通过 `submit_report` 结构化函数工具返回判定与来源（辟谣平台、疾控、官方媒体）
- **四档判定**：失实 / 部分属实 / 属实 / 无法核实，附把握度与来源 URL
- **总体判定横幅**：一次核查多条说法时，按最严重结论给出一句话提示
- **长辈版辟谣卡**：canvas 动态高度生成图片，可直接存图转发到家庭群
- **模型自查**：证据不足时主动标注，不编造来源
- **核查记录**：本地保存历史，谣言库随用随厚
- **无障碍**：大字号（≥15px）、54px 点击目标、四色语义化、`prefers-reduced-motion` 支持

## 快速开始

```bash
npm install
# 配置火山方舟 Agent Plan 专属 Key（核查必须）
# Windows PowerShell:  $env:ARK_API_KEY="你的方舟Key"
# macOS/Linux:         export ARK_API_KEY="你的方舟Key"
npm start
# 打开 http://localhost:3000
```

> Key 在 [火山方舟控制台 - Agent Plan 开通管理](https://console.volcengine.com/ark/region:cn-beijing/openManagement?advancedActiveKey=agentPlan) 创建。
> **注意**：Agent Plan 是订阅套餐，走专属 endpoint `https://ark.cn-beijing.volces.com/api/plan/v3`（不是按量付费的 `/api/v3`），Key 也是套餐专属，两者不通用。Key 只放在服务端环境变量，永不下发到浏览器。

## 技术栈

Node.js + Express（单文件代理）+ 原生 H5（零构建、移动端优先、Soft UI 无障碍设计）。浏览器只跟本机后端通信，方舟 API 由服务端代理转发，Key 不暴露。

## 说明

- `web_search` 工具已在请求中挂载；普通按量付费 Key 可触发真实联网检索。Agent Plan 套餐当前不触发 web_search，模型基于自身知识核查并会在自查字段中如实标注，来源 URL 为权威机构官网，需子女进一步复核。
- 深度核查（含 reasoning）约需 1–5 分钟。

## 免责

核查结果仅供参考，不构成医疗建议。涉及健康问题请以医生和权威机构为准。
