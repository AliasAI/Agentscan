"""FastAPI application entry point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.db.database import engine, Base
from src.api import stats, agents, sync, networks, activities, classification
from src.services.scheduler import start_scheduler, shutdown_scheduler
from src.db.migrate_add_contracts import migrate as migrate_contracts
from src.db.migrate_add_oasf_fields import migrate as migrate_oasf
from src.db.migrate_add_classification_source import migrate as migrate_classification_source
from src.db.migrate_multi_network import migrate as migrate_multi_network
from src.db.init_networks import init_networks

# Create database tables
Base.metadata.create_all(bind=engine)

# Run migrations
try:
    migrate_contracts()
    migrate_oasf()
    migrate_classification_source()
    migrate_multi_network()
except Exception as e:
    print(f"Migration warning: {e}")

# Initialize networks data
init_networks()

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(stats.router, prefix="/api", tags=["stats"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(activities.router, prefix="/api", tags=["activities"])
app.include_router(sync.router, prefix="/api", tags=["sync"])
app.include_router(networks.router, prefix="/api", tags=["networks"])
app.include_router(classification.router, prefix="/api", tags=["classification"])


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    # Start blockchain sync scheduler
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    # Shutdown scheduler
    shutdown_scheduler()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "8004scan API",
        "version": settings.app_version,
        "docs": "/docs"
    }
