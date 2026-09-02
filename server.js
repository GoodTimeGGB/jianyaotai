// 鉴谣台 —— 家庭群谣言核查台
// Express 代理：浏览器只跟本机后端说话。
// 调用配置（apiKey / baseUrl / model / mode）优先取页面设置，其次取环境变量。
// 支持两种协议：
//   - responses: 火山方舟 Responses API（doubao-seed-evolving，支持 web_search）
//   - chat:      标准 OpenAI Chat Completions（OpenAI / DeepSeek / Kimi / 智谱等兼容厂商）
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prescan } from './rumor-dict.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_KEY = process.env.ARK_API_KEY || '';
const DEFAULT_BASE = process.env.ARK_BASE || 'https://ark.cn-beijing.volces.com/api/plan/v3';
const DEFAULT_MODEL = process.env.ARK_MODEL || 'doubao-seed-evolving';
const DEFAULT_MODE = process.env.ARK_MODE || 'responses'; // responses | chat

function resolveCfg(body) {
  const apiKey = (body?.apiKey || DEFAULT_KEY || '').trim();
  const baseUrl = (body?.baseUrl || DEFAULT_BASE || '').trim().replace(/\/+$/, '');
  const model = (body?.model || DEFAULT_MODEL || '').trim();
  const mode = ['responses', 'chat'].includes(body?.mode) ? body.mode : DEFAULT_MODE;
  return { apiKey, baseUrl, model, mode };
}

/* ---------- 结构化报告 schema ---------- */
// Responses API：扁平格式
const REPORT_TOOL_RESPONSES = {
  type: 'function',
  name: 'submit_report',
  description: '核查完成后，用这个工具提交结构化报告。所有字段都基于检索证据，查不到就如实标注。',
  parameters: {
    type: 'object',
    properties: {
      claims: {
        type: 'array',
        description: '从输入中拆出的每一条可核查说法',
        items: {
          type: 'object',
          properties: {
            claim: { type: 'string', description: '还原成一句完整、中立的说法' },
            verdict: { type: 'string', enum: ['属实', '部分属实', '失实', '无法核实'], description: '判定' },
            confidence: { type: 'string', enum: ['高', '中', '低'] },
            explain: { type: 'string', description: '人话解释，讲给长辈听，不超过 120 字' },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  publisher: { type: 'string', description: '来源机构，如 人民网/丁香医生/国家卫健委' }
                },
                required: ['title', 'url']
              }
            }
          },
          required: ['claim', 'verdict', 'confidence', 'explain']
        }
      },
      elder_card: {
        type: 'object',
        description: '一张可以直接转发到家庭群的辟谣卡，用长辈听得懂的话',
        properties: {
          headline: { type: 'string', description: '一句话结论，不超过 20 字' },
          body: { type: 'string', description: '给家人的提醒，口语化，不超过 80 字' },
          advice: { type: 'string', description: '一句行动建议，比如 别转了 / 可以放心 / 先去医院问医生' }
        },
        required: ['headline', 'body', 'advice']
      },
      notes: { type: 'string', description: '模型自查：哪些说法证据不足、需要人工再确认，没有就留空' }
    },
    required: ['claims', 'elder_card']
  }
};

// Chat Completions：标准 OpenAI function 格式（嵌套 function）
const REPORT_TOOL_CHAT = {
  type: 'function',
  function: {
    name: 'submit_report',
    description: REPORT_TOOL_RESPONSES.description,
    parameters: REPORT_TOOL_RESPONSES.parameters
  }
};

const INSTRUCTIONS = [
  '你是「鉴谣台」的核查引擎，服务对象是把家庭群截图发给子女的长辈。',
  '任务流程（严格按顺序）：',
  '1. 如果用户发来图片，先读图，把图里所有「健康养生、食品安全、社会新闻、政策、偏方」类说法逐条提取；如果是文字，直接拆说法。广告、寒暄、纯情绪内容忽略。',
  '2. 如可用联网工具（如 web_search），对每条说法检索权威来源（政府机构、官方媒体、三甲医院、专业辟谣平台如中国互联网联合辟谣平台、丁香医生等），核对事实与时效性。警惕过期信息：以前的政策/研究结论可能已更新。',
  '3. 给出判定：属实 / 部分属实 / 失实 / 无法核实。证据不足时，宁可判「无法核实」也不要编造来源。',
  '4. 每条说法给出你知道的权威来源机构及官网；若你没有联网检索能力，在 notes 里如实说明「未实际联网，来源需人工复核」，严禁编造具体文章 URL。',
  '5. 最后调用 submit_report 工具提交报告。elder_card 用口语写给长辈看，不许用「综上所述」「据悉」这类书面腔。',
  '6. 对「无法核实」的说法，elder_card 的 advice 要建议「先别转，问问子女或医生」。'
].join('\n');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: DEFAULT_MODEL, keyConfigured: Boolean(DEFAULT_KEY), server: true });
});

app.post('/api/prescan', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ ok: false, error: '缺少文本' });
  res.json({ ok: true, ...prescan(text) });
});

