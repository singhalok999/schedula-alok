import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Role } from '../users/user.entity';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: Role,
  ) {
    return this.authService.signup(name, email, password, role);
  }

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Get('doctor/profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DOCTOR)
  doctorProfile() {
    return {
      message: 'Doctor profile accessed successfully',
      role: 'DOCTOR',
    };
  }

  @Get('patient/profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PATIENT)
  patientProfile() {
    return {
      message: 'Patient profile accessed successfully',
      role: 'PATIENT',
    };
  }
}