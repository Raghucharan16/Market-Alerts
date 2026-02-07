import os
import time
import logging
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Dict, List
import yfinance as yf
from bs4 import BeautifulSoup

# Load env variables
load_dotenv()

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
if not url or not key:
    log.error("Supabase URL or Key not found in environment variables.")
    exit(1)

supabase: Client = create_client(url, key)

# Dashboard URL for acknowledgement links
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "http://localhost:3000")

# Alert cooldown period in minutes
ALERT_COOLDOWN_MINUTES = 60


def get_active_stocks() -> List[Dict]:
    """Fetch all active stocks from database"""
    try:
        # Fetch stocks and join with profiles to get their specific webhook
        # Note: 'profiles' is the table name, so the key in response will be 'profiles'
        response = supabase.table('stocks').select("*, profiles(discord_webhook)").eq('is_active', True).execute()
        return response.data
    except Exception as e:
        log.error(f"Error fetching stocks: {e}")
        return []


def get_nse_stock_price(symbol: str) -> Optional[float]:
    """
    Fetch current stock price from NSE India API
    This is much faster than Selenium scraping
    """
    try:
        # NSE requires specific headers to prevent blocking
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.nseindia.com/',
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        # First, get cookies by visiting the homepage
        session = requests.Session()
        session.get('https://www.nseindia.com/', headers=headers, timeout=10)
        time.sleep(0.5)  # Small delay to mimic human behavior
        
        # Now fetch the stock data
        api_url = f'https://www.nseindia.com/api/quote-equity?symbol={symbol}'
        response = session.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            # Extract current price (Last Traded Price)
            price = data.get('priceInfo', {}).get('lastPrice')
            if price:
                log.info(f"NSE API: {symbol} = ₹{price}")
                return float(price)
        else:
            log.warning(f"NSE API returned status {response.status_code} for {symbol}")
            
    except Exception as e:
        log.error(f"Error fetching NSE price for {symbol}: {e}")
    
    return None


def get_bse_stock_price(symbol: str) -> Optional[float]:
    """
    Fallback: Fetch stock price from BSE (if NSE fails)
    BSE has simpler API structure
    """
    try:
        # BSE API endpoint (this is a simplified example)
        # You may need to adjust based on actual BSE API
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Note: BSE might require stock code instead of symbol
        # This is a placeholder - adjust based on actual BSE API
        api_url = f'https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w?scripcode={symbol}&flag=0'
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            # Extract price from BSE response
            # Adjust this based on actual BSE API response structure
            price = data.get('CurrRate', {}).get('LTP')
            if price:
                log.info(f"BSE API: {symbol} = ₹{price}")
                return float(price)
                
    except Exception as e:
        log.error(f"Error fetching BSE price for {symbol}: {e}")
    
    return None


import yfinance as yf

# ... (previous functions remain the same)

