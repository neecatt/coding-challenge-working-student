import { executeQuery, executeQueries } from '../utils/dbService.js';
import { buildPaginatedQuery, buildSingleTicketQuery } from '../utils/queryBuilder.js';
import { logBusinessEvent } from '../utils/logHelper.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';

export class TicketService {
  
  // Get tickets with filtering and pagination
  static async getTickets(filters, limit = 50, offset = 0) {
    try {
      const { query, countQuery, params, countParams } = buildPaginatedQuery(filters, limit, offset);
      
      const [tickets, countResult] = await executeQueries([
        {
          query,
          params,
          operation: 'SELECT',
          table: 'tickets',
          meta: { filters, limit, offset }
        },
        {
          query: countQuery,
          params: countParams,
          operation: 'SELECT',
          table: 'tickets',
          meta: { filters, count: true }
        }
      ]);

      const total = parseInt(countResult[0].total);
      
      logBusinessEvent('tickets_fetched', 'ticket', 'read', {
        count: tickets.length,
        total,
        filters
      });

      return {
        tickets,
        pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch tickets', error);
    }
  }

  // Get single ticket by ID
  static async getTicketById(ticketId) {
    try {
      const { query, params } = buildSingleTicketQuery(ticketId);
      
      const tickets = await executeQuery(
        query, 
        params, 
        'SELECT', 
        'tickets', 
        { ticketId }
      );

      if (tickets.length === 0) {
        throw new NotFoundError('Ticket');
      }

      logBusinessEvent('ticket_fetched', 'ticket', 'read', { ticketId });
      return tickets[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch ticket', error);
    }
  }

  // Create new ticket
  static async createTicket(ticketData) {
    const { title, description, user_id, organisation_id, status = 'open' } = ticketData;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      throw new ValidationError('Title is required', 'title');
    }

    if (!user_id) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    if (!organisation_id) {
      throw new ValidationError('Organisation ID is required', 'organisation_id');
    }

    try {
      // Validate user exists
      const userExists = await executeQuery(
        'SELECT id FROM users WHERE id = $1',
        [parseInt(user_id)],
        'SELECT',
        'users',
        { validation: 'user_exists' }
      );
      
      if (userExists.length === 0) {
        throw new NotFoundError('User');
      }

      // Validate organisation exists
      const orgExists = await executeQuery(
        'SELECT id FROM organisation WHERE id = $1',
        [parseInt(organisation_id)],
        'SELECT',
        'organisation',
        { validation: 'org_exists' }
      );
      
      if (orgExists.length === 0) {
        throw new NotFoundError('Organisation');
      }

      // Create ticket
      const result = await executeQuery(
        `INSERT INTO tickets (title, description, status, user_id, organisation_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, description, status, created_at, user_id, organisation_id`,
        [title, description || null, status, parseInt(user_id), parseInt(organisation_id)],
        'INSERT',
        'tickets',
        { ticketData }
      );

      const newTicket = result[0];

      // Get full ticket with joins
      const fullTicket = await this.getTicketById(newTicket.id);

      logBusinessEvent('ticket_created', 'ticket', 'create', { 
        ticketId: newTicket.id,
        ticketData 
      });

      return fullTicket;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to create ticket', error);
    }
  }

  // Update ticket
  static async updateTicket(ticketId, updateData) {
    try {
      // Check if ticket exists
      const existingTicket = await executeQuery(
        'SELECT id FROM tickets WHERE id = $1',
        [parseInt(ticketId)],
        'SELECT',
        'tickets',
        { validation: 'ticket_exists' }
      );

      if (existingTicket.length === 0) {
        throw new NotFoundError('Ticket');
      }

      // Build update query dynamically
      const { title, description, status, user_id, organisation_id } = updateData;
      let updateFields = [];
      let params = [];
      let paramIndex = 1;

      if (title !== undefined) {
        if (title.trim().length === 0) {
          throw new ValidationError('Title cannot be empty', 'title');
        }
        updateFields.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (status !== undefined) {
        const validStatuses = ['open', 'pending', 'in_progress', 'closed', 'resolved'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`, 'status');
        }
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (user_id !== undefined) {
        // Validate user exists
        const userExists = await executeQuery(
          'SELECT id FROM users WHERE id = $1',
          [parseInt(user_id)],
          'SELECT',
          'users',
          { validation: 'user_exists' }
        );
        
        if (userExists.length === 0) {
          throw new NotFoundError('User');
        }
        
        updateFields.push(`user_id = $${paramIndex}`);
        params.push(parseInt(user_id));
        paramIndex++;
      }

      if (organisation_id !== undefined) {
        // Validate organisation exists
        const orgExists = await executeQuery(
          'SELECT id FROM organisation WHERE id = $1',
          [parseInt(organisation_id)],
          'SELECT',
          'organisation',
          { validation: 'org_exists' }
        );
        
        if (orgExists.length === 0) {
          throw new NotFoundError('Organisation');
        }
        
        updateFields.push(`organisation_id = $${paramIndex}`);
        params.push(parseInt(organisation_id));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new ValidationError('No fields to update');
      }

      // Update ticket
      await executeQuery(
        `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        [...params, parseInt(ticketId)],
        'UPDATE',
        'tickets',
        { ticketId, updateData }
      );

      // Get updated ticket
      const updatedTicket = await this.getTicketById(ticketId);

      logBusinessEvent('ticket_updated', 'ticket', 'update', { 
        ticketId,
        updateData 
      });

      return updatedTicket;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update ticket', error);
    }
  }

  // Delete ticket
  static async deleteTicket(ticketId) {
    try {
      // Check if ticket exists
      const existingTicket = await executeQuery(
        'SELECT id FROM tickets WHERE id = $1',
        [parseInt(ticketId)],
        'SELECT',
        'tickets',
        { validation: 'ticket_exists' }
      );

      if (existingTicket.length === 0) {
        throw new NotFoundError('Ticket');
      }

      // Delete ticket
      await executeQuery(
        'DELETE FROM tickets WHERE id = $1',
        [parseInt(ticketId)],
        'DELETE',
        'tickets',
        { ticketId }
      );

      logBusinessEvent('ticket_deleted', 'ticket', 'delete', { ticketId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete ticket', error);
    }
  }
} 