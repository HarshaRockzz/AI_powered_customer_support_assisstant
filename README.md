# AI-Powered Customer Support Assistant


## ✨ Features

- 🤖 **AI-Powered Support** - Using Groq's Llama 3.3 70B (100% FREE!)
- 🧠 **RAG Technology** - Retrieval Augmented Generation for accurate context-aware answers
- 📊 **Analytics Dashboard** - Real-time performance tracking and insights
- 📄 **Document Management** - Upload and manage your knowledge base
- 🎨 **Stunning UI** - Modern glassmorphic design with particle effects
- 🐳 **Docker Ready** - Deploy anywhere with Docker
- 🔒 **Secure** - Rate limiting, authentication, and monitoring built-in

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TailwindCSS** - Utility-first CSS
- **Chart.js** - Beautiful charts and graphs
- **TypeScript** - Type-safe JavaScript

### Backend
- **Go (Gin)** - High-performance API server
- **PostgreSQL** - Relational database
- **Redis** - Caching layer
- **GORM** - ORM for Go

### AI/ML
- **Python 3.11** - ML service runtime
- **FastAPI** - Modern Python API framework
- **LangChain** - RAG framework
- **Groq** - FREE LLM provider (Llama 3.3 70B)
- **HuggingFace** - FREE embeddings
- **Qdrant Cloud** - FREE vector database

### DevOps
- **Docker & Docker Compose** - Containerization
- **Prometheus & Grafana** - Monitoring
- **GitHub Actions** - CI/CD
- **Render.com** - Deployment platform

