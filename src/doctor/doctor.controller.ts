import {
  Controller, Get, Post, Patch,
  Body, Request, UseGuards,
  Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  // ── Public Routes (No Auth needed) ──────────
  @Get()
  findAll(
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('availability') availability?: string,
  ) {
    return this.doctorService.findAll({
      specialization,
      search,
      page,
      limit,
      availability,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findById(id);
  }

  // ── Protected Routes (Doctor only) ──────────
  @Post('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  create(@Request() req, @Body() body) {
    return this.doctorService.createProfile(req.user, body);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  get(@Request() req) {
    return this.doctorService.getProfile(req.user);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  update(@Request() req, @Body() body) {
    return this.doctorService.updateProfile(req.user, body);
  }
}