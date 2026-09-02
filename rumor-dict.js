// 本地谣言模式词典 —— 上传瞬间出预扫结果，不用等模型。
// 每条都是已被权威机构反复辟谣、有定论的经典家庭群谣言，结论有公开事实核查支撑。
// 预扫只负责「快速预警」，最终判定仍以联网核查为准（报告里会明确标注）。
export const RUMOR_PATTERNS = [
  {
    id: 'overnight-food-cancer',
    keywords: ['过夜', '致癌', '赶紧扔', '亚硝酸盐'],
    match: /过夜.{0,6}(菜|食物|饭|菜会).{0,4}致癌|吃.{0,4}过夜.{0,6}致癌/,
    verdict: '失实',
    claim: '吃过夜食物会致癌，必须赶紧扔掉',
    explain: '隔夜菜本身不致癌。冷藏保存、食用前彻底加热，亚硝酸盐含量远低于国家安全限值。真正该扔的是室温放了一整夜、已经变质的菜。',
    sources: [
      { title: '「隔夜菜致癌」是真的吗？', publisher: '中国互联网联合辟谣平台', url: 'https://www.piyao.org.cn/' },
      { title: '隔夜菜亚硝酸盐科普', publisher: '科普中国', url: 'https://www.kepuchina.cn/' }
    ],
    advice: '别扔，热透了能吃；室温放过夜、有异味的才倒掉。'
  },
  {
    id: 'microwave-cancer',
    keywords: ['微波炉', '致癌', '辐射'],
    match: /微波炉.{0,8}(致癌|辐射.{0,4}伤身|有毒)/,
    verdict: '失实',
    claim: '微波炉加热食物会致癌、有辐射伤身',
    explain: '微波炉用的是非电离辐射，频率和无线电波同类，不会让食物产生致癌物，也不会让人「沾上辐射」。只要容器和炉门完好，正常使用是安全的。',
    sources: [
      { title: '微波炉加热食物会致癌吗', publisher: '中国互联网联合辟谣平台', url: 'https://www.piyao.org.cn/' }
    ],
    advice: '放心用，别用金属容器和不耐热塑料盒就行。'
  },
  {
    id: 'msg-hair-loss',
    keywords: ['味精', '脱发', '致癌', '鸡精'],
    match: /味精.{0,8}(致癌|脱发|有害|有毒)/,
    verdict: '失实',
    claim: '吃味精会致癌、掉头发',
    explain: '味精的主要成分是谷氨酸钠，是被多国食品安全机构认可的增味剂，正常用量下既不致癌也不导致脱发。「味精有害」是几十年前的旧谣言，早就被推翻。',
    sources: [
      { title: '味精有害健康？官方辟谣', publisher: '科普中国', url: 'https://www.kepuchina.cn/' }
    ],
    advice: '正常放调料没问题，血压高的人注意少盐少钠。'
  },
  {
    id: 'plastic-seaweed',
    keywords: ['塑料', '紫菜', '假鸡蛋', '假'],
    match: /(紫菜|海带|粉丝|鸡蛋).{0,6}是.{0,4}塑料|塑料.{0,4}(做|冒充).{0,4}(紫菜|鸡蛋|粉丝)/,
    verdict: '失实',
    claim: '紫菜/粉丝/鸡蛋是塑料做的',
    explain: '「塑料做紫菜、假鸡蛋」这类视频被多次辟谣：塑料成本比食材还贵，且泡发、燃烧、口感完全对不上，不可能以假乱真。多为营销号摆拍。',
    sources: [
      { title: '「塑料紫菜」谣言始末与辟谣', publisher: '中国互联网联合辟谣平台', url: 'https://www.piyao.org.cn/' }
    ],
    advice: '认准正规渠道买，别信「火烧辨真假」的摆拍视频。'
  },
  {
    id: 'vaccine-conspiracy',
    keywords: ['疫苗', '阴谋', '绝育', '有毒', '别打'],
    match: /疫苗.{0,10}(阴谋|绝育|有毒|有害|别打|不能打)/,
    verdict: '失实',
    claim: '疫苗是阴谋 / 打疫苗有害，别打',
    explain: '「疫苗绝育、疫苗是人口阴谋」是全球流传最广的健康谣言之一，没有任何科学依据。疫苗是预防传染病最有效的手段，相关说法已被世卫组织和各国疾控反复驳斥。',
    sources: [
      { title: '疫苗相关谣言辟谣', publisher: '中国疾病预防控制中心', url: 'https://www.chinacdc.cn/' }
    ],
    advice: '疫苗按接种程序打，有疑问问社区医生，别信群里转发。'
  },
  {
    id: 'acid-alkaline',
    keywords: ['酸性体质', '碱性', '酸碱', '体质'],
    match: /酸性体质|酸碱体质|多吃碱性|体质.{0,4}酸化/,
    verdict: '失实',
    claim: '「酸性体质」是百病之源，要多吃碱性食物调理',
    explain: '医学上根本没有「酸性体质/碱性体质」这个概念。人体血液 pH 值被身体严格稳定在 7.35–7.45，靠吃什么食物改不了。这套理论的创始人在美国被罚了上亿美元。',
    sources: [
      { title: '「酸碱体质理论」是伪科学', publisher: '科普中国', url: 'https://www.kepuchina.cn/' }
    ],
    advice: '不用买任何「调体质」的保健品，均衡饮食就够了。'
  },
  {
    id: 'urine-therapy',
    keywords: ['喝尿', '尿疗', '童子尿', '治病'],
    match: /喝尿|尿疗|童子尿.{0,6}(治病|养生|大补)/,
    verdict: '失实',
    claim: '喝尿能治病、养生、大补',
    explain: '尿液是人体排出的代谢废物，喝尿不仅不治病，还可能摄入细菌和有害物质导致感染。「尿疗」是明确的伪科学，没有任何医学证据支持。',
    sources: [
      { title: '「尿疗」养生辟谣', publisher: '中国互联网联合辟谣平台', url: 'https://www.piyao.org.cn/' }
    ],
    advice: '千万别喝，身体不舒服去正规医院。'
  },
  {
    id: 'wifi-plant',
    keywords: ['wifi', 'WiFi', '辐射', '植物', '仙人球', '防辐射'],
    match: /(wifi|WiFi|路由器).{0,8}(辐射|伤身|致癌|害死)|仙人球.{0,4}防辐射|防辐射服/,
    verdict: '失实',
    claim: 'WiFi 辐射能害死植物 / 伤身，要摆仙人球、穿防辐射服',
    explain: 'WiFi、路由器、手机信号都是非电离辐射，功率极低，对人体和植物没有可证实的伤害。「仙人球防辐射」「孕妇防辐射服」都没有科学依据。',
    sources: [
      { title: 'WiFi 辐射与防辐射谣言', publisher: '科普中国', url: 'https://www.kepuchina.cn/' }
    ],
    advice: '路由器正常放，不用买防辐射服、摆仙人球。'
  }
];

