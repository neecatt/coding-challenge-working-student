import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} from '../controllers/ticketController.js';
import { validateCreateTicket, validateUpdateTicket, validateId } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { userApiRateLimit, userTicketRateLimit } from '../middleware/rateLimiting.js';

const router = express.Router();

router.get('/', authenticateToken, userApiRateLimit, getTickets);
router.get('/:id', authenticateToken, userApiRateLimit, validateId, getTicketById);
router.post('/', authenticateToken, userTicketRateLimit, validateCreateTicket, createTicket);
router.patch('/:id', authenticateToken, userTicketRateLimit, validateId, validateUpdateTicket, updateTicket);
router.delete('/:id', authenticateToken, userTicketRateLimit, validateId, deleteTicket);

export default router; 