import { useEffect, useState } from 'react';
import { getTickets, createTicket } from './api';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTickets();
      // The API returns { success, data: { tickets: [...], pagination: {...} } }
      setTickets(response.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    try {
      await createTicket({ 
        title, 
        description, 
        user_id: 1, 
        organisation_id: 1,
        status: 'open'
      });
      
      // Refresh the list after creating
      await fetchTickets();
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'system-ui' }}>
        <h1>Ticketing MVP</h1>
        <p>Loading tickets...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Ticketing MVP</h1>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          color: '#c33'
        }}>
          Error: {error}
        </div>
      )}

      {/* Table view */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>ID</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Title</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Status</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>User</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Organisation</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                No tickets found
              </td>
            </tr>
          ) : (
            tickets.map(ticket => (
              <tr key={ticket.id}>
                <td style={{ padding: '4px 0' }}>{ticket.id}</td>
                <td>{ticket.title}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: 
                      ticket.status === 'open' ? '#e3f2fd' :
                      ticket.status === 'pending' ? '#fff3e0' :
                      ticket.status === 'closed' ? '#e8f5e8' :
                      '#f3e5f5',
                    color: 
                      ticket.status === 'open' ? '#1976d2' :
                      ticket.status === 'pending' ? '#f57c00' :
                      ticket.status === 'closed' ? '#388e3c' :
                      '#7b1fa2'
                  }}>
                    {ticket.status}
                  </span>
                </td>
                <td>{ticket.user?.name || ticket.user_name || 'Unknown'}</td>
                <td>{ticket.organisation?.name || ticket.organisation_name || 'Unknown'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>Create ticket</h2>
      <input
        style={{ width: '100%', padding: 8 }}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
      />
      <textarea
        style={{ width: '100%', padding: 8, marginTop: 8 }}
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button 
        style={{ marginTop: 8, padding: '8px 16px' }} 
        onClick={handleCreate}
        disabled={!title.trim()}
      >
        Create
      </button>
    </main>
  );
}

export default App;
