# Market Alerts System - Implementation Plan

## Current Issues

1. **Alert Latency**: Alerts delayed by ~1 hour (market opens 9:30 AM, alert at 10:47 AM)
2. **Duplicate Alerts**: Same alert sent multiple times (no acknowledgement tracking)
3. **Slow Data Source**: Screener.in has high latency
4. **Email Notifications**: Need Google Chat Cards instead
5. **No Multi-user Support**: All stocks in one pool
6. **Low Frequency**: 15-minute intervals too slow

## Solutions Overview

### Phase 1: Fix Data Source & Latency ✅
- Replace Screener.in with NSE India unofficial API
- Change scraping from Market Cap to actual Current Price (CMP)
- Increase frequency from 15 min to 5 min
- Add proper error handling and retries

### Phase 2: Alert Acknowledgement System ✅
- Create `alerts` table to track sent alerts
- Add cooldown period (e.g., 1 hour) to prevent duplicate alerts
- Store alert metadata (stock, price, threshold type, timestamp)

### Phase 3: Google Chat Integration ✅
- Replace Gmail SMTP with Google Chat Webhook
- Design rich card format for alerts
- Include stock details, price changes, and action buttons

### Phase 4: Multi-user System 🔄
- Create `users` table with authentication
- Link stocks to specific users
- Add user login to dashboard
- Filter stocks by user_id

### Phase 5: Dashboard Enhancements 🔄
- Add alert history view
- Show acknowledgement status
- User management interface
- Real-time alert preview

## Technical Details

### New Database Schema

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Modify stocks table to add user_id
ALTER TABLE stocks ADD COLUMN user_id BIGINT REFERENCES users(id);

-- Alerts tracking table
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id),
  user_id BIGINT REFERENCES users(id),
  alert_type TEXT NOT NULL, -- 'profit' or 'loss'
  price DECIMAL(10, 2) NOT NULL,
  threshold_price DECIMAL(10, 2) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN DEFAULT FALSE
);

-- Index for faster queries
CREATE INDEX idx_alerts_stock_sent ON alerts(stock_id, sent_at);
CREATE INDEX idx_alerts_acknowledged ON alerts(is_acknowledged, sent_at);
```

### NSE India API Approach

Instead of Selenium + Screener.in, use direct HTTP requests to NSE:
- **Endpoint**: `https://www.nseindia.com/api/quote-equity?symbol=SYMBOL`
- **Advantages**: 
  - Much faster (no browser overhead)
  - Real-time data
  - Free and reliable
  - No rate limiting for reasonable use
- **Headers Required**: User-Agent, Accept, cookies

### Google Chat Webhook Format

```json
{
  "cards": [{
    "header": {
      "title": "📈 Profit Alert: RELIANCE",
      "subtitle": "Target Reached!"
    },
    "sections": [{
      "widgets": [
        {"keyValue": {"topLabel": "Current Price", "content": "₹2,450.00"}},
        {"keyValue": {"topLabel": "ATP", "content": "₹2,300.00"}},
        {"keyValue": {"topLabel": "Gain", "content": "+6.52%"}},
        {"buttons": [{"textButton": {"text": "ACKNOWLEDGE", "onClick": {"openLink": {"url": "..."}}}}]}
      ]
    }]
  }]
}
```

## Implementation Order

1. ✅ Create database migration script
2. ✅ Update scraper to use NSE API
3. ✅ Add alert tracking logic
4. ✅ Implement Google Chat webhook
5. ✅ Update GitHub Actions to 5-min frequency
6. 🔄 Add user authentication (Next.js Auth)
7. 🔄 Update dashboard for multi-user
8. 🔄 Add alert history page

## Testing Plan

- Test NSE API with multiple stocks
- Verify alert deduplication works
- Test Google Chat card formatting
- Load test with 5-min frequency
- Verify no blocking from NSE

## Rollout Strategy

1. Deploy Phase 1-3 first (core fixes)
2. Test in production for 1-2 days
3. Deploy Phase 4 (multi-user) separately
4. Migrate existing stocks to default user
