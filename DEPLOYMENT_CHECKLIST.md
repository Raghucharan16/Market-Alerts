# ✅ Deployment Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📋 Pre-Deployment

### Database Setup
- [ ] Opened Supabase dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied content from `database/migrations.sql`
- [ ] Executed migration successfully
- [ ] Verified tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'stocks', 'alerts');
  ```
- [ ] Confirmed 3 tables returned (users, stocks, alerts)

### Google Chat Setup
- [ ] Opened Google Chat
- [ ] Selected/created space for alerts
- [ ] Clicked "Manage webhooks"
- [ ] Created new webhook named "Market Alerts"
- [ ] Copied webhook URL
- [ ] Saved webhook URL securely

### GitHub Secrets
- [ ] Opened GitHub repository
- [ ] Navigated to Settings → Secrets and variables → Actions
- [ ] Verified `SUPABASE_URL` exists
- [ ] Verified `SUPABASE_KEY` exists
- [ ] Added `GOOGLE_CHAT_WEBHOOK` secret
- [ ] Deleted old `EMAIL_USER` secret (if exists)
- [ ] Deleted old `EMAIL_PASSWORD` secret (if exists)

---

## 🚀 Deployment

### Code Changes
- [ ] All files updated in local repository
- [ ] Reviewed changes in `scraper/main.py`
- [ ] Reviewed changes in `.github/workflows/scraper.yml`
- [ ] Reviewed changes in `scraper/requirements.txt`

### Git Push
- [ ] Staged all changes: `git add .`
- [ ] Committed changes: `git commit -m "Upgrade to NSE API with Google Chat"`
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Verified push succeeded

---

## 🧪 Testing

### Local Testing (Optional but Recommended)
- [ ] Created `.env` file in `scraper/` folder
- [ ] Added environment variables to `.env`
- [ ] Installed dependencies: `pip install -r scraper/requirements.txt`
- [ ] Ran test script: `python scraper/test_apis.py`
- [ ] All tests passed
- [ ] Ran scraper: `python scraper/main.py`
- [ ] No errors in console

### GitHub Actions Testing
- [ ] Opened GitHub repository
- [ ] Clicked "Actions" tab
- [ ] Clicked "Market Alerts Scraper" workflow
- [ ] Clicked "Run workflow" button
- [ ] Workflow started successfully
- [ ] Clicked on running workflow
- [ ] Expanded "Run Scraper" step
- [ ] No errors in logs
- [ ] Workflow completed successfully

### Google Chat Testing
- [ ] Opened Google Chat space
- [ ] Verified test message appeared (if ran test)
- [ ] Message format looks correct
- [ ] Rich card displays properly

---

## 📊 Verification

### Database Verification
Run these queries in Supabase SQL Editor:

- [ ] Check users table:
  ```sql
  SELECT * FROM users;
  ```
  Expected: At least 1 default user

- [ ] Check stocks table:
  ```sql
  SELECT id, symbol, user_id, is_active, last_price FROM stocks;
  ```
  Expected: Your stocks with user_id populated

- [ ] Check alerts table:
  ```sql
  SELECT * FROM alerts ORDER BY sent_at DESC LIMIT 5;
  ```
  Expected: Empty or recent alerts

### GitHub Actions Verification
- [ ] Opened "Actions" tab
- [ ] Workflow shows scheduled runs
- [ ] Next run time is visible
- [ ] Cron schedule shows `*/5 4-10 * * 1-5`
- [ ] No failed runs

### Dashboard Verification
- [ ] Dashboard loads without errors
- [ ] Can view existing stocks
- [ ] Can add new stock
- [ ] Can toggle stock active/inactive
- [ ] Can delete stock

---

## 🎯 First Stock Setup

### Add Test Stock
- [ ] Opened dashboard
- [ ] Clicked "Add Stock" or similar
- [ ] Entered stock details:
  - Symbol: `RELIANCE` (or your choice)
  - ATP: (current market price)
  - Profit %: `5`
  - Loss %: `3`
- [ ] Saved stock
- [ ] Stock appears in list
- [ ] Stock is marked "Active"

### Verify Stock in Database
- [ ] Ran query:
  ```sql
  SELECT * FROM stocks WHERE symbol = 'RELIANCE';
  ```
- [ ] Stock exists with correct values
- [ ] `is_active` is `true`
- [ ] `user_id` is populated

---

## ⏰ Monitoring

### First 24 Hours
- [ ] Checked GitHub Actions after 5 minutes
- [ ] Workflow ran successfully
- [ ] No errors in logs
- [ ] Checked Google Chat for alerts (if threshold crossed)

### After First Alert
- [ ] Alert appeared in Google Chat
- [ ] Alert format is correct
- [ ] All information displayed properly
- [ ] Alert recorded in database:
  ```sql
  SELECT * FROM alerts ORDER BY sent_at DESC LIMIT 1;
  ```
- [ ] No duplicate alert sent within 60 minutes

---

## 🔧 Configuration

### Cooldown Period (Optional)
- [ ] Decided on cooldown period (default: 60 min)
- [ ] Updated `ALERT_COOLDOWN_MINUTES` in `scraper/main.py` if needed
- [ ] Pushed changes if modified

### Scraping Frequency (Optional)
- [ ] Decided on frequency (default: 5 min)
- [ ] Updated cron in `.github/workflows/scraper.yml` if needed
- [ ] Pushed changes if modified

---

## 📚 Documentation Review

### Read Documentation
- [ ] Read `README.md`
- [ ] Read `QUICK_START.md`
- [ ] Read `SETUP_GUIDE.md`
- [ ] Read `UPDATE_SUMMARY.md`
- [ ] Skimmed `DATA_SOURCES.md`
- [ ] Skimmed `IMPLEMENTATION_PLAN.md`

---

## 🐛 Troubleshooting (If Issues)

### If No Alerts Received
- [ ] Verified stock is active
- [ ] Checked if price crossed threshold
- [ ] Reviewed GitHub Actions logs
- [ ] Verified webhook URL is correct
- [ ] Tested webhook manually
- [ ] Checked database for alerts:
  ```sql
  SELECT * FROM alerts WHERE stock_id = (SELECT id FROM stocks WHERE symbol = 'YOUR_SYMBOL');
  ```

### If GitHub Actions Failing
- [ ] Opened failed workflow run
- [ ] Read error message
- [ ] Checked if secrets are set correctly
- [ ] Verified Supabase connection
- [ ] Tested locally with same environment variables

### If Duplicate Alerts
- [ ] Verified cooldown logic is working
- [ ] Checked `alerts` table for multiple entries
- [ ] Reviewed `should_send_alert()` function
- [ ] Increased cooldown period if needed

---

## ✅ Final Verification

### System Health Check
- [ ] Database: ✅ All tables created
- [ ] Secrets: ✅ All configured correctly
- [ ] Workflow: ✅ Running every 5 minutes
- [ ] Alerts: ✅ Appearing in Google Chat
- [ ] Deduplication: ✅ No duplicates within 60 min
- [ ] Performance: ✅ Scraper completes in <30 seconds

### Success Criteria
- [ ] ✅ Alerts received within 5-10 minutes of threshold breach
- [ ] ✅ No duplicate alerts within cooldown period
- [ ] ✅ Google Chat cards display correctly
- [ ] ✅ All stocks being monitored
- [ ] ✅ No errors in GitHub Actions
- [ ] ✅ Database tracking all alerts

---

## 🎉 Completion

### All Checks Passed?
- [ ] **YES** - System is fully operational! 🎊
- [ ] **NO** - Review troubleshooting section above

### Next Steps
- [ ] Add more stocks to monitor
- [ ] Adjust thresholds based on market volatility
- [ ] Monitor for a few days
- [ ] Fine-tune cooldown period if needed
- [ ] Share feedback/issues on GitHub

---

## 📝 Notes

**Date Deployed**: _______________

**Stocks Monitoring**: _______________

**Issues Encountered**: 
```
(Write any issues you faced and how you resolved them)




```

**Performance Notes**:
```
(Note any performance observations)




```

---

## 🚀 Future Enhancements

When ready, consider:
- [ ] Adding user authentication
- [ ] Setting up alert acknowledgement
- [ ] Creating historical analytics
- [ ] Integrating SMS/WhatsApp
- [ ] Building mobile app

---

**Congratulations on deploying your Market Alerts system! 🎉**

*Keep this checklist for reference and future deployments.*

---

**Last Updated**: February 6, 2026
