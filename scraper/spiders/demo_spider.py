from spiders.base import BaseSpider
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class DemoSpider(BaseSpider):
    name = "demo"
    base_url = "https://example.com"

    def scrape(self, keyword: str = "", location: str = "", page: int = 1) -> List[Dict]:
        logger.info(f"[DemoSpider] 开始抓取: keyword={keyword}, location={location}, page={page}")
        demo_jobs = [
            {
                "title": "Python 后端开发工程师",
                "company": "示例科技有限公司",
                "location": "北京",
                "salary": "25K-40K",
                "salary_min": 25000,
                "salary_max": 40000,
                "description": "负责后端服务开发，使用 Python FastAPI 框架。",
                "requirements": "3年以上 Python 开发经验，熟悉 FastAPI/Django。",
                "source": self.name,
                "source_url": f"https://example.com/job/demo1-{page}",
                "job_type": "全职",
                "experience": "3-5年",
                "education": "本科",
                "published_at": None,
            },
            {
                "title": "前端开发工程师 (React)",
                "company": "示例网络科技",
                "location": "上海",
                "salary": "20K-35K",
                "salary_min": 20000,
                "salary_max": 35000,
                "description": "负责公司 Web 产品前端开发，使用 React + Tailwind。",
                "requirements": "2年以上 React 开发经验，熟悉 TypeScript。",
                "source": self.name,
                "source_url": f"https://example.com/job/demo2-{page}",
                "job_type": "全职",
                "experience": "1-3年",
                "education": "本科",
                "published_at": None,
            },
        ]
        logger.info(f"[DemoSpider] 抓取完成，共 {len(demo_jobs)} 条数据")
        return demo_jobs
