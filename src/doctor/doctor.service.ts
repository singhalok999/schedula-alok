import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,
  ) {}

  async createProfile(user: User, data: Partial<DoctorProfile>) {
    const existing = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existing) {
      throw new ConflictException('Doctor profile already exists');
    }
    const profile = this.doctorRepo.create({ ...data, user });
    return this.doctorRepo.save(profile);
  }

  async getProfile(user: User) {
    const profile = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return profile;
  }

  async updateProfile(user: User, data: Partial<DoctorProfile>) {
    const profile = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    Object.assign(profile, data);
    return this.doctorRepo.save(profile);
  }
}