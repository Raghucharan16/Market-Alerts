import requests
import logging
from typing import Optional

log = logging.getLogger(__name__)

def search_symbol(query: str) -> Optional[str]:
    """
    Search for a stock symbol on Yahoo Finance using the company name.
    Prioritizes NSE (.NS) and BSE (.BO) symbols.
    """
    try:
        # Yahoo Finance Auto-Complete API
        url = "https://query1.finance.yahoo.com/v1/finance/search"
        params = {
            'q': query,
            'quotesCount': 5,
            'newsCount': 0,
            'enableFuzzyQuery': 'false',
            'quotesQueryId': 'tss_match_phrase_query'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

        response = requests.get(url, params=params, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            quotes = data.get('quotes', [])
            
            # 1. Look for NSE symbol first
            for quote in quotes:
                symbol = quote.get('symbol', '')
                if symbol.endswith('.NS'):
                    log.info(f"Resolved '{query}' to NSE symbol: {symbol}")
                    return symbol
            
            # 2. Look for BSE symbol
            for quote in quotes:
                symbol = quote.get('symbol', '')
                if symbol.endswith('.BO'):
                    log.info(f"Resolved '{query}' to BSE symbol: {symbol}")
                    return symbol

            # 3. Return first available if any (fallback)
            if quotes:
                symbol = quotes[0].get('symbol')
                log.info(f"Resolved '{query}' to generic symbol: {symbol}")
                return symbol
                
            log.warning(f"No matching symbols found for '{query}'")
            return None
            
    except Exception as e:
        log.error(f"Error searching symbol for '{query}': {e}")
        return None
