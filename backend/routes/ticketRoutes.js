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

const router = express.Router();

// Ticket routes - all require authentication
router.get('/', authenticateToken, getTickets);
router.get('/:id', authenticateToken, validateId, getTicketById);
router.post('/', authenticateToken, validateCreateTicket, createTicket);
router.patch('/:id', authenticateToken, validateId, validateUpdateTicket, updateTicket);
router.delete('/:id', authenticateToken, validateId, deleteTicket);

export default router; 