# Hedera Account Monitor (Hedera Stalker)

A simple NestJS application to monitor Hedera account balances with a dashboard. The app tracks account balances hourly and displays daily, weekly, and monthly changes.

## Features

- 📊 **Dashboard**: Responsive dashboard showing account balances and changes
- ⏰ **Hourly Tracking**: Automatically fetches and stores account balances every hour
- 📈 **Change Tracking**: View daily, weekly, and monthly balance changes in HBARs and percentages
- 🔔 **Low Balance Notifications**: Get notified via Telegram when account balances fall below threshold (default: 1 HBAR)
- 🗄️ **PostgreSQL**: Stores balance history in a PostgreSQL database
- 🐳 **Dockerized**: Easy setup with Docker Compose

## Prerequisites

- Docker and Docker Compose

## Quick Start (Docker - Recommended)

The easiest way to run the application is using Docker. Everything is containerized and ready to go!

1. **Start the application:**

```bash
./docker.sh start
```

Or with a specific Hedera network:

```bash
HEDERA_NETWORK=mainnet ./docker.sh start
```

That's it! The application will be available at `http://localhost:3000`

The `docker.sh` script will:
- Build the NestJS application
- Start PostgreSQL database
- Start the application container
- Wait for services to be ready

### Docker Commands

```bash
# Start the application
./docker.sh start

# Stop the application
./docker.sh stop

# View logs
./docker.sh logs

# View app logs only
./docker.sh logs-app

# View database logs only
./docker.sh logs-db

# Check status
./docker.sh status

# Restart services
./docker.sh restart

# Rebuild containers
./docker.sh rebuild

# Open shell in app container
./docker.sh shell

# Open PostgreSQL shell
./docker.sh db-shell

# Clean up (removes containers, volumes, and networks)
./docker.sh clean

# Show help
./docker.sh help
```

## Local Development Setup

If you prefer to run the application locally without Docker:

### Prerequisites

- Node.js v20 or higher
- pnpm (or npm/yarn)
- PostgreSQL (or use Docker for just the database)

1. **Install dependencies:**

```bash
npm install
# or
pnpm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=hedera_stalker
DB_PASSWORD=hedera_stalker_password
DB_DATABASE=hedera_stalker

# Hedera Network Configuration
HEDERA_NETWORK=testnet
# Options: mainnet, testnet, previewnet

# Application Configuration
PORT=3000

# Security Configuration
# Generate password hash using: node scripts/generate-password-hash.js <your_password>
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here

# Notification Configuration (Optional - Telegram Bot)
# Set up Telegram notifications to get alerts when account balances are low
# See "Notifications" section below for setup instructions
# Users subscribe via bot commands - no need for TELEGRAM_CHAT_ID
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
# Bot username for dashboard floating button (e.g., hedera_stalker_bot for @hedera_stalker_bot)
TELEGRAM_BOT_USERNAME=hedera_stalker_bot
# Low balance threshold in HBAR (default: 1)
LOW_BALANCE_THRESHOLD=1
```

3. **Start PostgreSQL (if not using Docker):**

```bash
docker-compose up -d postgres
```

4. **Build and start the application:**

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at `http://localhost:3000`

## Usage

### Adding Accounts

Add accounts through the web dashboard:

1. Open the dashboard at `http://localhost:3000`
2. Click on "➕ Add Account" to expand the form
3. Enter the Hedera Account ID (format: `0.0.123456`)
4. Optionally add a friendly name
5. Enter the admin password
6. Click "Add Account"

The account will be added immediately and start being tracked!

### Viewing Dashboard

Open your browser and navigate to `http://localhost:3000` to see the dashboard with all your tracked accounts.

### API Endpoints

- `GET /api/dashboard/data` - Get dashboard data with all accounts and their changes
- `GET /api/accounts` - List all tracked accounts
- `POST /api/accounts` - Add a new account to track
- `GET /api/accounts/:id` - Get account details
- `PATCH /api/accounts/:id` - Update account (name, isActive)
- `DELETE /api/accounts/:id` - Remove an account
- `POST /api/scheduler/test-notification` - Test Telegram notification setup (sends to all subscribers)
- `POST /api/telegram/webhook` - Telegram webhook endpoint (handles bot commands)

## Notifications

The application uses a **subscription-based Telegram notification system**. Users can subscribe/unsubscribe via bot commands, and all subscribers receive notifications when account balances fall below the threshold (default: 1 HBAR).

