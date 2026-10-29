# Credentials Needed for Sovereign Financial OS

To enable all features of your Financial OS, you will need to provide the following API keys and secrets in the **Settings > Secrets** panel of AI Studio.

## Required

### Gemini API Key
- **Name**: `GEMINI_API_KEY`
- **Description**: Powers the AI financial analyzer, receipt OCR structuring, and trading signals.
- **Where to get**: [Google AI Studio](https://aistudio.google.com/app/apikey)

## Optional (Advanced Features)

### Trading API (Mocked by default)
- **Keys**: `TRADING_API_KEY`, `TRADING_SECRET`
- **Purpose**: Enables the system to execute live trades on your behalf.
- **Example Providers**: Binance, Coinbase Advanced, or Kraken.

### Open Banking (Plaid)
- **Keys**: `PLAID_CLIENT_ID`, `PLAID_SECRET`
- **Purpose**: Enables real-time bank account syncing and bill tracking.
- **Where to get**: [Plaid Dashboard](https://dashboard.plaid.com/)

---

**Note**: The application will run in "Demo Mode" with generated data if these keys are not provided.