### Prerequisites
- GitHub account
- Render.com account (free)
- Groq API key (free from [console.groq.com](https://console.groq.com))
- Qdrant Cloud account (free from [cloud.qdrant.io](https://cloud.qdrant.io))

### Step 1: Get API Keys

**Groq API Key (FREE):**
1. Go to https://console.groq.com
2. Sign up / Log in
3. Navigate to API Keys
4. Create new API key
5. Copy and save it

**Qdrant Cloud (FREE):**
1. Go to https://cloud.qdrant.io
2. Sign up / Log in
3. Create a cluster (FREE tier: 1GB)
4. Copy your cluster URL and API key

### Step 2: Deploy to Render

1. **Fork this repository**
2. **Sign up at [Render.com](https://dashboard.render.com/register)**
3. **Connect GitHub account**
4. **Create services in this order:**

#### a) PostgreSQL Database
- Click "New +" → "PostgreSQL"
- Name: `ai-support-postgres`
- Database: `ai_support_db`
- User: `ai_support`
- Plan: **Free**
- Save internal connection details

#### b) Redis Cache
- Click "New +" → "Redis"
- Name: `ai-support-redis`
- Plan: **Free**
- Save internal connection URL

#### c) RAG Service (AI Brain)
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Name: `ai-support-rag`
- Environment: **Docker**
- Dockerfile Path: `./Dockerfile.rag`
- Instance Type: **Free**

**Environment Variables:**
```env
LLM_PROVIDER=groq
EMBEDDING_PROVIDER=huggingface
GROQ_API_KEY=<your_groq_api_key>
GROQ_MODEL=llama-3.3-70b-versatile
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DB=qdrant
QDRANT_URL=<your_qdrant_cloud_url>
QDRANT_API_KEY=<your_qdrant_api_key>
QDRANT_COLLECTION_NAME=customer_support_docs
RAG_SERVICE_PORT=8000
```

#### d) Backend API
- Click "New +" → "Web Service"
- Connect your repo
- Name: `ai-support-backend`
- Dockerfile Path: `./Dockerfile.backend`
- Instance Type: **Free**

**Environment Variables:**
```env
SERVER_PORT=8080
RAG_SERVICE_URL=https://ai-support-rag.onrender.com
POSTGRES_HOST=<from_postgres_internal_url>
POSTGRES_PORT=5432
POSTGRES_USER=ai_support
POSTGRES_PASSWORD=<from_postgres>
POSTGRES_DB=ai_support_db
REDIS_HOST=<from_redis_internal_url>
REDIS_PORT=6379
```

#### e) Dashboard (Frontend)
- Click "New +" → "Web Service"
- Connect your repo
- Name: `ai-support-dashboard`
- Dockerfile Path: `./Dockerfile.dashboard`
- Instance Type: **Free**

**Environment Variables:**
```env
NEXT_PUBLIC_BACKEND_URL=https://ai-support-backend.onrender.com
PORT=3000
```

### Step 3: Access Your App

After all services show "Live" (5-10 minutes):

- **Dashboard**: `https://ai-support-dashboard.onrender.com`
- **Backend API**: `https://ai-support-backend.onrender.com/health`
- **RAG Service**: `https://ai-support-rag.onrender.com/health`

## 💻 Local Development

### Prerequisites
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/HarshaRockzz/ai-customer-support.git
cd ai-customer-support

# Create .env file
cp .env.example .env

# Edit .env and add your keys:
# - GROQ_API_KEY
# - QDRANT_URL
# - QDRANT_API_KEY
nano .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access the dashboard
open http://localhost:3000
```

## 📊 Services

| Service | Local Port | Description |
|---------|------------|-------------|
| Dashboard | 3000 | Next.js UI |
| Backend | 8080 | Go API |
| RAG Service | 8000 | Python AI Service |
| PostgreSQL | 5432 | Database |
| Redis | 6380 | Cache |
| Grafana | 3001 | Monitoring Dashboard |
| Prometheus | 9090 | Metrics Collector |

## 🎯 Usage

### 1. Upload Documents
- Navigate to `/documents`
- Upload your knowledge base files (PDF, TXT, MD)
- Documents are processed and vectorized

### 2. Start Chatting
- Go to home page
- Ask questions about your documents
- Get AI-powered, context-aware answers

### 3. View Analytics
- Navigate to `/analytics`
- Monitor query performance
- Track user interactions
- View system metrics

### 4. Configure Settings
- Go to `/settings`
- Adjust AI parameters
- Manage API configurations

## 📖 Architecture

```
┌─────────────────┐
│   Dashboard     │  Next.js + TailwindCSS
│   (Frontend)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Backend API   │  Go + Gin + PostgreSQL + Redis
│   (Orchestrator)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   RAG Service   │  Python + FastAPI + LangChain
│   (AI Brain)    │  Groq LLM + HF Embeddings
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Qdrant Cloud  │  Vector Database
│   (Knowledge)   │
└─────────────────┘
```

## 🔒 Security Features

- **Rate Limiting** - Prevents abuse
- **CORS Protection** - Secure cross-origin requests
- **Input Validation** - Sanitized user inputs
- **API Key Management** - Secure credential storage
- **Logging & Monitoring** - Track all activities

## 📊 Monitoring

- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Health Checks** - Service availability monitoring
- **Error Tracking** - Centralized error logging

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing)
- **Groq LLM**: FREE (10,000 requests/day)
- **HuggingFace Embeddings**: FREE (unlimited)
- **Qdrant Cloud**: FREE (1GB storage)
- **Render.com**: FREE (750 hours/month per service)
- **Total: $0/month** ✅

### Production Tier (Recommended)
- **Render Services**: $7/service × 3 = $21/month
- **PostgreSQL**: $7/month (10GB)
- **Redis**: $10/month (1GB)
- **Qdrant Cloud**: $25/month (5GB)
- **Total: ~$63/month** for production-grade

## 🙏 Acknowledgments

- [Groq](https://groq.com) - Free LLM API
- [HuggingFace](https://huggingface.co) - Free embeddings
- [Qdrant](https://qdrant.tech) - Vector database
- [Render.com](https://render.com) - Deployment platform
- [LangChain](https://langchain.com) - RAG framework
