# 🚀 Market Alerts System - Setup Guide

## 📋 What's New in This Update

### ✅ **Fixed Issues:**
1. **Alert Latency** - Now using NSE API instead of Selenium (10x faster!)
2. **Duplicate Alerts** - Added alert tracking with 60-minute cooldown
3. **Slow Scraping** - Replaced Screener.in with direct NSE/BSE APIs
4. **Email Notifications** - Switched to Google Chat with rich cards
5. **Scraping Frequency** - Increased from 15 min to 5 min intervals

### 🎯 **Key Improvements:**
- **Real-time alerts** - 5-minute intervals during market hours
- **No more duplicates** - Smart cooldown system prevents spam
- **Beautiful notifications** - Rich Google Chat cards with emojis
- **Multi-user ready** - Database schema supports individual users
- **Faster & reliable** - Direct API calls instead of browser automation

---

## 🛠️ Setup Instructions

### Step 1: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/migrations.sql`
4. Copy and paste the entire content into the SQL Editor
5. Click **Run** to execute the migration
6. Verify tables were created:
   ```sql
   SELECT * FROM users;
   SELECT * FROM stocks;
   SELECT * FROM alerts;
   ```

### Step 2: Create Google Chat Webhook

1. Open Google Chat and go to the space where you want alerts
2. Click the space name → **Manage webhooks**
3. Click **Add webhook**
4. Name it "Market Alerts" and click **Save**
5. **Copy the webhook URL** (you'll need this for GitHub secrets)

Example webhook URL:
```
https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=...
```

### Step 3: Update GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Update/Add these secrets:

   | Secret Name | Value | Description |
   |------------|-------|-------------|
   | `SUPABASE_URL` | Your Supabase project URL | From Supabase dashboard |
   | `SUPABASE_KEY` | Your Supabase anon key | From Supabase dashboard |
   | `GOOGLE_CHAT_WEBHOOK` | Your webhook URL | From Step 2 above |

4. **Remove old secrets** (no longer needed):
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`

### Step 4: Test the Scraper Locally (Optional)

1. Create a `.env` file in the `scraper/` directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   GOOGLE_CHAT_WEBHOOK=your_webhook_url
   ```

2. Install dependencies:
   ```bash
   cd scraper
   pip install -r requirements.txt
   ```

3. Run the scraper:
   ```bash
   python main.py
   ```

4. Check your Google Chat space for test alerts!

### Step 5: Add Your First Stock

1. Open your dashboard (Next.js app)
2. Add a stock with:
   - **Symbol**: NSE stock symbol (e.g., `RELIANCE`, `TCS`, `INFY`)
   - **ATP**: Your average traded price
   - **Profit %**: Profit threshold (e.g., 5%)
   - **Loss %**: Loss threshold (e.g., 3%)

3. The scraper will automatically monitor it every 5 minutes during market hours!

---

## 📊 How It Works

### Data Flow

```
GitHub Actions (Every 5 min)
    ↓
Fetch Active Stocks from Supabase
    ↓
For Each Stock:
    ↓
Get Current Price from NSE API
    ↓
Check if Price Crossed Threshold
    ↓
Check if Alert Already Sent (Cooldown)
    ↓
Send Google Chat Alert (Rich Card)
    ↓
Record Alert in Database
```

### Alert Cooldown System

- **Purpose**: Prevent duplicate alerts
- **Duration**: 60 minutes (configurable)
- **Logic**: If an alert was sent in the last 60 minutes, skip it
- **Database**: Tracked in `alerts` table

### NSE API vs Screener.in

| Feature | Screener.in (Old) | NSE API (New) |
|---------|------------------|---------------|
| Speed | ~10-15 seconds | ~1-2 seconds |
| Method | Selenium browser | Direct HTTP |
| Reliability | Medium | High |
| Rate Limiting | Strict | Lenient |
| Data Freshness | Delayed | Real-time |

---

## 🎨 Google Chat Alert Format

Alerts appear as rich cards with:

**Profit Alert Example:**
```
📈 Profit Alert: RELIANCE
Target Reached! 🎯

Current Price: ₹2,450.00
ATP: ₹2,300.00
Threshold: ₹2,415.00
Change: +6.52%
Time: 10:35 AM IST
```

**Loss Alert Example:**
```
📉 Loss Alert: TCS
Stop Loss Triggered ⚠️

Current Price: ₹3,200.00
ATP: ₹3,350.00
Threshold: ₹3,249.50
Change: -4.48%
Time: 11:20 AM IST
```

---

## 🔧 Configuration

### Adjust Alert Cooldown

Edit `scraper/main.py`:
```python
# Change from 60 to your desired minutes
ALERT_COOLDOWN_MINUTES = 60
```

### Change Scraping Frequency

Edit `.github/workflows/scraper.yml`:
```yaml
# Change */5 to */10 for 10-minute intervals
- cron: '*/5 4-10 * * 1-5'
```

### Add More Data Sources

The scraper has a fallback mechanism:
1. Try NSE first
2. If NSE fails, try BSE
3. You can add more sources in `get_stock_price()` function

---

## 🚨 Troubleshooting

### Issue: Not receiving alerts

**Check:**
1. Is the stock symbol correct? (Use NSE symbols like `RELIANCE`, not `RELIANCE.NS`)
2. Is the stock active in dashboard?
3. Has the price actually crossed the threshold?
4. Was an alert sent in the last 60 minutes? (Check `alerts` table)
5. Is the Google Chat webhook URL correct?

**Debug:**
```sql
-- Check recent alerts
SELECT * FROM alerts ORDER BY sent_at DESC LIMIT 10;

-- Check stock status
SELECT symbol, is_active, last_price, last_alert_sent FROM stocks;
```

### Issue: NSE API not working

**Possible causes:**
- NSE changed their API structure
- Rate limiting (unlikely with 5-min intervals)
- Network issues

**Solution:**
- The scraper will automatically fallback to BSE
- Check GitHub Actions logs for error messages
- Try running locally to debug

### Issue: Alerts sent too frequently

**Solution:**
Increase the cooldown period:
```python
ALERT_COOLDOWN_MINUTES = 120  # 2 hours instead of 1
```

---

## 📈 Future Enhancements (Roadmap)

### Phase 4: Multi-User System
- [ ] Add user authentication (NextAuth.js)
- [ ] User-specific stock lists
- [ ] Individual Google Chat webhooks per user
- [ ] User dashboard with login

### Phase 5: Advanced Features
- [ ] Alert acknowledgement buttons in Google Chat
- [ ] Historical alert analytics
- [ ] Price trend charts
- [ ] SMS/WhatsApp notifications
- [ ] Mobile app

---

## 📝 Database Schema

### Tables

**users**
- `id` - Primary key
- `email` - Unique email
- `name` - User name
- `google_chat_webhook` - User-specific webhook
- `created_at` - Timestamp
- `is_active` - Boolean

**stocks**
- `id` - Primary key
- `user_id` - Foreign key to users
- `symbol` - Stock symbol (NSE)
- `atp_price` - Average traded price
- `profit_threshold` - Profit % threshold
- `loss_threshold` - Loss % threshold
- `is_active` - Boolean
- `last_price` - Last fetched price
- `last_alert_sent` - Last alert timestamp

**alerts**
- `id` - Primary key
- `stock_id` - Foreign key to stocks
- `user_id` - Foreign key to users
- `alert_type` - 'profit' or 'loss'
- `current_price` - Price when alert sent
- `threshold_price` - Threshold that was crossed
- `atp_price` - ATP at time of alert
- `percentage_change` - % change from ATP
- `sent_at` - Timestamp
- `acknowledged_at` - When user acknowledged
- `is_acknowledged` - Boolean

---

## 🤝 Contributing

Found a bug or have a feature request? Open an issue!

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🙏 Acknowledgments

- NSE India for providing free market data
- Google Chat for webhook support
- Supabase for awesome backend infrastructure
