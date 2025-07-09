import { TicketService } from '../services/ticketService.js';
import { sendSuccess, sendCreated, sendNoContent, sendNotFound } from '../utils/responseHandler.js';
import { controllerWrapper } from '../utils/controllerWrapper.js';

// Get all tickets with filtering and pagination
export const getTickets = controllerWrapper(async (req, res) => {
  const { status, organisation_id, user_id, limit = 50, offset = 0 } = req.query;
  
  const result = await TicketService.getTickets(
    { status, organisation_id, user_id }, 
    limit, 
    offset
  );
  
  sendSuccess(res, result);
});

// Get a specific ticket by ID
export const getTicketById = controllerWrapper(async (req, res) => {
  const { id } = req.params;
  
  try {
    const ticket = await TicketService.getTicketById(id);
    sendSuccess(res, ticket);
  } catch (error) {
    if (error.message === 'Ticket not found') {
      sendNotFound(res, 'Ticket');
    } else {
      throw error;
    }
  }
});

// Create a new ticket
export const createTicket = controllerWrapper(async (req, res) => {
  const { title, description, user_id, organisation_id, status = 'open' } = req.body;

  // Validation
  if (!title || !user_id || !organisation_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields: title, user_id, organisation_id' 
    });
  }

  try {
    const ticket = await TicketService.createTicket({
      title,
      description,
      user_id,
      organisation_id,
      status
    });
    
    sendCreated(res, ticket, 'Ticket created successfully');
  } catch (error) {
    if (error.message === 'User not found' || error.message === 'Organisation not found') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    } else {
      throw error;
    }
  }
});

// Update a ticket
export const updateTicket = controllerWrapper(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, user_id, organisation_id } = req.body;

  try {
    const ticket = await TicketService.updateTicket(id, {
      title,
      description,
      status,
      user_id,
      organisation_id
    });
    
    sendSuccess(res, ticket, 'Ticket updated successfully');
  } catch (error) {
    if (error.message === 'Ticket not found') {
      sendNotFound(res, 'Ticket');
    } else if (error.message === 'User not found' || error.message === 'Organisation not found') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    } else if (error.message === 'No fields to update') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    } else {
      throw error;
    }
  }
});

// Delete a ticket
export const deleteTicket = controllerWrapper(async (req, res) => {
  const { id } = req.params;

  try {
    await TicketService.deleteTicket(id);
    sendNoContent(res);
  } catch (error) {
    if (error.message === 'Ticket not found') {
      sendNotFound(res, 'Ticket');
    } else {
      throw error;
    }
  }
}); 