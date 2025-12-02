"use client";
import { useEffect, useState } from "react";

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Carrega os tickets da API
  const loadTickets = () => {
    fetch("http://127.0.0.1:8000/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => console.error("Erro:", err));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  //Atualiza Status/Prioridade (Aciona o Webhook no Backend)
  const handleUpdate = async (id: number, field: string, value: string) => {
    if(!confirm(`Deseja alterar ${field} para "${value}"?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (res.ok) {
        alert("Atualizado com sucesso!");
        loadTickets(); // Recarrega a tabela
      }
    } catch (error) {
      alert("Erro ao atualizar ticket.");
    }
  };

  // Filtro de busca
  const filteredTickets = tickets.filter((t) =>
    t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold">📥 Inbox de Atendimento</h1>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-lg shadow-sm border">
            &larr; Voltar ao Dashboard
          </a>
        </div>

        {/* Barra de Busca */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="🔎 Buscar por nome do cliente ou assunto..."
            className="w-full p-4 pl-12 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabela */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="p-4 w-16 text-center">ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Assunto / Canal</th>
                  <th className="p-4 w-32 text-center">Status</th>
                  <th className="p-4 w-32 text-center">Prioridade</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-blue-50 transition duration-75">
                    <td className="p-4 text-center text-gray-400 font-mono">#{ticket.id}</td>
                    <td className="p-4 font-medium text-gray-900">{ticket.customer_name}</td>
                    <td className="p-4">
                      <div className="text-gray-900">{ticket.subject}</div>
                      <span className="text-xs text-gray-400 capitalize">{ticket.channel}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === 'closed' ? 'bg-gray-100 text-gray-600' : 
                        ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      {/* Botão Fechar */}
                      {ticket.status !== 'closed' && (
                        <button 
                          onClick={() => handleUpdate(ticket.id, "status", "closed")}
                          className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition"
                          title="Fechar Ticket"
                        >
                          ✔ Fechar
                        </button>
                      )}
                      
                      {/* Botão Prioridade Alta */}
                      {ticket.priority !== 'high' && (
                        <button 
                          onClick={() => handleUpdate(ticket.id, "priority", "high")}
                          className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 shadow-sm transition"
                          title="Marcar como Urgente"
                        >
                          🔥 Urgente
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTickets.length === 0 && (
            <div className="p-8 text-center text-gray-400">Nenhum ticket encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}