### Setting Up Telegram Bot

1. **Create a Telegram Bot (or use existing):**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` command
   - Follow the prompts to name your bot
   - BotFather will give you a **bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - Copy the token
   - **Note**: The bot handle is `@hedera_stalker_bot` - users can find it at [t.me/hedera_stalker_bot](https://t.me/hedera_stalker_bot)

2. **Configure Environment Variables:**
   Add these to your `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_BOT_USERNAME=hedera_stalker_bot
   LOW_BALANCE_THRESHOLD=1
   ```
   
   **Note**: `TELEGRAM_BOT_USERNAME` is optional but recommended. If set, a floating button will appear on the dashboard that links to your Telegram bot. The bot username is the part after `@` in your bot's Telegram handle (e.g., `hedera_stalker_bot` for `@hedera_stalker_bot`).

3. **Set Up Webhook (Required for Bot Commands):**
   
   After starting your application, you need to configure Telegram to send updates to your webhook endpoint.
   
   **For local development:**
   - Use a tool like [ngrok](https://ngrok.com/) to expose your local server:
     ```bash
     ngrok http 3000
     ```
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
   - Set the webhook:
     ```bash
     curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://abc123.ngrok.io/api/telegram/webhook"
     ```
   
   **For production (CapRover/deployed apps):**
   - Set the webhook to your production URL:
     ```bash
     curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
     ```

4. **Subscribe to Notifications:**
   - Find the bot on Telegram: [@hedera_stalker_bot](https://t.me/hedera_stalker_bot)
   - Start a chat with the bot
   - Send `/start` or `/subscribe` command
   - You'll receive a confirmation message

### How It Works

- **Subscription System**: Users must subscribe via bot commands (`/start` or `/subscribe`) to receive notifications
- **Automatic Notifications**: The scheduler checks account balances every hour
- **Multi-User Support**: All active subscribers receive notifications when any account balance is below the threshold
- **Notification Content**:
  - Account name (if set) or account ID
  - Current balance
  - Threshold value

### Bot Commands

Users can interact with the bot using these commands:

- `/start` or `/subscribe` - Subscribe to balance notifications
- `/unsubscribe` - Stop receiving notifications
- `/status` - Check your subscription status
- `/check` - Perform a health check on the service (checks bot token, database, accounts, Hedera network, and threshold settings)
- `/help` - Show available commands

### Optional: Customize Threshold

You can set a custom threshold in your `.env` file:
```env
LOW_BALANCE_THRESHOLD=0.5  # Alert when balance is below 0.5 HBAR
```

### Testing Notifications

Send a POST request to test notifications:
```bash
curl -X POST http://localhost:3000/api/scheduler/test-notification
```

This will send a test message to all active subscribers.

### Disabling Notifications

If you don't want notifications, simply don't set `TELEGRAM_BOT_TOKEN`. The application will work normally without notifications. Users won't be able to subscribe if the bot token is not configured.

## Security

### Admin Password Protection

To prevent unauthorized users from adding accounts, you must generate a secure password hash and set it in the `ADMIN_PASSWORD_HASH` environment variable.

**Generate Password Hash:**

```bash
node scripts/generate-password-hash.js <your_password>
```

This will output a bcrypt hash. Copy it and add it to your `.env` file:

```env
ADMIN_PASSWORD_HASH=$2b$10$...
```

**Important Security Notes:**
- Never store the plain password in the code or environment variables
- The hash is safe to include in open-source code (it cannot be reversed to get the original password)
- If `ADMIN_PASSWORD_HASH` is not set, account creation is unrestricted
- Always set this in production environments

### Security Features

The application includes several security measures:

1. **Password Hashing**: Admin passwords are hashed using bcrypt (10 rounds)
2. **Input Validation**: All inputs are validated using class-validator decorators
3. **Input Sanitization**: 
   - Backend uses ValidationPipe with whitelist to strip unknown properties
   - Frontend escapes HTML to prevent XSS attacks
4. **Security Headers**: Helmet.js adds security headers (CSP, XSS protection, etc.)
5. **SQL Injection Protection**: TypeORM uses parameterized queries
6. **XSS Protection**: All user-generated content is escaped before display

## Scheduler

The application automatically fetches account balances every hour using NestJS's built-in scheduler. The scheduler runs at the top of each hour.

## Database Schema

- **accounts**: Stores account information (accountId, name, isActive)
- **balance_history**: Stores hourly balance snapshots (accountId, balance, recordedAt)
- **subscriptions**: Stores Telegram notification subscriptions (chatId, firstName, username, isActive, subscribedAt)

## Development

### Using Docker

```bash
# Start in development mode (rebuilds on changes)
./docker.sh start

