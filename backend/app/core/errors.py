import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class BusinessException(Exception):
    """Base class for custom business/domain logic errors"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class EntityNotFoundException(BusinessException):
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class InsufficientStockException(BusinessException):
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)


class DuplicateEntityException(BusinessException):
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


def setup_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(BusinessException)
    async def business_exception_handler(request: Request, exc: BusinessException):
        logger.warning(f"Business Exception on {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        logger.error(f"Database Integrity Error on {request.url.path}: {str(exc)}")
        
        # Parse error message for unique constraints (SKU, Email)
        error_msg = str(exc.orig).lower() if exc.orig else ""
        detail = "A database constraint was violated."
        
        if "sku" in error_msg:
            detail = "Product SKU already exists. SKU must be unique."
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"detail": detail}
            )
        elif "email" in error_msg:
            detail = "Customer email already exists. Email must be unique."
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"detail": detail}
            )
            
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": detail}
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled Exception on {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred."}
        )