def get_request_session():
    """Create a session with robust headers to avoid blocking"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    return session

# ... (imports are at top of file, ensuring BeautifulSoup is imported)

# ... (imports)
from symbol_resolver import search_symbol

# ... (rest of imports)

def format_symbol_for_yahoo(symbol: str) -> str:
    """Format symbol for Yahoo Finance (e.g., 'Make sure .NS is there')"""
    if symbol.upper().endswith('.NS') or symbol.upper().endswith('.BO'):
        return symbol.upper()
    return f"{symbol}.NS"

def get_yahoo_stock_price(symbol: str) -> Optional[float]:
    """
    Fallback 2: Fetch stock price from Yahoo Finance
    """
    try:
        # Try different formats
        # 1. As provided formatted for Yahoo
        # 2. Spaces removed formatted for Yahoo (if not resolved)
        
        candidates = [format_symbol_for_yahoo(symbol)]
        if ' ' in symbol:
             candidates.append(format_symbol_for_yahoo(symbol.replace(' ', '')))
        
        for ticker_symbol in candidates:
            try:
                # Do NOT pass session to yfinance (it handles it internally now)
                stock = yf.Ticker(ticker_symbol)
                
                # Fast fetch using 'history' (period="1d")
                data = stock.history(period="1d")
                
                if not data.empty:
                    price = data['Close'].iloc[-1]
                    log.info(f"Yahoo Finance: {ticker_symbol} = ₹{price} (Delayed)")
                    return float(price)
            except Exception:
                continue
            
    except Exception as e:
        log.error(f"Error fetching Yahoo price for {symbol}: {e}")
    
    return None

# ... (get_google_finance_price remains same)

def get_google_finance_price(symbol: str) -> Optional[float]:
    """
    Fallback 3: Fetch stock price from Google Finance
    """
    try:
        # NSE stocks on Google Finance format: "SYMBOL:NSE"
        clean_symbol = symbol.replace(' ', '')
        url = f"https://www.google.com/finance/quote/{clean_symbol}:NSE"
        
        session = get_request_session()
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # The price class on Google Finance is usually "YMlKec fxKbKc"
            price_div = soup.find('div', class_='YMlKec fxKbKc')
            
            if price_div:
                price_text = price_div.text.replace('₹', '').replace(',', '').strip()
                price = float(price_text)
                log.info(f"Google Finance: {clean_symbol} = ₹{price}")
                return price
                
    except Exception as e:
        log.error(f"Error fetching Google Finance price for {symbol}: {e}")
    
    return None

def get_stock_price(symbol: str) -> tuple[Optional[float], Optional[str]]:
    """
    Get stock price with multiple fallback mechanisms AND Name Resolution.
    Returns: (price, resolved_symbol)
    """
    # 1. Primary: NSE
    if ' ' not in symbol:
        price = get_nse_stock_price(symbol)
        if price is not None:
            return price, None
    else:
        log.warning(f"Symbol '{symbol}' has spaces, skipping direct NSE fetch.")

    # 2. Yahoo Finance
    log.warning(f"Trying Yahoo Finance for '{symbol}'...")
    price = get_yahoo_stock_price(symbol)
    if price is not None:
        return price, None

    # 3. Google Finance
    log.warning(f"Trying Google Finance for '{symbol}'...")
    price = get_google_finance_price(symbol)
    if price is not None:
        return price, None
        
    # 4. RESOLVER FALLBACK
    log.warning(f"Direct fetches failed for '{symbol}'. Attempting to resolve name to symbol...")
    resolved_symbol = search_symbol(symbol)
    
    if resolved_symbol:
        log.info(f"✨ Resolved '{symbol}' to '{resolved_symbol}'. Retrying fetch...")
        
        # Try Yahoo with the RESOLVED symbol
        # Note: resolved_symbol usually has .NS suffix.
        price = get_yahoo_stock_price(resolved_symbol)
        if price is not None:
            return price, resolved_symbol
            
        # Try NSE if resolving gave a .NS symbol
        if resolved_symbol.endswith('.NS'):
            clean_nse = resolved_symbol.replace('.NS', '')
            price = get_nse_stock_price(clean_nse)
            if price is not None:
                # If NSE worked with the clean symbol, we prefer that as the new symbol
                return price, clean_nse
                
    return None, None


def should_send_alert(stock_id: int, alert_type: str) -> bool:
    """
    Check if we should send an alert using the database function.
    Returns True only if there are NO unacknowledged alerts for this stock/type.
    """
    try:
        response = supabase.rpc('should_send_alert', {
            'p_stock_id': stock_id, 
            'p_alert_type': alert_type
        }).execute()
        
        return response.data
        
    except Exception as e:
        log.error(f"Error checking alert status: {e}")
        # On error, safe default is False to prevent spam
        return False


def record_alert(stock_id: int, user_id: int, alert_type: str, 
                 current_price: float, threshold_price: float, 
                 atp_price: float, percentage_change: float) -> Optional[int]:
    """Record alert in database and return the Alert ID"""
    try:
        response = supabase.table('alerts').insert({
            'stock_id': stock_id,
            'user_id': user_id,
            'alert_type': alert_type,
            'current_price': current_price,
            'threshold_price': threshold_price,
            'buy_price': atp_price,
            'percentage_change': percentage_change,
            'is_acknowledged': False
        }).execute()
        
        # Update last_alert_sent timestamp on stock
        supabase.table('stocks').update({
            'last_alert_sent': datetime.now().isoformat()
        }).eq('id', stock_id).execute()
        
        log.info(f"Alert recorded for stock_id={stock_id}, type={alert_type}")
        
        if response.data and len(response.data) > 0:
            return response.data[0]['id']
            
    except Exception as e:
        log.error(f"Error recording alert: {e}")
    
    return None


def log_alert_error(user_id: int, symbol: str, error_message: str):
    """Log failed alert attempts to database"""
    try:
        supabase.table('error_logs').insert({
            'user_id': user_id,
            'stock_symbol': symbol,
            'error_message': error_message
        }).execute()
        log.error(f"Logged error for {symbol} (User {user_id}): {error_message}")
    except Exception as e:
        log.error(f"Failed to log error to DB: {e}")


def send_discord_alert(webhook_url: str, symbol: str, alert_type: str, 
                       current_price: float, atp_price: float, 
                       threshold_price: float, percentage_change: float, 
                       alert_id: int = None):
    """
    Send alert to Discord using Webhook and Rich Embeds
    """
    if not webhook_url:
        log.warning("No Discord Webhook URL provided")
        return False
        
    try:
        # Determine color and title
        if alert_type == 'profit':
            color = 51451  # Green (#00C8F3 is generic, let's use Decimal for #00C851 -> 51281)
            # Decimal for #00C851 is 51281. #00FF00 is 65280.
            color = 51281 
            title = f"📈 Profit Alert: {symbol}"
            desc = "Target Reached! 🎯"
        else:
            color = 16729156 # Red (#FF4444)
            title = f"📉 Loss Alert: {symbol}"
            desc = "Stop Loss Triggered ⚠️"
            
        change_text = f"+{percentage_change:.2f}%" if percentage_change > 0 else f"{percentage_change:.2f}%"
        
        # Acknowledgement Link
        ack_link = f"{DASHBOARD_URL}/alerts"
        
        # Construct Embed
        embed = {
            "title": title,
            "description": f"**{desc}**\n\n[✅ **CLICK HERE TO ACKNOWLEDGE**]({ack_link})",
            "color": color,
            "fields": [
                {
                    "name": "Current Price",
                    "value": f"₹{current_price:,.2f}",
                    "inline": True
                },
                {
                    "name": "ATP Price",
                    "value": f"₹{atp_price:,.2f}",
                    "inline": True
                },
                {
                    "name": "Threshold",
                    "value": f"₹{threshold_price:,.2f}",
                    "inline": True
                },
                {
                    "name": "Change",
                    "value": change_text,
                    "inline": True
                },
                {
                    "name": "Time",
                    "value": datetime.now().strftime("%I:%M %p IST"),
                    "inline": True
                }
            ],
            "footer": {
                "text": "Market Alerts System"
            }
        }
        
        payload = {
            "embeds": [embed]
        }
        
        response = requests.post(webhook_url, json=payload, timeout=10)
        
        if response.status_code in [200, 204]:
            log.info(f"Discord alert sent for {symbol}")
            return True
        else:
            log.error(f"Discord Webhook failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        log.error(f"Error sending Discord alert: {e}")
        return False


def process_stock(stock: Dict):
    """Process a single stock and check for alerts"""
    stock_id = stock['id']
    symbol = stock['symbol']
    atp = float(stock['buy_price'])
    profit_pct = float(stock['profit_alert_pct'])
    loss_pct = float(stock['loss_alert_pct'])
    user_id = stock.get('user_id') 
    
    # Extract webhook from joined profiles data
    # 'profiles' key comes from the join.
    user_data = stock.get('profiles')
    webhook_url = None
    if user_data and isinstance(user_data, dict):
        webhook_url = user_data.get('discord_webhook')
    
    log.info(f"Processing {symbol} (User {user_id})...")
    
    # Validate Webhook
    if not webhook_url:
        msg = "Missing Discord Webhook URL for user"
        log.warning(f"{msg}: {user_id}")
        log_alert_error(user_id, symbol, msg)
        # We continue processing logic but won't send the alert? 
        # Actually user asked to log issue "if alerts not being sent".
        # If we skip sending, we should probably stop here or check price anyway but skip send?
        # Checking price updates 'last_price' which is good. So let's continue but just flag it.
    
    # Get current price
    current_price, resolved_symbol = get_stock_price(symbol)
    
    if current_price is None:
        log.warning(f"Could not fetch price for {symbol}, skipping...")
        return

    # AUTO-FIX: Update symbol in database if resolved
    if resolved_symbol and resolved_symbol != symbol:
        try:
            log.info(f"🛠️ Auto-Fixing symbol in DB: '{symbol}' -> '{resolved_symbol}'")
            # If resolved symbol has .NS but user had Name, we save the Ticker.
            supabase.table('stocks').update({
                'symbol': resolved_symbol
            }).eq('id', stock_id).execute()
            log.info("✅ Database updated with correct symbol!")
        except Exception as e:
            log.error(f"Failed to update symbol in DB: {e}")
    
    # Calculate thresholds
    profit_target = atp * (1 + profit_pct / 100)
    loss_target = atp * (1 - loss_pct / 100)
    
    log.info(f"{symbol}: Current=₹{current_price:.2f}, ATP=₹{atp:.2f}, "
             f"PTarget=₹{profit_target:.2f}, LTarget=₹{loss_target:.2f}")
    
    # Check for profit alert
    if current_price >= profit_target:
        if should_send_alert(stock_id, 'profit'):
            percentage_change = ((current_price - atp) / atp) * 100
            msg = (f"PROFIT ALERT: {symbol} reached ₹{current_price:.2f}! "
                   f"(ATP: ₹{atp:.2f}, Target: ₹{profit_target:.2f}, "
                   f"Gain: +{percentage_change:.2f}%)")
            log.info(msg)
            
            # 1. Record alert first a get ID
            new_alert_id = record_alert(
                stock_id, user_id, 'profit', current_price,
                profit_target, atp, percentage_change
            )
            
            # 2. Send alert with the ID (Only if webhook exists)
            if webhook_url:
                success = send_discord_alert(
                    webhook_url, symbol, 'profit', current_price, atp, 
                    profit_target, percentage_change, new_alert_id
                )
                if not success:
                    log_alert_error(user_id, symbol, "Failed to send Profit Alert (Discord API Error)")
            else:
                log.warning(f"Skipping Profit Alert for {symbol} due to missing webhook")

        else:
            log.info(f"Profit alert for {symbol} already sent recently, skipping...")
    
    # Check for loss alert
    elif current_price <= loss_target:
        if should_send_alert(stock_id, 'loss'):
            percentage_change = ((current_price - atp) / atp) * 100
            msg = (f"LOSS ALERT: {symbol} dropped to ₹{current_price:.2f}! "
                   f"(ATP: ₹{atp:.2f}, Target: ₹{loss_target:.2f}, "
                   f"Loss: {percentage_change:.2f}%)")
            log.info(msg)
            
            # 1. Record alert first to get ID
            new_alert_id = record_alert(
                stock_id, user_id, 'loss', current_price,
                loss_target, atp, percentage_change
            )

            # 2. Send alert with the ID (Only if webhook exists)
            if webhook_url:
                success = send_discord_alert(
                    webhook_url, symbol, 'loss', current_price, atp,
                    loss_target, percentage_change, new_alert_id
                )
                if not success:
                    log_alert_error(user_id, symbol, "Failed to send Loss Alert (Discord API Error)")
            else:
                log.warning(f"Skipping Loss Alert for {symbol} due to missing webhook")
        else:
            log.info(f"Loss alert for {symbol} already sent recently, skipping...")
    
    else:
        log.info(f"{symbol} is within normal range")
    
    # Update last_price in database
    # Update last_price in database - REMOVED as column does not exist in schema
    # try:
    #     supabase.table('stocks').update({
    #         'last_price': current_price
    #     }).eq('id', stock_id).execute()
    # except Exception as e:
    #     log.error(f"Error updating last_price for {symbol}: {e}")


def main():
    log.info("=" * 60)
    log.info("Starting Market Alerts Job")
    log.info(f"Time: {datetime.now().strftime('%Y-%m-%d %I:%M:%S %p IST')}")
    log.info("=" * 60)
    
    stocks = get_active_stocks()
    log.info(f"Found {len(stocks)} active stocks to monitor")
    
    if not stocks:
        log.warning("No active stocks found!")
        return
    
    for stock in stocks:
        try:
            process_stock(stock)
            # Small delay between stocks to avoid rate limiting
            time.sleep(1)
        except Exception as e:
            log.error(f"Error processing stock {stock.get('symbol', 'UNKNOWN')}: {e}")
            continue
    
    log.info("=" * 60)
    log.info("Market Alerts Job Completed")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