// 高风险「话术信号」：命中只预警、不定性，提醒要联网核实
export const ALERT_SIGNALS = [
  { re: /紧急通知|赶紧扔|马上(删|转|看)|不转不是|扩散|震惊|99%的人不知道/, why: '典型营销/谣言话术，用紧迫感逼你转发' },
  { re: /(医生|专家|教授|院士).{0,6}(不敢说|绝不会告诉你|联合封杀)/, why: '「专家不敢说」是伪科普固定开头' },
  { re: /(致癌|致死|绝育|慢性中毒|断子绝孙)/, why: '极端健康恐吓词，绝大多数已被辟谣' },
  { re: /(祖传秘方|偏方|根治|包治|治愈率\d+%)/, why: '承诺根治/包治的基本是虚假医疗宣传' },
  { re: /(微信|支付宝|银行|公安|社保).{0,10}(冻结|异常|点击链接|验证身份)/, why: '疑似诈骗话术，千万别点链接' }
];

export function prescan(text) {
  const hits = [];
  for (const p of RUMOR_PATTERNS) {
    // 只认真正则精确命中，避免单字/泛词（如「味」「精」）造成的假阳性
    if (p.match.test(text)) {
      hits.push({ ...p, matchType: '精确命中' });
    }
  }
  const signals = [];
  for (const s of ALERT_SIGNALS) {
    if (s.re.test(text)) signals.push(s.why);
  }
  return { hits, signals: [...new Set(signals)] };
}
