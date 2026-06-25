/**
 * 中国主要城市识别 - 用于从文本中提取工作地点
 */

// 直辖市 + 省会 + 副省级城市 + 常见地级市
const CITIES = [
  // 直辖市
  "北京", "上海", "天津", "重庆",
  // 广东
  "广州", "深圳", "珠海", "佛山", "东莞", "中山", "惠州", "汕头", "江门", "湛江", "肇庆", "茂名", "揭阳",
  // 江苏
  "南京", "苏州", "无锡", "常州", "南通", "扬州", "镇江", "泰州", "盐城", "淮安", "连云港", "徐州", "宿迁",
  // 浙江
  "杭州", "宁波", "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水",
  // 山东
  "济南", "青岛", "烟台", "潍坊", "淄博", "威海", "济宁", "泰安", "临沂", "德州", "聊城", "滨州", "菏泽", "枣庄", "东营", "日照",
  // 四川
  "成都", "绵阳", "德阳", "宜宾", "泸州", "南充", "达州", "乐山", "凉山", "内江", "自贡", "眉山", "广安", "攀枝花", "遂宁",
  // 湖北
  "武汉", "宜昌", "襄阳", "荆州", "十堰", "黄石", "孝感", "荆门", "鄂州", "黄冈", "咸宁", "随州", "恩施",
  // 湖南
  "长沙", "株洲", "湘潭", "衡阳", "岳阳", "常德", "张家界", "益阳", "郴州", "永州", "怀化", "娄底", "湘西", "邵阳",
  // 河南
  "郑州", "洛阳", "开封", "南阳", "安阳", "新乡", "许昌", "平顶山", "焦作", "濮阳", "三门峡", "驻马店", "商丘", "周口", "信阳", "漯河", "鹤壁", "济源",
  // 河北
  "石家庄", "唐山", "秦皇岛", "邯郸", "邢台", "保定", "张家口", "承德", "沧州", "廊坊", "衡水",
  // 福建
  "福州", "厦门", "泉州", "漳州", "莆田", "宁德", "三明", "南平", "龙岩",
  // 安徽
  "合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城",
  // 江西
  "南昌", "九江", "赣州", "吉安", "宜春", "抚州", "上饶", "景德镇", "萍乡", "新余", "鹰潭",
  // 陕西
  "西安", "宝鸡", "咸阳", "渭南", "铜川", "延安", "榆林", "汉中", "安康", "商洛",
  // 辽宁
  "沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口", "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛",
  // 吉林
  "长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城", "延边",
  // 黑龙江
  "哈尔滨", "齐齐哈尔", "牡丹江", "佳木斯", "大庆", "伊春", "鸡西", "鹤岗", "双鸭山", "七台河", "绥化", "黑河", "大兴安岭",
  // 广西
  "南宁", "柳州", "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左",
  // 云南
  "昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆",
  // 贵州
  "贵阳", "六盘水", "遵义", "安顺", "毕节", "铜仁", "黔西南", "黔东南", "黔南",
  // 山西
  "太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁",
  // 甘肃
  "兰州", "嘉峪关", "金昌", "白银", "天水", "武威", "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南", "临夏", "甘南",
  // 内蒙古
  "呼和浩特", "包头", "乌海", "赤峰", "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "兴安", "锡林郭勒", "阿拉善",
  // 新疆
  "乌鲁木齐", "克拉玛依", "吐鲁番", "哈密", "昌吉", "博尔塔拉", "巴音郭楞", "阿克苏", "克孜勒苏", "喀什", "和田", "伊犁", "塔城", "阿勒泰",
  // 宁夏
  "银川", "石嘴山", "吴忠", "固原", "中卫",
  // 青海
  "西宁", "海东", "海北", "黄南", "海南", "果洛", "玉树", "海西",
  // 西藏
  "拉萨", "日喀则", "昌都", "林芝", "山南", "那曲", "阿里",
  // 海南
  "海口", "三亚", "三沙", "儋州",
  // 特别行政区
  "香港", "澳门",
  // 台湾
  "台北", "高雄", "台中", "台南", "新北", "桃园",
  // 全国/异地
  "全国", "异地", "远程", "线上",
];

/**
 * 从文本中识别城市名
 * @param text 待分析文本
 * @returns 识别到的城市列表（按出现顺序）
 */
export function extractCities(text: string): string[] {
  if (!text) return [];

  const found: string[] = [];
  const lowerText = text;

  for (const city of CITIES) {
    if (lowerText.includes(city)) {
      found.push(city);
    }
  }

  return found;
}

/**
 * 提取最可能的工作地点（取第一个出现的城市）
 */
export function extractPrimaryLocation(text: string): string | null {
  const cities = extractCities(text);
  if (cities.length === 0) return null;

  // 优先选择非"全国/远程/线上"的实体城市
  const realCities = cities.filter(
    (c) => !["全国", "异地", "远程", "线上"].includes(c)
  );

  return realCities.length > 0 ? realCities[0] : cities[0];
}

/**
 * 常见日期格式解析
 * 支持格式:
 * - 2024-01-15 / 2024/01/15 / 2024.01.15
 * - 2024年1月15日 / 2024年01月15日
 * - 1月15日 / 01-15 (默认当年)
 * - 今天 / 昨天 / 前天
 * - N天前 / N日前
 * - 刚刚 / 几分钟前
 */
export function parseDate(text: string | null | undefined): Date | null {
  if (!text) return null;

  const now = new Date();
  const cleanText = text.trim();

  // 今天/昨天/前天
  if (cleanText === "今天" || cleanText === "今日") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (cleanText === "昨天" || cleanText === "昨日") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (cleanText === "前天") {
    const d = new Date(now);
    d.setDate(d.getDate() - 2);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // N天前 / N日前
  const daysAgoMatch = cleanText.match(/(\d+)\s*天[前以]/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // 刚刚 / 几分钟前 / N小时前
  if (cleanText === "刚刚" || cleanText === "今日发布" || cleanText.includes("分钟前") || cleanText.includes("小时前")) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  let match = cleanText.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY年MM月DD日
  match = cleanText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // MM月DD日 / MM-DD (当年)
  match = cleanText.match(/(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const d = new Date(now.getFullYear(), month, day);
    if (!isNaN(d.getTime())) {
      // 如果日期在未来（说明应该是去年），则减一年
      if (d > now) d.setFullYear(d.getFullYear() - 1);
      return d;
    }
  }

  match = cleanText.match(/^(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const d = new Date(now.getFullYear(), month, day);
    if (!isNaN(d.getTime())) {
      if (d > now) d.setFullYear(d.getFullYear() - 1);
      return d;
    }
  }

  return null;
}
