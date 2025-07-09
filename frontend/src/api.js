// All API calls live here.
// TODO: Replace the placeholders with real fetch/axios calls to your Express backend.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Tickets -------------
export async function getTickets() {
  // Example:
  // const res = await fetch(`${API_URL}/tickets`);
  // return res.json();
  return []; // remove when implemented
}

export async function createTicket(data) {
  // await fetch(`${API_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

export async function updateTicketStatus(id, status) {
  // await fetch(`${API_URL}/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
}

export async function deleteTicket(id) {
  // await fetch(`${API_URL}/tickets/${id}`, { method: 'DELETE' });
}