# View logs
./docker.sh logs-app

# Access container shell
./docker.sh shell
```

### Local Development

```bash
# Run in development mode with watch
npm run start:dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## CapRover Deployment

This application is ready to deploy to CapRover. Here's how:

### Prerequisites

1. CapRover instance set up and running
2. PostgreSQL one-click app installed in CapRover (or a PostgreSQL instance accessible from your app)

### Deployment Steps

1. **Set up PostgreSQL in CapRover:**
   - Go to CapRover dashboard → One-Click Apps/Databases
   - Install PostgreSQL
   - Note the service name (usually `srv-captain--postgresql`)
   - Note the database credentials

2. **Create the app in CapRover:**
   - Go to Apps → Create New App
   - Name it (e.g., `hedera-stalker`)
   - Enable HTTPS if desired

3. **Connect your repository:**
   - Go to App Settings → App Configs
   - Connect your GitHub repository
   - Set branch to `main` (or your default branch)
   - CapRover will automatically detect the `captain-definition` file

4. **Set environment variables:**
   - Go to App Settings → App Configs → Environment Variables
   - Add the following:
     ```
     # Database Configuration
     DB_HOST=srv-captain--postgresql
     DB_PORT=5432
     DB_USERNAME=<your_postgres_user>
     DB_PASSWORD=<your_postgres_password>
     DB_DATABASE=hedera_stalker
     DB_SYNCHRONIZE=true
     DB_LOGGING=false
     
     # Note: DB_SYNCHRONIZE=true will automatically create tables on first run.
     # After initial deployment, set DB_SYNCHRONIZE=false for production safety.
     
     # Hedera Network
     HEDERA_NETWORK=mainnet
     
     # Security
     ADMIN_PASSWORD_HASH=<your_bcrypt_hash>
     
     # CORS (optional - comma-separated list of allowed origins)
     CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
     
     # Notifications (optional - Telegram Bot)
     # Users subscribe via bot commands - see README "Notifications" section
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
     TELEGRAM_BOT_USERNAME=hedera_stalker_bot
     LOW_BALANCE_THRESHOLD=1
     # After deployment, set webhook: curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
     
     # Environment
     NODE_ENV=production
     ```
   - To generate password hash: `node scripts/generate-password-hash.js <your_password>`
   - **Database Setup**: `DB_SYNCHRONIZE=true` will automatically create tables on first deployment. After initial setup, you can set it to `false` for production safety (recommended).

5. **Deploy:**
   - Click "Save & Update" in App Configs
   - CapRover will build and deploy automatically
   - The app will be available at your CapRover domain

### Important Notes for CapRover

- The app listens on the `PORT` environment variable (CapRover sets this automatically)
- Database connection uses the PostgreSQL service name (e.g., `srv-captain--postgresql`)
- Make sure PostgreSQL is accessible from your app container
- Health checks are configured for automatic recovery (endpoint: `/health`)
- **Database Tables**: Tables are automatically created on first deployment with `DB_SYNCHRONIZE=true` (default). After initial setup, you can set `DB_SYNCHRONIZE=false` for production safety.
- Configure `CORS_ORIGINS` with your actual domain(s) for production security

## Production Considerations

1. Set `synchronize: false` in `app.module.ts` TypeORM configuration and use migrations
2. Use environment-specific configuration
3. Set up proper logging
4. Configure CORS appropriately
5. Use a reverse proxy (nginx) for production
6. Set up proper database backups
7. For CapRover: Use HTTPS and set up proper domain names

## License

This project is licensed under a **Personal Use License**. 

### Free for Personal Use
- ✅ Personal, non-commercial use
- ✅ Educational purposes
- ✅ Research and development
- ✅ Open source projects (non-commercial)
- ✅ Forking and modification for personal use

### Commercial Use Requires Paid License
- ❌ Commercial business or for-profit organizations
- ❌ Use as part of a service or product offered to customers
- ❌ Use in applications that generate revenue
- ❌ Government agencies or contractors

**For commercial licensing inquiries**, please contact the repository owner.

See the [LICENSE](LICENSE) file for full terms and conditions.

