import logging
import os
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv
from spiders.demo_spider import DemoSpider
import httpx

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend:8000/api/v1")
SCRAPE_INTERVAL_MINUTES = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "60"))


def run_scrape_task():
    logger.info("=" * 50)
    logger.info("开始执行抓取任务")
    logger.info("=" * 50)

    spiders = [DemoSpider()]
    total_count = 0

    for spider in spiders:
        try:
            logger.info(f"运行爬虫: {spider.name}")
            jobs = spider.scrape()
            if jobs:
                saved_count = save_to_backend(jobs)
                total_count += saved_count
                logger.info(f"爬虫 {spider.name} 保存 {saved_count} 条新数据")
        except Exception as e:
            logger.error(f"爬虫 {spider.name} 执行失败: {e}", exc_info=True)

    logger.info(f"抓取任务完成，共新增 {total_count} 条职位数据")
    logger.info("=" * 50)


def save_to_backend(jobs):
    saved_count = 0
    try:
        with httpx.Client(timeout=30) as client:
            for job in jobs:
                try:
                    response = client.post(f"{BACKEND_API_URL}/jobs", json=job)
                    if response.status_code in [200, 201]:
                        saved_count += 1
                    else:
                        logger.warning(f"保存职位失败: {response.status_code} - {response.text}")
                except Exception as e:
                    logger.error(f"保存单条数据失败: {e}")
    except Exception as e:
        logger.error(f"连接后端 API 失败: {e}")
    return saved_count


def start_scheduler():
    scheduler = BlockingScheduler(timezone="Asia/Shanghai")

    scheduler.add_job(
        run_scrape_task,
        trigger=IntervalTrigger(minutes=SCRAPE_INTERVAL_MINUTES),
        id="scrape_job",
        name="定时抓取任务",
        replace_existing=True,
        next_run_time=None,
    )

    logger.info(f"调度器已启动，抓取间隔: {SCRAPE_INTERVAL_MINUTES} 分钟")
    logger.info("首次抓取将在启动后立即执行...")

    import threading
    threading.Thread(target=run_scrape_task, daemon=True).start()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("调度器已停止")


if __name__ == "__main__":
    start_scheduler()
