import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} from '../controllers/ticketController.js';
import { validateCreateTicket, validateUpdateTicket, validateId } from '../middleware/validation.js';

const router = express.Router();

// Ticket routes
router.get('/', getTickets);
router.get('/:id', validateId, getTicketById);
router.post('/', validateCreateTicket, createTicket);
router.patch('/:id', validateId, validateUpdateTicket, updateTicket);
router.delete('/:id', validateId, deleteTicket);

export default router; 