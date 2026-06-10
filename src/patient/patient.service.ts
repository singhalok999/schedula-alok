import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './patient.entity';
import { User } from '../users/user.entity';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientProfile)
    private patientRepo: Repository<PatientProfile>,
  ) {}

  async createProfile(user: User, data: Partial<PatientProfile>) {
    const existing = await this.patientRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existing) {
      throw new ConflictException('Patient profile already exists');
    }
    const profile = this.patientRepo.create({ ...data, user });
    return this.patientRepo.save(profile);
  }

  async getProfile(user: User) {
    const profile = await this.patientRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    return profile;
  }

  async updateProfile(user: User, data: Partial<PatientProfile>) {
    const profile = await this.patientRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    Object.assign(profile, data);
    return this.patientRepo.save(profile);
  }
}