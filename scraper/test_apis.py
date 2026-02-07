"""
Test script to verify NSE API and data sources
Run this locally to test before deploying to GitHub Actions
"""

import requests
import time
from datetime import datetime

def test_nse_api(symbol: str):
    """Test NSE India API"""
    print(f"\n{'='*60}")
    print(f"Testing NSE API for {symbol}")
    print(f"{'='*60}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.nseindia.com/',
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        session = requests.Session()
        
        # Get cookies
        print("⏳ Getting cookies from NSE homepage...")
        session.get('https://www.nseindia.com/', headers=headers, timeout=10)
        time.sleep(0.5)
        
        # Fetch stock data
        print(f"⏳ Fetching data for {symbol}...")
        api_url = f'https://www.nseindia.com/api/quote-equity?symbol={symbol}'
        response = session.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract key information
            price_info = data.get('priceInfo', {})
            current_price = price_info.get('lastPrice')
            open_price = price_info.get('open')
            high_price = price_info.get('intraDayHighLow', {}).get('max')
            low_price = price_info.get('intraDayHighLow', {}).get('min')
            prev_close = price_info.get('previousClose')
            change = price_info.get('change')
            pct_change = price_info.get('pChange')
            
            print(f"\n✅ SUCCESS! Data retrieved:")
            print(f"   Symbol: {symbol}")
            print(f"   Current Price: ₹{current_price:,.2f}")
            print(f"   Open: ₹{open_price:,.2f}")
            print(f"   High: ₹{high_price:,.2f}")
            print(f"   Low: ₹{low_price:,.2f}")
            print(f"   Previous Close: ₹{prev_close:,.2f}")
            print(f"   Change: ₹{change:,.2f} ({pct_change:+.2f}%)")
            print(f"   Time: {datetime.now().strftime('%I:%M:%S %p IST')}")
            
            return True
        else:
            print(f"❌ FAILED! Status code: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


import yfinance as yf

def get_request_session():
    """Create a session with robust headers"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    return session

def test_yahoo_finance(symbol: str):
    """Test Yahoo Finance API using yfinance library with custom session"""
    print(f"\n{'='*60}")
    print(f"Testing Yahoo Finance (via yfinance) for {symbol}")
    print(f"{'='*60}")
    
    try:
        print(f"⏳ Fetching data for {symbol}.NS...")
        ticker_symbol = f"{symbol}.NS"
        
        # Use custom session to prevent 403/Blocking
        session = get_request_session()
        stock = yf.Ticker(ticker_symbol, session=session)
        
        # Fast fetch using history
        data = stock.history(period="1d")
        
        if not data.empty:
            current_price = data['Close'].iloc[-1]
            open_price = data['Open'].iloc[-1]
            high_price = data['High'].iloc[-1]
            low_price = data['Low'].iloc[-1]
            
            print(f"\n✅ SUCCESS! Data retrieved:")
            print(f"   Symbol: {ticker_symbol}")
            print(f"   Current Price: ₹{current_price:,.2f}")
            print(f"   Open: ₹{open_price:,.2f}")
            print(f"   High: ₹{high_price:,.2f}")
            print(f"   Low: ₹{low_price:,.2f}")
            print(f"   Note: Data has ~15 min delay")
            
            return True
        else:
            print(f"❌ FAILED! No data returned for {ticker_symbol}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_google_finance(symbol: str):
    """Test Google Finance Scraping"""
    print(f"\n{'='*60}")
    print(f"Testing Google Finance for {symbol}")
    print(f"{'='*60}")
    
    try:
        print(f"⏳ Fetching data for {symbol}:NSE...")
        url = f"https://www.google.com/finance/quote/{symbol}:NSE"
        
        session = get_request_session()
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # The price class on Google Finance is usually "YMlKec fxKbKc"
            price_div = soup.find('div', class_='YMlKec fxKbKc')
            
            if price_div:
                price_text = price_div.text.replace('₹', '').replace(',', '').strip()
                price = float(price_text)
                print(f"\n✅ SUCCESS! Data retrieved:")
                print(f"   Symbol: {symbol}:NSE")
                print(f"   Current Price: ₹{price:,.2f}")
                return True
            else:
                print("❌ FAILED! Price div not found")
                return False
        else:
            print(f"❌ FAILED! Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_discord_webhook(webhook_url: str):
    """Test Discord webhook"""
    print(f"\n{'='*60}")
    print("Testing Discord Webhook")
    print(f"{'='*60}")
    
    if not webhook_url:
        print("⚠️ No Webhook URL provided (Set DISCORD_TEST_WEBHOOK). Skipping.")
        return False
        
    try:
        print("⏳ Sending test message...")
        payload = {
            "embeds": [{
                "title": "✅ Test Alert",
                "description": "This is a test message from Market Alerts System.",
                "color": 51281, # Green
                "fields": [
                    {"name": "Status", "value": "Operational", "inline": True},
                    {"name": "Time", "value": datetime.now().strftime("%I:%M %p"), "inline": True}
                ]
            }]
        }
        
        response = requests.post(webhook_url, json=payload, timeout=10)
        
        if response.status_code in [200, 204]:
            print("✅ SUCCESS! Message sent to Discord.")
            return True
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def main():
    print("\n" + "="*60)
    print("🧪 MARKET ALERTS SYSTEM - API TEST SUITE")
    print("="*60)
    
    # Test stocks
    test_stocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK']
    
    print(f"\nTesting with stocks: {', '.join(test_stocks)}")
    
    # Test NSE API
    print("\n" + "🔵 PHASE 1: NSE API TESTS" + "\n")
    nse_results = []
    for stock in test_stocks:
        result = test_nse_api(stock)
        nse_results.append(result)
        time.sleep(1)  # Delay between requests
    
    # Test Yahoo Finance
    print("\n" + "🟡 PHASE 2: YAHOO FINANCE TESTS" + "\n")
    yahoo_results = []
    for stock in test_stocks[:2]:  # Test only 2 stocks
        result = test_yahoo_finance(stock)
        yahoo_results.append(result)
        result = test_yahoo_finance(stock)
        yahoo_results.append(result)
        time.sleep(1)

    # Test Google Finance
    print("\n" + "🟣 PHASE 3: GOOGLE FINANCE TESTS" + "\n")
    google_results = []
    for stock in test_stocks[:2]:  # Test only 2 stocks
        result = test_google_finance(stock)
        google_results.append(result)
        time.sleep(1)
    
    # Test Discord Webhook
    print("\n" + "🟢 PHASE 4: DISCORD WEBHOOK TEST" + "\n")
    import os
    discord_webhook = os.environ.get('DISCORD_TEST_WEBHOOK')
    webhook_result = test_discord_webhook(discord_webhook)
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    nse_success = sum(nse_results)
    nse_total = len(nse_results)
    print(f"NSE API: {nse_success}/{nse_total} passed ({nse_success/nse_total*100:.0f}%)")
    
    yahoo_success = sum(yahoo_results)
    yahoo_total = len(yahoo_results)
    print(f"Yahoo Finance: {yahoo_success}/{yahoo_total} passed ({yahoo_success/yahoo_total*100:.0f}%)")
    
    google_success = sum(google_results)
    google_total = len(google_results)
    print(f"Google Finance: {google_success}/{google_total} passed ({google_success/google_total*100:.0f}%)")
    
    print(f"Discord Webhook: {'✅ Passed' if webhook_result else '⚠️ Skipped (No URL)' if not discord_webhook else '❌ Failed'}")
    
    # Overall status
    all_passed = all(nse_results) and all(yahoo_results) and webhook_result
    
    print("\n" + "="*60)
    if all_passed:
        print("✅ ALL TESTS PASSED! System is ready to deploy.")
    else:
        print("⚠️  SOME TESTS FAILED! Check errors above.")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