/* ---------- 连通测试 ---------- */
app.post('/api/test', async (req, res) => {
  const cfg = resolveCfg(req.body);
  if (!cfg.apiKey) return res.status(400).json({ ok: false, error: '还没填 API Key' });
  const started = Date.now();
  try {
    let resp;
    if (cfg.mode === 'chat') {
      resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: '回复两个字：通了' }], max_tokens: 16 })
      });
    } else {
      resp = await fetch(`${cfg.baseUrl}/responses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.model, input: '回复两个字：通了', max_output_tokens: 32 })
      });
    }
    const raw = await resp.text();
    let data; try { data = JSON.parse(raw); } catch { return res.status(502).json({ ok: false, error: '返回非 JSON：' + raw.slice(0, 200) }); }
    if (!resp.ok) return res.status(502).json({ ok: false, error: data?.error?.message || `接口报错 ${resp.status}` });
    res.json({ ok: true, model: cfg.model, baseUrl: cfg.baseUrl, mode: cfg.mode, ms: Date.now() - started, modelReturned: data.model || cfg.model });
  } catch (err) {
    res.status(502).json({ ok: false, error: '连不通：' + (err?.message || err) });
  }
});

/* ---------- 核查 ---------- */
app.post('/api/verify', async (req, res) => {
  const { text, image } = req.body || {};
  const cfg = resolveCfg(req.body);
  if (!cfg.apiKey) return res.status(400).json({ ok: false, error: '还没配置 API Key，请先到「设置」页填写' });
  if (!text && !image) return res.status(400).json({ ok: false, error: '请粘贴文字或上传截图' });

  try {
    const result = cfg.mode === 'chat'
      ? await runChat(cfg, { text, image })
      : await runResponses(cfg, { text, image });
    res.json(result);
  } catch (err) {
    console.error('[verify] 异常:', err?.message || err);
    res.status(500).json({ ok: false, error: String(err?.message || err) || '未知错误' });
  }
});

/* 火山方舟 Responses API */
async function runResponses(cfg, { text, image }) {
  let input;
  if (image) {
    input = [{
      role: 'user',
      content: [
        { type: 'input_image', image_url: image, detail: 'high' },
        { type: 'input_text', text: text ? `补充说明：${text}\n请核查这张家庭群截图里的所有说法。` : '请核查这张家庭群截图里的所有说法。' }
      ]
    }];
  } else {
    input = `请核查下面这段家庭群转发内容里的所有说法：\n\n${text}`;
  }
  const resp = await fetch(`${cfg.baseUrl}/responses`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model, instructions: INSTRUCTIONS, input,
      tools: [{ type: 'web_search', name: 'web_search' }, REPORT_TOOL_RESPONSES],
      tool_choice: 'auto'
    })
  });
  const raw = await resp.text();
  let data; try { data = JSON.parse(raw); } catch { return { ok: false, error: '接口返回非 JSON: ' + raw.slice(0, 300) }; }
  if (!resp.ok) return { ok: false, error: data?.error?.message || '接口返回错误' };

  let report = null;
  const citations = [];
  const texts = [];
  for (const item of data.output || []) {
    if (item.type === 'function_call' && item.name === 'submit_report') {
      try { report = JSON.parse(item.arguments); } catch { /* 半截 JSON 走兜底 */ }
    }
    if (item.type === 'message') {
      for (const c of item.content || []) {
        if (c.type === 'output_text') {
          texts.push(c.text);
          for (const ann of c.annotations || []) {
            const u = ann.url_citation || ann;
            if (u?.url) citations.push({ title: u.title || u.url, url: u.url });
          }
        }
      }
    }
  }
  return finalize({ report, texts, citations, usage: data.usage });
}

/* 标准 OpenAI Chat Completions */
async function runChat(cfg, { text, image }) {
  let content;
  if (image) {
    content = [];
    if (text) content.push({ type: 'text', text: `补充说明：${text}` });
    content.push({ type: 'text', text: '请核查这张家庭群截图里的所有说法。' });
    content.push({ type: 'image_url', image_url: { url: image, detail: 'high' } });
  } else {
    content = `请核查下面这段家庭群转发内容里的所有说法：\n\n${text}`;
  }
  const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: INSTRUCTIONS },
        { role: 'user', content }
      ],
      tools: [REPORT_TOOL_CHAT],
      tool_choice: 'auto'
    })
  });
  const raw = await resp.text();
  let data; try { data = JSON.parse(raw); } catch { return { ok: false, error: '接口返回非 JSON: ' + raw.slice(0, 300) }; }
  if (!resp.ok) return { ok: false, error: data?.error?.message || '接口返回错误' };

  const msg = data.choices?.[0]?.message || {};
  let report = null;
  const tc = msg.tool_calls?.find(t => t.function?.name === 'submit_report');
  if (tc?.function?.arguments) {
    try { report = JSON.parse(tc.function.arguments); } catch { /* 半截 JSON 走兜底 */ }
  }
  const texts = msg.content ? [msg.content] : [];
  // 统一 usage 字段
  const usage = data.usage ? {
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens,
    total_tokens: data.usage.total_tokens
  } : undefined;
  return finalize({ report, texts, citations: [], usage });
}

function finalize({ report, texts, citations, usage }) {
  if (!report) {
    const joined = texts.join('\n');
    const m = joined.match(/\{[\s\S]*"claims"[\s\S]*\}/);
    if (m) { try { report = JSON.parse(m[0]); } catch { /* ignore */ } }
    if (!report) return { ok: true, fallback: true, text: joined, usage, citations };
  }
  return { ok: true, report, usage, citations: dedupe(citations) };
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`鉴谣台已启动: http://localhost:${PORT}  (默认模型: ${DEFAULT_MODEL}, 协议: ${DEFAULT_MODE}, 环境 Key: ${DEFAULT_KEY ? '已配置' : '未配置（可在页面设置）'})`);
});
