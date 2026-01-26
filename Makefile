# EDH Builder - Docker Commands
# Usage: make <command>

.PHONY: help build build-prod up down restart logs logs-app logs-db shell shell-db \
        db-push db-migrate db-studio db-seed db-generate clean clean-all prune \
        up-prod down-prod logs-prod status health lint lint-fix typecheck format

# Default target
help:
	@echo "EDH Builder - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make build       - Build development containers"
	@echo "  make up          - Start development environment"
	@echo "  make down        - Stop development environment"
	@echo "  make restart     - Restart development environment"
	@echo "  make logs        - View all container logs"
	@echo "  make logs-app    - View app container logs"
	@echo "  make logs-db     - View database container logs"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell       - Open shell in app container"
	@echo "  make shell-db    - Open psql in database container"
	@echo ""
	@echo "Database:"
	@echo "  make db-push     - Push Prisma schema to database"
	@echo "  make db-migrate  - Run Prisma migrations"
	@echo "  make db-studio   - Open Prisma Studio (browser)"
	@echo "  make db-seed     - Seed the database"
	@echo "  make db-generate - Regenerate Prisma client"
	@echo ""
	@echo "Production:"
	@echo "  make build-prod  - Build production image"
	@echo "  make up-prod     - Start production environment"
	@echo "  make down-prod   - Stop production environment"
	@echo "  make logs-prod   - View production logs"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint        - Run ESLint"
	@echo "  make lint-fix    - Run ESLint with auto-fix"
	@echo "  make typecheck   - Run TypeScript type check"
	@echo "  make format      - Run Prettier"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Stop containers and remove volumes"
	@echo "  make clean-all   - Remove all containers, images, and volumes"
	@echo "  make prune       - Docker system prune"

# ===========================================
# Development Commands
# ===========================================

build:
	docker compose build

up:
	docker compose up -d
	@echo ""
	@echo "EDH Builder is starting..."
	@echo "App: http://localhost:3001"
	@echo ""
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Running database push..."
	@$(MAKE) db-push
	@echo ""
	@echo "Development environment ready!"

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

logs-db:
	docker compose logs -f db

# ===========================================
# Shell Access
# ===========================================

shell:
	docker compose exec app zsh 

shell-db:
	docker compose exec db psql -U edh_user -d edh_builder

# ===========================================
# Database Commands
# ===========================================

db-push:
	docker compose exec app pnpm db:push

db-migrate:
	docker compose exec app pnpm db:migrate

db-studio:
	docker compose --profile tools up -d prisma-studio
	@echo "Prisma Studio available at http://localhost:5555"

db-seed:
	docker compose exec app pnpm db:seed

db-generate:
	docker compose exec app pnpm db:generate

# ===========================================
# Production Commands
# ===========================================

build-prod:
	docker compose -f docker-compose.prod.yml build

up-prod:
	docker compose -f docker-compose.prod.yml up -d

down-prod:
	docker compose -f docker-compose.prod.yml down

logs-prod:
	docker compose -f docker-compose.prod.yml logs -f

# ===========================================
# Code Quality
# ===========================================

lint:
	docker compose exec app pnpm lint

lint-fix:
	docker compose exec app pnpm lint:fix

typecheck:
	docker compose exec app pnpm typecheck

format:
	docker compose exec app pnpm format

# ===========================================
# Cleanup Commands
# ===========================================

clean:
	docker compose down -v
	@echo "Containers stopped and volumes removed"

clean-all:
	docker compose down -v --rmi all
	docker compose -f docker-compose.prod.yml down -v --rmi all 2>/dev/null || true
	@echo "All containers, volumes, and images removed"

prune:
	docker system prune -af
	@echo "Docker system pruned"

# ===========================================
# Utility
# ===========================================

status:
	docker compose ps

health:
	@echo "App health:"
	@curl -s http://localhost:3001/api/health || echo "App not responding"
	@echo ""
	@echo "Database health:"
	@docker compose exec db pg_isready -U edh_user -d edh_builder
