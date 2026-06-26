#!/usr/bin/env python3
"""
双高计划高职院校就业网自动发现脚本

功能:
- 内置197所"双高计划"高职院校名单
- 尝试多种URL模式检测就业网
- 自动写入FairJob Source表

用法:
    python gen_vocational_sources.py                    # 扫描并输出结果
    python gen_vocational_sources.py --save              # 直接写入数据库
    python gen_vocational_sources.py --dry-run          # 仅测试不保存
"""

import urllib.request
import urllib.error
import json
import sqlite3
import time
import os
import sys
from typing import Optional, Tuple, List

# ==================== 双高计划院校名单 ====================

VOCATIONAL_COLLEGES = [
    # A档（前56所）
    ("北京工业职业技术学院", "bgi.edu.cn"),
    ("北京电子科技职业学院", "bvest.edu.cn"),
    ("天津职业大学", "tjtc.edu.cn"),
    ("天津中德应用技术大学", "tjdgut.edu.cn"),
    ("河北工业职业技术大学", "hbcit.edu.cn"),
    ("唐山工业职业技术学院", "tsgy.edu.cn"),
    ("邯郸职业技术学院", "hdczy.cn"),
    ("山西工程职业学院", "sxgc.edu.cn"),
    ("内蒙古建筑职业技术学院", "imaa.edu.cn"),
    ("渤海船舶职业学院", "bhcxy.edu.cn"),
    ("辽宁机电职业技术学院", "lnmec.edu.cn"),
    ("辽宁农业职业技术学院", "lnnzy.edu.cn"),
    ("长春汽车工业高等专科学校", "caii.edu.cn"),
    ("哈尔滨职业技术学院", "hrbvc.edu.cn"),
    ("黑龙江农业工程职业学院", "nyzy.cn"),
    ("黑龙江农业经济职业学院", "nyjj.net.cn"),
    ("上海医疗器械高等专科学校", "smcedu.com.cn"),
    ("上海旅游高等专科学校", "shi.edu.cn"),
    ("南京工业职业技术大学", "niit.edu.cn"),
    ("南京信息职业技术学院", "njcit.cn"),
    ("江苏农林职业技术学院", "jsafc.edu.cn"),
    ("江苏农牧科技职业学院", "jsahvc.edu.cn"),
    ("苏州工艺美术职业技术学院", "sgmart.edu.cn"),
    ("常州信息职业技术学院", "czcit.cn"),
    ("浙江机电职业技术学院", "zime.edu.cn"),
    ("浙江金融职业学院", "zfc.edu.cn"),
    ("浙江警官职业学院", "zjjy.com"),
    ("浙江工贸职业技术学院", "zjtch.edu.cn"),
    ("杭州职业技术学院", "hzvt.edu.cn"),
    ("宁波职业技术学院", "nbpt.edu.cn"),
    ("温州职业技术学院", "wzvtc.cn"),
    ("金华职业技术学院", "jhc.cn"),
    ("浙江商业职业技术学院", "zjbc.edu.cn"),
    ("浙江交通职业技术学院", "zjvtit.edu.cn"),
    ("安徽机电职业技术学院", "ahcmee.edu.cn"),
    ("安徽电气工程职业技术学院", "aepu.edu.cn"),
    ("福建信息职业技术学院", "miit.edu.cn"),
    ("漳州职业技术学院", "fjzzy.edu.cn"),
    ("黎明职业大学", "lmu.edu.cn"),
    ("江西应用技术职业学院", "jxyy.edu.cn"),
    ("江西现代职业技术学院", "jxxdxy.com"),
    ("山东商业职业技术学院", "sict.edu.cn"),
    ("青岛职业技术学院", "qtc.edu.cn"),
    ("山东职业学院", "sdpc.edu.cn"),
    ("烟台职业学院", "ytvc.com.cn"),
    ("黄河水利职业技术学院", "yrp.edu.cn"),
    ("河南职业技术学院", "henanc.edu.cn"),
    ("郑州铁路职业技术学院", "zzrvtc.edu.cn"),
    ("武汉船舶职业技术学院", "wspc.edu.cn"),
    ("武汉职业技术学院", "wtc.edu.cn"),
    ("湖北职业技术学院", "hbvt.edu.cn"),
    ("湖南铁道职业技术学院", "traintalent.edu.cn"),
    ("湖南交通职业技术学院", "hnjtzy.com"),
    ("湖南生物机电职业技术学院", "hncavtc.edu.cn"),
    ("广州民航职业技术学院", "caac.net"),
    ("广州番禺职业技术学院", "gzpyp.edu.cn"),
    ("深圳职业技术学院", "szpt.edu.cn"),
    ("深圳信息职业技术学院", "sziit.edu.cn"),
    ("广东轻工职业技术学院", "gdqt.edu.cn"),
    ("广东职业技术学院", "gdpoly.edu.cn"),
    ("广东水利电力职业技术学院", "gdsdxy.edu.cn"),
    ("广西职业技术学院", "gxzjy.edu.cn"),
    ("柳州职业技术学院", "lzzy.net"),
    ("重庆工业职业技术学院", "cqipc.edu.cn"),
    ("重庆工程职业技术学院", "cqvie.edu.cn"),
    ("四川工程职业技术学院", "scetc.edu.cn"),
    ("四川建筑职业技术学院", "satcm.edu.cn"),
    ("四川交通职业技术学院", "svtcc.edu.cn"),
    ("昆明冶金高等专科学校", "kmyz.edu.cn"),
    ("云南机电职业技术学院", "ynmec.edu.cn"),
    ("陕西工业职业技术学院", "sxpi.edu.cn"),
    ("杨凌职业技术学院", "ylvtc.cn"),
    ("西安航空职业技术学院", "xihang.edu.cn"),
    ("甘肃林业职业技术学院", "gszy.edu.cn"),
    ("酒泉职业技术学院", "jqzy.edu.cn"),
    ("青海畜牧兽医职业技术学院", "qhxm.edu.cn"),
    ("宁夏职业技术学院", "nxtu.edu.cn"),
    ("新疆农业职业技术学院", "xjnzy.edu.cn"),
    ("克拉玛依职业技术学院", "klmytc.edu.cn"),
    
    # B档（后141所）
    ("天津交通职业学院", "jtxy.edu.cn"),
    ("天津滨海职业学院", "bhpc.edu.cn"),
    ("天津现代职业技术学院", "xdzy.edu.cn"),
    ("天津电子信息职业技术学院", "tjemi.edu.cn"),
    ("河北化工医药职业技术学院", "hbcp.edu.cn"),
    ("河北交通职业技术学院", "hejt.edu.cn"),
    ("山西机电职业技术学院", "sxmt.edu.cn"),
    ("山西煤炭职业技术学院", "sxmec.edu.cn"),
    ("内蒙古机电职业技术学院", "imgem.edu.cn"),
    ("包头职业技术学院", "bttc.edu.cn"),
    ("辽宁石化职业技术学院", "lnpct.edu.cn"),
    ("辽宁轨道交通职业学院", "lrcp.edu.cn"),
    ("沈阳职业技术学院", "vtcsy.com"),
    ("大连职业技术学院", "dlvtc.edu.cn"),
    ("吉林工业职业技术学院", "jvcit.edu.cn"),
    ("吉林电子信息职业技术学院", "jltc.edu.cn"),
    ("黑龙江建筑职业技术学院", "hcc.net.cn"),
    ("黑龙江生态工程职业学院", "hljsgdx.edu.cn"),
    ("上海出版印刷高等专科学校", "sppc.edu.cn"),
    ("上海城建职业学院", "suc.edu.cn"),
    ("上海农林职业技术学院", "shafc.edu.cn"),
    ("上海工艺美术职业学院", "sada.edu.cn"),
    ("苏州职业大学", "jssvc.edu.cn"),
    ("南通航运职业技术学院", "tsc.edu.cn"),
    ("江苏建筑职业技术学院", "jsjzi.edu.cn"),
    ("江苏工程职业技术学院", "jgcet.edu.cn"),
    ("江苏食品药品职业技术学院", "jsfpc.edu.cn"),
    ("淮安信息职业技术学院", "hcit.edu.cn"),
    ("徐州工业职业技术学院", "xzgy.edu.cn"),
    ("浙江工商职业技术学院", "zjbti.edu.cn"),
    ("浙江机电设备调剂职业技术学院", "zjptc.edu.cn"),
    ("浙江工业职业技术学院", "zygxy.edu.cn"),
    ("浙江建设职业技术学院", "zjjc.edu.cn"),
    ("台州职业技术学院", "tzpt.edu.cn"),
    ("嘉兴职业技术学院", "jxvtc.edu.cn"),
    ("湖州职业技术学院", "hzu.edu.cn"),
    ("绍兴职业技术学院", "sxvt.edu.cn"),
    ("衢州职业技术学院", "qzvtc.edu.cn"),
    ("丽水职业技术学院", "lszjy.edu.cn"),
    ("安徽水利水电职业技术学院", "ahsdzy.edu.cn"),
    ("安徽商贸职业技术学院", "abc.edu.cn"),
    ("安徽交通职业技术学院", "ahcti.edu.cn"),
    ("安徽工业经济职业技术学院", "ahiec.edu.cn"),
    ("铜陵职业技术学院", "tlpt.edu.cn"),
    ("淮南职业技术学院", "hnvc.edu.cn"),
    ("福州职业技术学院", "fzyg.edu.cn"),
    ("福建林业职业技术学院", "fjlzy.com"),
    ("福建农业职业技术学院", "fnxy.edu.cn"),
    ("福建轻工职业学院", "flqc.edu.cn"),
    ("闽西职业技术学院", "mxdx.edu.cn"),
    ("闽江师范高等专科学校", "mjs.edu.cn"),
    ("江西财经职业学院", "jxcy.edu.cn"),
    ("江西环境工程职业学院", "jxhyedu.net"),
    ("江西电力职业技术学院", "jxeepc.edu.cn"),
    ("江西制造职业技术学院", "jxmtc.edu.cn"),
    ("江西旅游商贸职业学院", "jltmys.edu.cn"),
    ("山东畜牧兽医职业学院", "sxmx.edu.cn"),
    ("山东劳动职业技术学院", "sdlvtc.edu.cn"),
    ("莱芜职业技术学院", "lwvtc.edu.cn"),
    ("济宁职业技术学院", "jnvtc.edu.cn"),
    ("泰山职业技术学院", "tszy.edu.cn"),
    ("威海职业学院", "whvc.edu.cn"),
    ("日照职业技术学院", "rzpt.edu.cn"),
    ("临沂职业学院", "lyzy.edu.cn"),
    ("德州科技职业学院", "dzkj.edu.cn"),
    ("聊城职业技术学院", "lcpt.edu.cn"),
    ("滨州职业学院", "bzpt.edu.cn"),
    ("菏泽职业学院", "hzvtc.edu.cn"),
    ("郑州电力高等专科学校", "zepc.edu.cn"),
    ("河南工业和信息化职业学院", "hciit.edu.cn"),
    ("河南农业职业学院", "hnnzy.edu.cn"),
    ("河南经贸职业学院", "hnevc.edu.cn"),
    ("河南交通职业技术学院", "hncp.edu.cn"),
    ("黄河水利职业技术学院", "yrp.edu.cn"),
    ("开封大学", "kfu.edu.cn"),
    ("焦作大学", "jzudx.edu.cn"),
    ("三门峡职业技术学院", "smxzy.edu.cn"),
    ("平顶山工业职业技术学院", "pdsgy.edu.cn"),
    ("商丘职业技术学院", "sqzy.edu.cn"),
    ("武汉铁路职业技术学院", "wtcu.edu.cn"),
    ("武汉软件工程职业学院", "wseei.edu.cn"),
    ("武汉电力职业技术学院", "whdl.edu.cn"),
    ("湖北工业建筑职业技术学院", "hbcgy.edu.cn"),
    ("鄂州职业大学", "ezvtc.edu.cn"),
    ("荆州理工职业学院", "jzlg.edu.cn"),
    ("黄冈职业技术学院", "hgnu.edu.cn"),
    ("武汉商贸职业学院", "whicu.edu.cn"),
    ("湖南工业职业技术学院", "hnhy.edu.cn"),
    ("湖南科技职业学院", "hnst.edu.cn"),
    ("湖南工艺美术职业学院", "hnada.edu.cn"),
    ("湖南商务职业技术学院", "hnswxy.edu.cn"),
    ("湖南邮电职业技术学院", "hnyc.edu.cn"),
    ("湖南机电职业技术学院", "hnmec.edu.cn"),
    ("湖南汽车工程职业学院", "hnqe.edu.cn"),
    ("湖南城建职业技术学院", "hunanjc.edu.cn"),
    ("湖南电气职业技术学院", "hndqxy.edu.cn"),
    ("湖南现代物流职业技术学院", "hnwlxy.edu.cn"),
    ("长沙航空职业技术学院", "cavtc.cn"),
    ("长沙环境保护职业技术学院", "csupe.edu.cn"),
    ("湖南安全技术职业学院", "csist.edu.cn"),
    ("常德职业技术学院", "cdzy.cn"),
    ("岳阳职业技术学院", "yyszy.edu.cn"),
    ("永州职业技术学院", "yzvtc.edu.cn"),
    ("娄底职业技术学院", "ldxy.edu.cn"),
    ("怀化职业技术学院", "hhvtc.edu.cn"),
    ("广东科学技术职业学院", "gdkust.edu.cn"),
    ("广东机电职业技术学院", "gdmec.edu.cn"),
    ("广东岭南职业技术学院", "gdlnlxy.edu.cn"),
    ("广东工商职业技术大学", "gdbt.edu.cn"),
    ("广州铁路职业技术学院", "gtxy.edu.cn"),
    ("广州市工贸技师学院", "gtxy.cn"),
    ("广州城市职业学院", "gzcp.edu.cn"),
    ("广州工程技术职业学院", "gzjsxy.cn"),
    ("珠海城市职业技术学院", "zhcpt.edu.cn"),
    ("东莞职业技术学院", "dgpt.edu.cn"),
    ("中山火炬职业技术学院", "zstp.edu.cn"),
    ("江门职业技术学院", "jmpt.edu.cn"),
    ("佛山职业技术学院", "fspt.edu.cn"),
    ("广东财贸职业学院", "gdcmxy.edu.cn"),
    ("广西建设职业技术学院", "gxjsxy.edu.cn"),
    ("广西交通职业技术学院", "gxjy.edu.cn"),
    ("广西机电职业技术学院", "gxmec.edu.cn"),
    ("广西工业职业技术学院", "gxgxxy.edu.cn"),
    ("贵州交通职业技术学院", "gzjzy.edu.cn"),
    ("贵州航天职业技术学院", "gzhtzy.edu.cn"),
    ("贵州电子信息职业技术学院", "gzeic.edu.cn"),
    ("云南交通职业技术学院", "ynvtc.edu.cn"),
    ("云南能源职业技术学院", "yncngczy.edu.cn"),
    ("云南国防工业职业技术学院", "yngfxy.edu.cn"),
    ("云南机电职业技术学院", "ynmec.edu.cn"),
    ("重庆电子工程职业学院", "cqcet.edu.cn"),
    ("重庆城市管理职业学院", "cqcmc.edu.cn"),
    ("重庆工商职业学院", "cqtc.edu.cn"),
    ("重庆三峡职业学院", "cqnx.edu.cn"),
    ("重庆三峡医药高等专科学校", "sqyygz.edu.cn"),
    ("四川邮电职业技术学院", "scppc.edu.cn"),
    ("四川机电职业技术学院", "scmec.edu.cn"),
    ("四川化工职业技术学院", "schem.edu.cn"),
    ("四川矿山冶金职业学院", "skymc.edu.cn"),
    ("四川科技职业学院", "scst.edu.cn"),
    ("四川商务职业学院", "scswxy.edu.cn"),
    ("四川中医药高等专科学校", "scctcm.edu.cn"),
    ("贵阳职业技术学院", "gzvtc.edu.cn"),
    ("贵州轻工职业技术学院", "gzqy.edu.cn"),
    ("陕西铁路工程职业技术学院", "sxrtxy.edu.cn"),
    ("陕西国防工业职业技术学院", "gfxy.edu.cn"),
    ("陕西能源职业技术学院", "sxnyxy.edu.cn"),
    ("陕西航空职业技术学院", "sxhvtt.edu.cn"),
    ("西安铁路职业技术学院", "xatxy.edu.cn"),
    ("西安电力机械制造公司机电学院", "xapx.edu.cn"),
    ("西安职业技术学院", "xavtc.edu.cn"),
    ("西安科技商贸职业学院", "xksm.edu.cn"),
    ("陕西工商职业学院", "sgs.edu.cn"),
    ("甘肃工业职业技术学院", "gsgxy.edu.cn"),
    ("甘肃建筑职业技术学院", "gsjzy.edu.cn"),
    ("甘肃畜牧工程职业技术学院", "gsxgxy.edu.cn"),
    ("甘肃机电职业技术学院", "gsjdcxy.edu.cn"),
    ("青海交通职业技术学院", "qhjtc.edu.cn"),
    ("青海建筑职业技术学院", "qhjsc.edu.cn"),
    ("宁夏民族职业技术学院", "nxmzxy.edu.cn"),
    ("新疆轻工职业技术学院", "xjqg.edu.cn"),
    ("新疆石河子职业技术学院", "xjszxy.edu.cn"),
    ("新疆生产建设兵团兴新职业技术学院", "btexu.edu.cn"),
]

