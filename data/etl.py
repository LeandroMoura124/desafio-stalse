import pandas as pd
import json
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Caminho para ler o CSV (Raw)
RAW_PATH = os.path.join(BASE_DIR, "raw", "olist_orders_dataset.csv")
# Caminho para salvar o JSON (Processed)
PROCESSED_PATH = os.path.join(BASE_DIR, "processed", "metrics.json")

def process_data():
    print(f"Iniciando processamento do arquivo: {RAW_PATH}")
    
    # Verifica se o arquivo existe antes de tentar ler
    if not os.path.exists(RAW_PATH):
        print(f"ERRO: Arquivo não encontrado em {RAW_PATH}")
        print("Certifique-se de que o arquivo 'olist_orders_dataset.csv' está na pasta data/raw/")
        return

    try:
        # Leitura e Limpeza 
        
        #Lendo apenas as colunas necessárias para economizar memória
        # order_id: para contagem
        # order_status: para saber se foi entregue, cancelado, etc.
        # order_purchase_timestamp: para saber quando ocorreu a venda
        cols = ['order_id', 'order_status', 'order_purchase_timestamp']
        
        df = pd.read_csv(RAW_PATH, usecols=cols)
        print(f" Arquivo carregado! Total de registros brutos: {len(df)}")

        # Converte a coluna de data para data real do Python
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])


        #Total Geral de Pedidos
        total_orders = int(len(df))

        #Pedidos por Status
        orders_by_status = df['order_status'].value_counts().to_dict()

        #Pedidos por Ano e cria uma coluna temporaria só com o ano e conta
        df['year'] = df['order_purchase_timestamp'].dt.year
        orders_by_year = df['year'].value_counts().sort_index().to_dict()

        # Monta o dicionário final que a API vai ler
        metrics_payload = {
            "dataset_source": "Olist E-Commerce (Kaggle)",
            "last_update": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
            "kpi_total_tickets": total_orders, 
            "breakdown_by_status": orders_by_status,
            "breakdown_by_year": orders_by_year
        }

        # garantindo que a pasta processed existe
        os.makedirs(os.path.dirname(PROCESSED_PATH), exist_ok=True)
        
        #salva o arquivo JSON
        with open(PROCESSED_PATH, "w", encoding='utf-8') as f:
            json.dump(metrics_payload, f, indent=4)
        
        print("-" * 40)
        print(" SUCESSO! ETL Finalizado.")
        print(f" Métricas salvas em: {PROCESSED_PATH}")
        print("-" * 40)

    except Exception as e:
        print(f" Erro fatal no ETL: {e}")

if __name__ == "__main__":
    process_data()
    