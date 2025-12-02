import json
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import requests # usando requests para chamar o n8n

#Configuração de Banco de Dados (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./db.sqlite"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelo do Banco 
class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    customer_name = Column(String)
    channel = Column(String) 
    subject = Column(String)
    status = Column(String) # open, pending, closed
    priority = Column(String) # low, medium, high

# --- Pydantic 
class TicketUpdate(BaseModel):
    # ---------- Padronizando o exemplo de entrada no Swagger 
    status: Optional[str] = Field(None, example="closed")
    priority: Optional[str] = Field(None, example="high")
  
    

class TicketOut(BaseModel):
    id: int
    created_at: datetime
    customer_name: str
    channel: str
    subject: str
    status: str
    priority: str

    class Config:
        orm_mode = True

app = FastAPI(title="Mini Inbox API")

origins = [
    "http://localhost:3000",  # endereço Frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Dependência para pegar o banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# evento de Startup
@app.on_event("startup")
def startup_event():
    # Cria as tabelas
    Base.metadata.create_all(bind=engine)
    
    # Verifica se já tem dados, se não tiver, popula com o JSON
    db = SessionLocal()
    if db.query(Ticket).count() == 0:
        print("Banco vazio. Populando seeds...")
        try:
            with open("seeds/tickets.json", "r", encoding="utf-8") as f:
                tickets_data = json.load(f)
                for item in tickets_data:
                    db_ticket = Ticket(**item)
                    db.add(db_ticket)
                db.commit()
                print("Seeds inseridos com sucesso!")
        except Exception as e:
            print(f"Erro ao carregar seeds: {e}")
    db.close()


#Endpoints

@app.get("/tickets", response_model=List[TicketOut])
def read_tickets(db: Session = Depends(get_db)):
    """Lista todos os tickets simples."""
    return db.query(Ticket).all() # 

@app.patch("/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, ticket: TicketUpdate, db: Session = Depends(get_db)):
    """Altera status ou prioridade e dispara gatilho."""
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Atualiza os campos
    if ticket.status:
        db_ticket.status = ticket.status
    if ticket.priority:
        db_ticket.priority = ticket.priority
    
    
    db.commit()
    db.refresh(db_ticket)

    # Request no n8n (Webhook) 
    # se status virou 'closed' ou prioridade virou 'high'
    if ticket.status == "closed" or ticket.priority == "high":
        print(f"🚀 Disparando Webhook para o Ticket {ticket_id}...")
        
        webhook_url = "https://webhook.site/77d547f1-d09b-445b-9dc7-4d9d7586c451"
        # Optei por URL temporária (Webhook.site) para validar a integração com n8n sem necessidade de túnel local

        payload = {
            "event": "ticket_updated",
            "ticket_id": db_ticket.id,
            "new_status": db_ticket.status,
            "new_priority": db_ticket.priority,
            "customer": db_ticket.customer_name,
            "updated_at": str(datetime.utcnow())
        }
        
        try:
            # Envia os dados para fora (timeout curto para não travar a API)
            response = requests.post(webhook_url, json=payload, timeout=5)
            print(f" Webhook enviado! Status Code: {response.status_code}")
        except Exception as e:
            print(f" Erro ao chamar Webhook: {e}")

    return db_ticket

@app.get("/metrics")
def get_metrics():
    """Lê o arquivo JSON gerado pelo Pandas e retorna."""
    #Caminho pasta data/processed
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "metrics.json")
    
    if not os.path.exists(file_path):
        return {"error": "Métricas ainda não processadas via ETL."}
    
    with open(file_path, "r") as f:
        data = json.load(f)
    return data 