# URL模式
URL_PATTERNS = [
    "https://job.{domain}",
    "https://career.{domain}",
    "https://jy.{domain}",
    "https://job.{domain}/index.html",
    "https://career.{domain}/index.html",
]


def check_url(url: str, timeout: int = 5) -> Tuple[bool, int]:
    """检查URL是否可访问"""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Method": "HEAD"
            }
        )
        response = urllib.request.urlopen(req, timeout=timeout)
        return True, response.status
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception:
        return False, 0


def generate_urls(domain: str) -> List[str]:
    """生成可能的URL列表"""
    urls = []
    for pattern in URL_PATTERNS:
        urls.append(pattern.format(domain=domain))
    return urls


def scan_college(name: str, domain: str) -> Optional[str]:
    """检测学校就业网URL"""
    urls = generate_urls(domain)
    
    print(f"  检测 {name}...", end=" ", flush=True)
    
    for url in urls:
        available, status = check_url(url)
        if available and status == 200:
            print(f"✓ ({status})")
            return url
        time.sleep(0.2)  # 避免请求过快
    
    print("✗")
    return None


def save_to_json(results: List[dict], filename: str = "vocational_sources.json"):
    """保存到JSON文件"""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n✓ 已保存到 {filename}")


def save_to_sqlite(results: List[dict], db_path: str):
    """保存到SQLite数据库"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建表（如果不存在）
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Source (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            type TEXT DEFAULT 'VOCATIONAL',
            parserType TEXT DEFAULT 'UNIVERSAL',
            crawlInterval INTEGER DEFAULT 360,
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    count = 0
    for source in results:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO Source (name, url, type, parserType, crawlInterval)
                VALUES (?, ?, 'VOCATIONAL', 'UNIVERSAL', 360)
            """, (source["name"], source["url"]))
            if cursor.rowcount > 0:
                count += 1
        except Exception as e:
            print(f"  错误: {e}")
    
    conn.commit()
    conn.close()
    print(f"\n✓ 已写入数据库 {count} 条记录")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="双高计划高职院校就业网自动发现")
    parser.add_argument("--save", action="store_true", help="保存到SQLite数据库")
    parser.add_argument("--json", action="store_true", help="保存到JSON文件")
    parser.add_argument("--dry-run", action="store_true", help="仅测试不保存")
    parser.add_argument("--limit", type=int, default=0, help="限制检测数量(用于测试)")
    args = parser.parse_args()
    
    colleges = VOCATIONAL_COLLEGES[:args.limit] if args.limit else VOCATIONAL_COLLEGES
    
    print("=" * 60)
    print("双高计划高职院校就业网自动发现")
    print("=" * 60)
    print(f"待检测学校数: {len(colleges)}")
    print()
    
    results = []
    
    for i, (name, domain) in enumerate(colleges):
        print(f"[{i+1}/{len(colleges)}]", end=" ")
        url = scan_college(name, domain)
        
        if url:
            results.append({
                "name": f"{name} 就业网",
                "url": url,
                "type": "VOCATIONAL",
                "parserType": "UNIVERSAL"
            })
    
    # 统计
    print()
    print("=" * 60)
    print("扫描结果")
    print("=" * 60)
    print(f"检测总数: {len(colleges)}")
    print(f"发现URL: {len(results)}")
    print(f"未发现: {len(colleges) - len(results)}")
    print(f"成功率: {len(results)/len(colleges)*100:.1f}%")
    print()
    
    if results:
        print("发现的URL:")
        for r in results:
            print(f"  • {r['name']}: {r['url']}")
        print()
    
    if args.dry_run:
        print("(dry-run 模式，未保存)")
        return
    
    if args.save:
        db_path = os.environ.get("DATABASE_URL", "").replace("file:", "")
        if not db_path or db_path == "prisma/dev.db":
            db_path = "prisma/dev.db"
        save_to_sqlite(results, db_path)
    
    if args.json or not args.save:
        save_to_json(results)


if __name__ == "__main__":
    main()
