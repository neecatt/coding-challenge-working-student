import { HttpClient } from '../clients/HttpClient.js';
import { TicketService } from '../services/TicketService.js';

//Factory for creating API instances
export class ApiFactory {
  static createTicketService(httpClient = HttpClient) {
    return new TicketService(httpClient);
  }
} 