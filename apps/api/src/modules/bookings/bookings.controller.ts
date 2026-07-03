import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateBookingRequest, UpdateBookingRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get()
  @Permissions('booking.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('booking.create')
  create(@Body() body: CreateBookingRequest) {
    return this.service.create(body);
  }

  @Get(':bookingId')
  @Permissions('booking.view')
  get(@Param('bookingId') bookingId: string) {
    return this.service.get(bookingId);
  }

  @Patch(':bookingId')
  @Permissions('booking.create')
  update(@Param('bookingId') bookingId: string, @Body() body: UpdateBookingRequest) {
    return this.service.update(bookingId, body);
  }

  @Get(':bookingId/pricing-snapshot')
  @Permissions('booking.view')
  pricingSnapshot(@Param('bookingId') bookingId: string) {
    return this.service.pricingSnapshot(bookingId);
  }

  @Post(':bookingId/confirm')
  @Permissions('booking.confirm')
  confirm(@Param('bookingId') bookingId: string) {
    return this.service.confirm(bookingId);
  }

  @Post(':bookingId/approve-rate')
  @Permissions('booking.approve_rate')
  approveRate(@Param('bookingId') bookingId: string, @Body() body: Record<string, unknown>) {
    return this.service.approveRate(bookingId, body);
  }

  @Post(':bookingId/cancel')
  @Permissions('booking.cancel')
  cancel(@Param('bookingId') bookingId: string, @Body() body: Record<string, unknown>) {
    return this.service.cancel(bookingId, body);
  }
}
