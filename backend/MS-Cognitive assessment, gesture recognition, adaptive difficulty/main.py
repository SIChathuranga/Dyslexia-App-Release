from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router, assessment_history_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth")
app.include_router(assessment_history_router.router, prefix="/assessment-history")
