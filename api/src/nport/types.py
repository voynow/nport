from pydantic import BaseModel, Field


class Holding(BaseModel):
    name: str
    cusip: str
    balance: float
    value: float = Field(alias="valUSD")


class NPortResponse(BaseModel):
    regName: str
    holdings: list[Holding]
