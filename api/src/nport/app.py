import traceback

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nport.types import NPortResponse
from nport.utils import clean_nport_response, get_nport_filing

app = FastAPI(title="N-Port API", description="API for querying SEC N-Port filings")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://nport-drab.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/nport/{cik}", response_model=NPortResponse)
def get_recent_nport_filing(cik: str) -> NPortResponse:
    """
    Get the most recent N-Port filing for a given CIK

    :param cik: The Central Index Key (CIK) of the filer (e.g., "0000884394" for SPY)
    :return: A dictionary containing the metadata of the most recent N-Port filing
    """
    try:
        data = get_nport_filing(cik=cik)
    except requests.exceptions.RequestException as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch N-Port filing: {e}"
        )

    try:
        return clean_nport_response(data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
