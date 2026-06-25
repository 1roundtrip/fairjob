from sqlalchemy.orm import Session
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate
from typing import List, Optional, Tuple


class JobService:
    @staticmethod
    def get_job(db: Session, job_id: int) -> Optional[Job]:
        return db.query(Job).filter(Job.id == job_id).first()

    @staticmethod
    def get_job_by_url(db: Session, source_url: str) -> Optional[Job]:
        return db.query(Job).filter(Job.source_url == source_url).first()

    @staticmethod
    def list_jobs(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        source: Optional[str] = None,
    ) -> Tuple[List[Job], int]:
        query = db.query(Job)

        if keyword:
            query = query.filter(
                (Job.title.like(f"%{keyword}%")) |
                (Job.company.like(f"%{keyword}%"))
            )
        if location:
            query = query.filter(Job.location.like(f"%{location}%"))
        if source:
            query = query.filter(Job.source == source)

        total = query.count()
        items = query.order_by(Job.published_at.desc(), Job.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def create_job(db: Session, job_in: JobCreate) -> Job:
        existing = JobService.get_job_by_url(db, job_in.source_url)
        if existing:
            return existing
        db_job = Job(**job_in.model_dump())
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job

    @staticmethod
    def update_job(db: Session, job_id: int, job_in: JobUpdate) -> Optional[Job]:
        db_job = JobService.get_job(db, job_id)
        if not db_job:
            return None
        update_data = job_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_job, field, value)
        db.commit()
        db.refresh(db_job)
        return db_job

    @staticmethod
    def delete_job(db: Session, job_id: int) -> bool:
        db_job = JobService.get_job(db, job_id)
        if not db_job:
            return False
        db.delete(db_job)
        db.commit()
        return True

    @staticmethod
    def batch_create_jobs(db: Session, jobs: List[JobCreate]) -> int:
        count = 0
        for job_in in jobs:
            existing = JobService.get_job_by_url(db, job_in.source_url)
            if not existing:
                db_job = Job(**job_in.model_dump())
                db.add(db_job)
                count += 1
        db.commit()
        return count
