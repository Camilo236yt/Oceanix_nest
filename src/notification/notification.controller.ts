import { Controller, Get, Patch, Delete, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Paginate, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto';
import { Auth, GetUser } from '../auth/decorator';
import { User } from '../users/entities/user.entity';
import { TestWhatsappDto } from './dto/test-whatsapp.dto';

@ApiTags('Notifications')
@Controller('notifications')
@Auth()
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  @ApiPaginationQuery({
    sortableColumns: ['createdAt', 'priority', 'isRead'],
    searchableColumns: ['title', 'message'],
    defaultSortBy: [['createdAt', 'DESC']],
    defaultLimit: 20,
  })
  @ApiOperation({
    summary: 'Get notifications with pagination and filters',
    description: `Returns paginated list of notifications for the authenticated user.

    **Paginación:** page, limit (default: 20)
    **Búsqueda:** search (busca en title y message)
    **Filtros:**
    - filter.isRead: $eq (true/false para leídas/no leídas)
    - filter.type: $eq, $in (TICKET_ASSIGNED, TICKET_REMINDER, etc.)
    - filter.priority: $eq, $in (LOW, NORMAL, HIGH, URGENT)
    - filter.createdAt: $gte, $lte, $btw (rangos de fecha)
    **Ordenamiento:** sortBy (createdAt, priority, isRead)

    **Ejemplos:**
    - ?filter.isRead=$eq:false (solo no leídas)
    - ?filter.priority=$in:HIGH,URGENT (urgentes)
    - ?filter.type=$eq:TICKET_ASSIGNED&filter.isRead=$eq:false
    - ?search=ticket&sortBy=createdAt:DESC`,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            title: 'Nuevo ticket asignado',
            message: 'Te han asignado el ticket #1234',
            type: 'TICKET_ASSIGNED',
            priority: 'NORMAL',
            isRead: false,
            readAt: null,
            metadata: { ticketId: 'uuid' },
            actionUrl: '/tickets/uuid',
            createdAt: '2025-11-19T18:00:00Z',
          },
        ],
        meta: {
          itemsPerPage: 20,
          totalItems: 45,
          currentPage: 1,
          totalPages: 3,
        },
        links: {
          first: '?page=1',
          next: '?page=2',
          last: '?page=3',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Paginate() query: PaginateQuery,
    @GetUser() user: User,
  ) {
    return this.notificationService.findAllPaginated(query, user.id);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notifications count',
    description: 'Returns the count of unread notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      example: { count: 5 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUnreadCount(@GetUser() user: User): Promise<{ count: number }> {
    const count = await this.notificationService.countUnread(user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific notification',
    description: 'Returns a single notification by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(@GetUser() user: User, @Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationService.findOne(id, user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async markAsRead(@GetUser() user: User, @Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all unread notifications as read for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    schema: {
      example: { message: 'All notifications marked as read', affected: 5 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async markAllAsRead(@GetUser() user: User): Promise<{ message: string; affected: number }> {
    const result = await this.notificationService.markAllAsRead(user.id);
    return {
      message: 'All notifications marked as read',
      affected: result.affected,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Deletes a specific notification',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
    schema: {
      example: { message: 'Notification deleted successfully' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(@GetUser() user: User, @Param('id') id: string): Promise<{ message: string }> {
    await this.notificationService.remove(id, user.id);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('read/all')
  @ApiOperation({
    summary: 'Delete all read notifications',
    description: 'Deletes all read notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Read notifications deleted successfully',
    schema: {
      example: { message: 'Read notifications deleted successfully', affected: 10 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async removeAllRead(@GetUser() user: User): Promise<{ message: string; affected: number }> {
    const result = await this.notificationService.removeAllRead(user.id);
    return {
      message: 'Read notifications deleted successfully',
      affected: result.affected,
    };
  }
}
