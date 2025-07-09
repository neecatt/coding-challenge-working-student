import { useEffect, useState } from 'react';
import { getTickets, createTicket } from './api';

function App() {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getTickets();
      setTickets(data);
    })();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createTicket({ title, description, user_id: 1, organisation_id: 1 });
    // TODO: refresh list afterwards
    setTitle('');
    setDescription('');
  };

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Ticketing MVP</h1>

      {/* Table view */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>ID</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Title</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr /* BUG: missing key prop here */>
              <td style={{ padding: '4px 0' }}>{ticket.id}</td>
              <td>{ticket.title}</td>
              <td>{ticket.status}</td>
            </tr>
          ))}
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
      <button style={{ marginTop: 8 }} onClick={handleCreate}>Create</button>
    </main>
  );
}

export default App;
