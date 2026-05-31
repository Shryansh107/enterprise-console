from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=3, max_length=30)
    price: float = Field(..., gt=0.0, description="Product price must be greater than 0")
    quantity_in_stock: int = Field(..., ge=0, description="Quantity in stock cannot be negative")

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        # standard alphanumeric + dash check
        clean = v.strip().upper()
        if not clean.isalnum() and "-" not in clean and "_" not in clean:
            raise ValueError("SKU must contain only alphanumeric characters, dashes, or underscores")
        return clean


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=3, max_length=30)
    price: Optional[float] = Field(None, gt=0.0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip().upper()
        if not clean.isalnum() and "-" not in clean and "_" not in clean:
            raise ValueError("SKU must contain only alphanumeric characters, dashes, or underscores")
        return clean


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
