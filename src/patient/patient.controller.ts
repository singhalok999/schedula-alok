import {
  Controller, Get, Post, Patch,
  Body, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PatientService } from './patient.service';

@Controller('patient')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PATIENT')
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post('profile')
  create(@Request() req, @Body() body) {
    return this.patientService.createProfile(req.user, body);
  }

  @Get('profile')
  get(@Request() req) {
    return this.patientService.getProfile(req.user);
  }

  @Patch('profile')
  update(@Request() req, @Body() body) {
    return this.patientService.updateProfile(req.user, body);
  }
}