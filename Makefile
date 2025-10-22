.PHONY: help build up down restart logs clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Tail logs from all services
	docker-compose logs -f

logs-backend: ## Tail logs from backend
	docker-compose logs -f backend

logs-rag: ## Tail logs from RAG service
	docker-compose logs -f rag_service

logs-dashboard: ## Tail logs from dashboard
	docker-compose logs -f dashboard

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

test-backend: ## Run backend tests
	cd backend && go test ./...

test-rag: ## Run RAG service tests
	cd rag_service && pytest tests/

test-integration: ## Run integration tests
	./scripts/integration_test.sh

init-db: ## Initialize database with schema
	docker-compose exec postgres psql -U ai_support_user -d ai_support -f /docker-entrypoint-initdb.d/init_db.sql

seed-data: ## Seed database with sample data
	python scripts/seed_data.py

setup: ## Initial setup (copy .env, build, start)
	cp .env.example .env
	@echo "Please edit .env with your API keys"
	@echo "Then run: make build && make up"

health: ## Check health of all services
	@echo "Backend health:"
	@curl -s http://localhost:8080/api/health | jq .
	@echo "\nRAG service health:"
	@curl -s http://localhost:8000/health | jq .
	@echo "\nDashboard: http://localhost:3000"
	@echo "Grafana: http://localhost:3001"
	@echo "Prometheus: http://localhost:9090"

monitor: ## Open monitoring tools
	@echo "Opening monitoring tools..."
	@open http://localhost:3001 || xdg-open http://localhost:3001 || start http://localhost:3001

dev-backend: ## Run backend in development mode
	cd backend && air

dev-rag: ## Run RAG service in development mode
	cd rag_service && uvicorn app:app --reload --host 0.0.0.0 --port 8000

dev-dashboard: ## Run dashboard in development mode
	cd dashboard && npm run dev

install-backend: ## Install backend dependencies
	cd backend && go mod download

install-rag: ## Install RAG service dependencies
	cd rag_service && pip install -r requirements.txt

install-dashboard: ## Install dashboard dependencies
	cd dashboard && npm install

install-all: install-backend install-rag install-dashboard ## Install all dependencies

format-backend: ## Format backend code
	cd backend && go fmt ./...

format-rag: ## Format RAG service code
	cd rag_service && black . && isort .

lint-backend: ## Lint backend code
	cd backend && golangci-lint run

lint-rag: ## Lint RAG service code
	cd rag_service && flake8 . && mypy .

ps: ## Show running containers
	docker-compose ps

stats: ## Show container stats
	docker stats

backup-db: ## Backup PostgreSQL database
	docker-compose exec postgres pg_dump -U ai_support_user ai_support > backup_$$(date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore PostgreSQL database (use: make restore-db FILE=backup.sql)
	cat $(FILE) | docker-compose exec -T postgres psql -U ai_support_user ai_support

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

psql: ## Open PostgreSQL CLI
	docker-compose exec postgres psql -U ai_support_user -d ai_support

