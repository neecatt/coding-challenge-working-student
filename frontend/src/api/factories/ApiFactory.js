import { HttpClient } from '../clients/HttpClient.js';
import { TicketService } from '../services/TicketService.js';
import { AuthService } from '../services/AuthService.js';

//Factory for creating API instances
export class ApiFactory {
  static createTicketService(httpClient = new HttpClient()) {
    return new TicketService(httpClient);
  }

  static createAuthService(httpClient = new HttpClient()) {
    return new AuthService(httpClient);
  }
} 