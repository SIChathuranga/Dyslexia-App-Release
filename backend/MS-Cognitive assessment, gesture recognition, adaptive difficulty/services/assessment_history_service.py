import logging
from sqlalchemy.orm import Session

from models import AssessmentHistory, User
from schemas import AssessmentHistoryRequest, AssessmentHistoryResponse, AssessmentHistoryDTO
from utils import Constant, RequestStatus, ResponseCodes, get_message

logger = logging.getLogger(__name__)


class AssessmentHistoryService:

    def save_assessment(self, request: AssessmentHistoryRequest, db: Session) -> AssessmentHistoryResponse:
        response = AssessmentHistoryResponse()

        user = db.query(User).filter(
            User.id == request.user_id,
            User.is_deleted == Constant.DB_FALSE
        ).first()

        if not user:
            response.status = RequestStatus.FAILURE
            response.response_code = ResponseCodes.USER_NOT_FOUND_FOR_ASSESSMENT
            response.message = get_message(ResponseCodes.USER_NOT_FOUND_FOR_ASSESSMENT)
            return response

        try:
            assessment = AssessmentHistory(
                user_id=request.user_id,
                accuracy=request.accuracy,
                completion_rate=request.completion_rate,
                response_time=request.response_time,
                satisfaction_score=request.satisfaction_score,
                assessment_date=request.assessment_date,
                assessment_type=request.assessment_type,
                notes=request.notes,
                is_deleted=Constant.DB_FALSE
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

            response.assessment = AssessmentHistoryDTO.model_validate(assessment)
            response.status = RequestStatus.SUCCESS
            response.response_code = ResponseCodes.ASSESSMENT_SAVE_SUCCESS
            response.message = get_message(ResponseCodes.ASSESSMENT_SAVE_SUCCESS)

        except Exception as e:
            logger.error("Error saving assessment: %s", str(e))
            db.rollback()
            response.status = RequestStatus.FAILURE
            response.response_code = ResponseCodes.ASSESSMENT_SAVE_FAILURE
            response.message = get_message(ResponseCodes.ASSESSMENT_SAVE_FAILURE)

        return response

    def get_assessment_history(self, request: AssessmentHistoryRequest, db: Session) -> AssessmentHistoryResponse:
        response = AssessmentHistoryResponse()

        query = db.query(AssessmentHistory).filter(
            AssessmentHistory.user_id == request.user_id,
            AssessmentHistory.is_deleted == Constant.DB_FALSE
        )

        if request.from_date:
            query = query.filter(AssessmentHistory.assessment_date >= request.from_date)
        if request.to_date:
            query = query.filter(AssessmentHistory.assessment_date <= request.to_date)

        page = request.page or 0
        size = request.size or 10
        assessments = query.offset(page * size).limit(size).all()

        response.assessments = [AssessmentHistoryDTO.model_validate(a) for a in assessments]
        response.status = RequestStatus.SUCCESS
        response.response_code = ResponseCodes.ASSESSMENT_FETCH_SUCCESS
        response.message = get_message(ResponseCodes.ASSESSMENT_FETCH_SUCCESS)

        return response


assessment_history_service = AssessmentHistoryService()
