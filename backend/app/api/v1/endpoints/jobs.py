from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.job import JobResponse, JobCreate, JobUpdate, JobListResponse
from app.services.job_service import JobService

router = APIRouter()


@router.get("", response_model=JobListResponse, summary="获取职位列表")
def list_jobs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    location: Optional[str] = Query(None, description="工作地点"),
    source: Optional[str] = Query(None, description="来源平台"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    items, total = JobService.list_jobs(db, skip=skip, limit=page_size, keyword=keyword, location=location, source=source)
    return JobListResponse(
        total=total,
        items=items,
        page=page,
        page_size=page_size,
    )


@router.get("/{job_id}", response_model=JobResponse, summary="获取职位详情")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job


@router.post("", response_model=JobResponse, summary="创建职位")
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    return JobService.create_job(db, job_in)


@router.put("/{job_id}", response_model=JobResponse, summary="更新职位")
def update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_db)):
    job = JobService.update_job(db, job_id, job_in)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job


@router.delete("/{job_id}", summary="删除职位")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    success = JobService.delete_job(db, job_id)
    if not success:
        raise HTTPException(status_code=404, detail="职位不存在")
    return {"message": "删除成功"}
