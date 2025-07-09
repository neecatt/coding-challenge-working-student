import { HttpClient } from '../clients/HttpClient.js';
import { TicketService } from '../services/TicketService.js';

// API Factory - Dependency Inversion: Factory for creating API instances
export class ApiFactory {
  static createTicketService(httpClient = HttpClient) {
    return new TicketService(httpClient);
  }
} 