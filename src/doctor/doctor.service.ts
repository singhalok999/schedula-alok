import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,
  ) {}

  // ── Onboarding ──────────────────────────────
  async createProfile(user: User, data: Partial<DoctorProfile>) {
    const existing = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existing) throw new ConflictException('Doctor profile already exists');
    const profile = this.doctorRepo.create({ ...data, user });
    return this.doctorRepo.save(profile);
  }

  async getProfile(user: User) {
    const profile = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Doctor profile not found');
    return profile;
  }

  async updateProfile(user: User, data: Partial<DoctorProfile>) {
    const profile = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Doctor profile not found');
    Object.assign(profile, data);
    return this.doctorRepo.save(profile);
  }

  // ── Discovery ────────────────────────────────
  async findAll(query: {
    specialization?: string;
    search?: string;
    page?: number;
    limit?: number;
    availability?: string;
  }) {
    let { specialization, search, page, limit, availability } = query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');

    const where: any = {};

    if (specialization) {
      where.specialization = ILike(`%${specialization}%`);
    }

    if (search) {
      where.fullName = ILike(`%${search}%`);
    }

    const [doctors, total] = await this.doctorRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        specialization: true,
        experience: true,
        consultationFee: true,
        availabilityHours: true,
        bio: true,
      },
    });

    if (doctors.length === 0) {
      return {
        message: 'No doctors found',
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    return {
      message: 'Doctors fetched successfully',
      data: doctors,
      total,
      page,
      limit,
    };
  }

  async findById(id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid doctor ID');

    const doctor = await this.doctorRepo.findOne({
      where: { id },
      select: {
        id: true,
        fullName: true,
        specialization: true,
        experience: true,
        consultationFee: true,
        availabilityHours: true,
        bio: true,
      },
    });

    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    return doctor;
  }
}