"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    //busca os dados da API Python - (FastAPI)
    fetch("http://127.0.0.1:8000/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Erro ao buscar métricas:", err));
  }, []);

  if (!metrics) return (
    <div className="flex items-center justify-center min-h-screen text-gray-600">
      Carregando dashboard... (Verifique se o backend está rodando!)
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">📊 Dashboard Mini Inbox</h1>
        
        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Total */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total de Pedidos</h2>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">{metrics.kpi_total_tickets}</p>
          </div>

          {/* Card 2: Status (Ex: Entregues) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Entregues (Delivered)</h2>
            <p className="text-4xl font-extrabold text-green-600 mt-2">
              {metrics.breakdown_by_status?.delivered || 0}
            </p>
          </div>

          {/* Card 3: Fonte de Dados */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Fonte dos Dados</h2>
            <p className="text-lg font-bold text-gray-800 mt-2">Kaggle / Olist</p>
            <p className="text-xs text-gray-400 mt-1">Atualizado em: {metrics.last_update}</p>
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="text-center">
          <a 
            href="/tickets" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out shadow-lg"
          >
            Ver Tickets de Suporte &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}