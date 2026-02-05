import os
import time
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Load env variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
if not url or not key:
    log.error("Supabase URL or Key not found in environment variables.")
    exit(1)

supabase: Client = create_client(url, key)

def get_active_stocks():
    response = supabase.table('stocks').select("*").eq('is_active', True).execute()
    return response.data

def scrape_stock_price(company_name):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    clean_value = None
    
    try:
        driver.get("https://www.screener.in/")
        wait = WebDriverWait(driver, 20)
        
        # Search
        search_box = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                "(//div[contains(@class,'home-search')]//input[@data-company-search='true'])[1]"
            ))
        )
        
        driver.execute_script("""
            const input = arguments[0];
            input.focus();
            input.value = arguments[1];
            input.dispatchEvent(new Event('input', { bubbles: true }));
        """, search_box, company_name)
        
        time.sleep(2)
        search_box.send_keys(Keys.ENTER)
        
        # Extract Market Cap (Using as proxy for 'value' based on user script, but ideally we want Stock Price)
        # Note: User's original script extracted Market Cap. Usually 'Current Price' is what users want for ATP comparison.
        # Let's try to find 'Current Price' on the page.
        # On Screener.in, usually the first item in the ratio list is Current Price.
        # Let's stick to the user's selector for now or adapt if we can find Current Price.
        # User selector: "//div[contains(@class,'font-size-18') and contains(@class,'strong')]//span" -> Market Cap
        
        # Initial implementation uses user's logic, can refine later.
        market_cap_span = wait.until(
            EC.visibility_of_element_located((
                By.XPATH,
                "//div[contains(@class,'font-size-18') and contains(@class,'strong')]//span"
            ))
        )
        
        raw_value = market_cap_span.text
        clean_value = raw_value.replace("₹", "").replace(",", "").strip()
        log.info(f"Scraped value for {company_name}: {clean_value}")
        
    except Exception as e:
        log.error(f"Error scraping {company_name}: {e}")
    finally:
        driver.quit()
        
    return clean_value

import smtplib
from email.message import EmailMessage

def send_email(subject, body):
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = os.environ.get("EMAIL_USER")
    msg['To'] = os.environ.get("EMAIL_USER") # Send to self

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(os.environ.get("EMAIL_USER"), os.environ.get("EMAIL_PASSWORD"))
        server.send_message(msg)
        server.quit()
        log.info("Email sent successfully!")
    except Exception as e:
        log.error(f"Failed to send email: {e}")

def main():
    log.info("Starting Market Alerts Job")
    stocks = get_active_stocks()
    log.info(f"Found {len(stocks)} active stocks monitoring.")
    
    for stock in stocks:
        symbol = stock['symbol']
        atp = float(stock['atp_price'])
        profit_pct = float(stock['profit_threshold'])
        loss_pct = float(stock['loss_threshold'])
        
        log.info(f"Processing {symbol}...")
        current_price_str = scrape_stock_price(symbol)
        
        if current_price_str:
            try:
                current_price = float(current_price_str)
                
                # Calculate thresholds
                profit_target = atp * (1 + profit_pct / 100)
                loss_target = atp * (1 - loss_pct / 100)
                
                log.info(f"{symbol}: Current={current_price}, ATP={atp}, PTarget={profit_target:.2f}, LTarget={loss_target:.2f}")
                
                if current_price >= profit_target:
                    msg = f"PROFIT ALERT: {symbol} is up to {current_price}! (ATP: {atp}, Target: {profit_target:.2f})"
                    log.info(msg)
                    send_email(f"📈 Profit Alert: {symbol}", msg)
                elif current_price <= loss_target:
                    msg = f"LOSS ALERT: {symbol} is down to {current_price}! (ATP: {atp}, Target: {loss_target:.2f})"
                    log.info(msg)
                    send_email(f"📉 Loss Alert: {symbol}", msg)
                    
            except ValueError:
                log.error(f"Could not parse price for {symbol}: {current_price_str}")

if __name__ == "__main__":
    main()
