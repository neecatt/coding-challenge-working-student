import { BaseApiService } from './BaseApiService.js';
import { QueryParameterBuilder } from '../builders/QueryParameterBuilder.js';

//Ticket-specific operations
export class TicketService extends BaseApiService {
  /**
   * Get all tickets with optional filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by ticket status
   * @param {number} filters.organisation_id - Filter by organisation ID
   * @param {number} filters.user_id - Filter by user ID
   * @param {number} filters.limit - Number of records to return (default: 50)
   * @param {number} filters.offset - Number of records to skip (default: 0)
   * @returns {Promise<Object>} Tickets data with pagination info
   */
  async getTickets(filters = {}) {
    const queryString = QueryParameterBuilder.build(filters);
    const endpoint = `/tickets${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }
  
  /**
   * Get a specific ticket by ID
   * @param {number} id - Ticket ID
   * @returns {Promise<Object>} Ticket data
   */
  async getTicketById(id) {
    return this.get(`/tickets/${id}`);
  }
  
  /**
   * Create a new ticket
   * @param {Object} data - Ticket data
   * @param {string} data.title - Ticket title (required)
   * @param {string} data.description - Ticket description
   * @param {number} data.user_id - User ID (required)
   * @param {number} data.organisation_id - Organisation ID (required)
   * @param {string} data.status - Ticket status (default: 'open')
   * @returns {Promise<Object>} Created ticket data
   */
  async createTicket(data) {
    return this.post('/tickets', data);
  }
  
  /**
   * Update a ticket
   * @param {number} id - Ticket ID
   * @param {Object} data - Update data
   * @param {string} data.title - New title
   * @param {string} data.description - New description
   * @param {string} data.status - New status
   * @param {number} data.user_id - New user ID
   * @param {number} data.organisation_id - New organisation ID
   * @returns {Promise<Object>} Updated ticket data
   */
  async updateTicket(id, data) {
    return this.patch(`/tickets/${id}`, data);
  }
  
  /**
   * Update ticket status (convenience function)
   * @param {number} id - Ticket ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated ticket data
   */
  async updateTicketStatus(id, status) {
    return this.updateTicket(id, { status });
  }
  
  /**
   * Delete a ticket
   * @param {number} id - Ticket ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteTicket(id) {
    return this.delete(`/tickets/${id}`);
  }
} 