from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(100))
    salary = Column(String(100))
    salary_min = Column(Float)
    salary_max = Column(Float)
    description = Column(Text)
    requirements = Column(Text)
    source = Column(String(50), index=True)
    source_url = Column(String(500), unique=True)
    job_type = Column(String(50))
    experience = Column(String(100))
    education = Column(String(50))
    published_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
