import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AvailabilityService } from './availability.service';

@Controller('doctor/availability')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('DOCTOR')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  // ── Recurring ────────────────────────────────
  @Post()
  create(@Request() req, @Body() body) {
    return this.availabilityService.createRecurring(req.user, body);
  }

  @Get()
  getAll(@Request() req) {
    return this.availabilityService.getRecurring(req.user);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body,
  ) {
    return this.availabilityService.updateRecurring(req.user, id, body);
  }

  @Delete(':id')
  delete(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.deleteRecurring(req.user, id);
  }

  // ── Custom Override ──────────────────────────
  @Post('override')
  createOverride(@Request() req, @Body() body) {
    return this.availabilityService.createOverride(req.user, body);
  }

  @Get('date')
  getByDate(@Request() req, @Query('date') date: string) {
    return this.availabilityService.getByDate(req.user, date);
  }
}