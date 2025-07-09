// Main API module - Interface Segregation: Provides clean public interface
import { ApiFactory } from './factories/ApiFactory.js';
import { ApiError } from './errors.js';

// Create default instance
const ticketService = ApiFactory.createTicketService();

// Export functions for backward compatibility - Interface Segregation
export const getTickets = (filters) => ticketService.getTickets(filters);
export const getTicketById = (id) => ticketService.getTicketById(id);
export const createTicket = (data) => ticketService.createTicket(data);
export const updateTicket = (id, data) => ticketService.updateTicket(id, data);
export const updateTicketStatus = (id, status) => ticketService.updateTicketStatus(id, status);
export const deleteTicket = (id) => ticketService.deleteTicket(id);

// Export classes for advanced usage
export { ApiError } from './errors.js';
export { ApiFactory } from './factories/ApiFactory.js';
export { TicketService } from './services/TicketService.js';
export { HttpClient } from './clients/HttpClient.js';
export { BaseApiService } from './services/BaseApiService.js'; 