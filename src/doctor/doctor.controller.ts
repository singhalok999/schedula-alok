import {
  Controller, Get, Post, Patch,
  Body, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DoctorService } from './doctor.service';

@Controller('doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('DOCTOR')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Post('profile')
  create(@Request() req, @Body() body) {
    return this.doctorService.createProfile(req.user, body);
  }

  @Get('profile')
  get(@Request() req) {
    return this.doctorService.getProfile(req.user);
  }

  @Patch('profile')
  update(@Request() req, @Body() body) {
    return this.doctorService.updateProfile(req.user, body);
  }
}