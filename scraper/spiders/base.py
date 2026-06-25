from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BaseSpider(ABC):
    name: str = "base"
    base_url: str = ""

    def __init__(self):
        self.session = None

    @abstractmethod
    def scrape(self, keyword: str = "", location: str = "", page: int = 1) -> List[Dict]:
        pass

    def parse_salary(self, salary_str: str) -> Dict[str, Optional[float]]:
        result = {"salary_min": None, "salary_max": None}
        if not salary_str:
            return result
        try:
            salary_str = salary_str.replace("K", "000").replace("k", "000").replace("万", "0000")
            if "-" in salary_str:
                parts = salary_str.split("-")
                if len(parts) == 2:
                    min_val = float(''.join(filter(str.isdigit, parts[0])))
                    max_val = float(''.join(filter(str.isdigit, parts[1])))
                    result["salary_min"] = min_val
                    result["salary_max"] = max_val
        except (ValueError, IndexError):
            pass
        return result

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        return " ".join(text.split()).strip()
