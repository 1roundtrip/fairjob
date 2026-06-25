from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class JobBase(BaseModel):
    title: str = Field(..., description="职位名称")
    company: str = Field(..., description="公司名称")
    location: Optional[str] = Field(None, description="工作地点")
    salary: Optional[str] = Field(None, description="薪资")
    salary_min: Optional[float] = Field(None, description="最低薪资")
    salary_max: Optional[float] = Field(None, description="最高薪资")
    description: Optional[str] = Field(None, description="职位描述")
    requirements: Optional[str] = Field(None, description="任职要求")
    source: Optional[str] = Field(None, description="来源平台")
    source_url: str = Field(..., description="来源链接")
    job_type: Optional[str] = Field(None, description="工作类型")
    experience: Optional[str] = Field(None, description="工作经验")
    education: Optional[str] = Field(None, description="学历要求")
    published_at: Optional[datetime] = Field(None, description="发布时间")


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    job_type: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    published_at: Optional[datetime] = None


class JobResponse(JobBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    total: int
    items: List[JobResponse]
    page: int
    page_size: int
