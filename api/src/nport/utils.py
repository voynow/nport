import os

import requests
from nport.types import Holding, NPortResponse


def get_nport_filing(cik: str) -> dict:
    """
    Get the N-Port filing for a given CIK

    :param cik: The Central Index Key (CIK) of the filer (e.g., "0000884394" for SPY)
    :return: A dictionary containing the N-Port filing data
    """
    json_payload = {
        "query": f"filerInfo.filer.issuerCredentials.cik:{cik}",
        "from": "0",
        "size": "1",
        "sort": [{"filedAt": {"order": "desc"}}],
    }
    response = requests.post(
        url=f"https://api.sec-api.io/form-nport?token={os.environ['SEC_API_KEY']}",
        json=json_payload,
    )
    response.raise_for_status()
    return response.json()


def clean_nport_response(data):
    """
    Clean the N-Port filing response

    :param data: The N-Port filing response
    :return: A dictionary containing the cleaned N-Port filing data
    """
    filings = data["filings"][0]
    return NPortResponse(
        regName=filings["genInfo"]["regName"],
        holdings=[Holding(**holding) for holding in filings["invstOrSecs"]],
    )
