import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets, createTicket, updateTicket, deleteTicket, logout, getCurrentUserFromStorage } from '../api';

function Tickets({ onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUserFromStorage();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchTickets();
  }, []); // Remove navigate dependency to prevent infinite loops

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTickets();
      // Backend wraps data in a "data" field via sendSuccess()
      const tickets = response.data?.tickets || response.tickets || [];
      setTickets(tickets);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    try {
      await createTicket({ 
        title, 
        description, 
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

  const handleEdit = (ticket) => {
    setEditingTicket(ticket.id);
    setEditForm({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status
    });
  };

  const handleCancelEdit = () => {
    setEditingTicket(null);
    setEditForm({ title: '', description: '', status: '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      await updateTicket(editingTicket, editForm);
      await fetchTickets(); // Refresh the list
      setEditingTicket(null);
      setEditForm({ title: '', description: '', status: '' });
      setError(null);
    } catch (err) {
      console.error('Failed to update ticket:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (ticketId, ticketTitle) => {
    if (!window.confirm(`Are you sure you want to delete ticket "${ticketTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTicket(ticketId);
      await fetchTickets(); // Refresh the list
      setError(null);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear local state immediately
      setUser(null);
      // Update app authentication state
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Clear local state and navigate even if logout request fails
      setUser(null);
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 1200, margin: '2rem auto', fontFamily: 'system-ui' }}>
        <h1>Ticketing System</h1>
        <p>Loading tickets...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Ticketing System</h1>
          {user && (
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '14px' }}>
              Welcome, {user.name} ({user.email})
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>

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

      {/* Create Ticket Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Create New Ticket</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            style={{ 
              flex: 1, 
              minWidth: '200px',
              padding: '12px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ticket title"
          />
          <input
            style={{ 
              flex: 2, 
              minWidth: '300px',
              padding: '12px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ticket description (optional)"
          />
          <button 
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }} 
            onClick={handleCreate}
            disabled={!title.trim()}
          >
            Create Ticket
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>
            Tickets ({tickets.length})
          </h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>ID</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Title</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Description</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Status</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Created By</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Organization</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>Created</th>
                <th style={{ 
                  borderBottom: '1px solid #dee2e6', 
                  textAlign: 'center',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057',
                  width: '140px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    No tickets found. Create your first ticket above!
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#495057'
                    }}>{ticket.id}</td>
                    
                                         {/* Title - editable */}
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#212529'
                    }}>
                      {editingTicket === ticket.id ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        ticket.title
                      )}
                    </td>
                    
                    {/* Description - editable */}
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#495057',
                      maxWidth: '200px'
                    }}>
                      {editingTicket === ticket.id ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '40px',
                            resize: 'vertical'
                          }}
                          placeholder="Enter description..."
                        />
                      ) : (
                        <span style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {ticket.description || 'No description'}
                        </span>
                      )}
                    </td>
                    
                    {/* Status - editable */}
                    <td style={{ padding: '12px 16px' }}>
                      {editingTicket === ticket.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            minWidth: '120px'
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: 
                            ticket.status === 'open' ? '#e3f2fd' :
                            ticket.status === 'pending' ? '#fff3e0' :
                            ticket.status === 'in_progress' ? '#e8f5e8' :
                            ticket.status === 'closed' ? '#f3e5f5' :
                            ticket.status === 'resolved' ? '#e8f5e8' :
                            '#f5f5f5',
                          color: 
                            ticket.status === 'open' ? '#1976d2' :
                            ticket.status === 'pending' ? '#f57c00' :
                            ticket.status === 'in_progress' ? '#388e3c' :
                            ticket.status === 'closed' ? '#7b1fa2' :
                            ticket.status === 'resolved' ? '#388e3c' :
                            '#6c757d'
                        }}>
                          {ticket.status}
                        </span>
                      )}
                    </td>
                    
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#495057'
                    }}>{ticket.user?.name || ticket.user_name || 'Unknown'}</td>
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#495057'
                    }}>{ticket.organisation?.name || ticket.organisation_name || 'Unknown'}</td>
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    
                    {/* Actions column */}
                    <td style={{ 
                      padding: '12px 16px',
                      textAlign: 'center'
                    }}>
                      {editingTicket === ticket.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(ticket)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(ticket.id, ticket.title)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default Tickets; 