import {
  Injectable, NotFoundException,
  BadRequestException, ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability, DayOfWeek } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,

    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,
  ) {}

  // ── Helper ───────────────────────────────────
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private validateTimeRange(start: string, end: string) {
    if (this.timeToMinutes(start) >= this.timeToMinutes(end)) {
      throw new BadRequestException(
        'End time must be greater than start time',
      );
    }
  }

  private async getDoctorProfile(user: User): Promise<DoctorProfile> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  // ── Recurring ────────────────────────────────
  async createRecurring(user: User, body: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  }) {
    const doctor = await this.getDoctorProfile(user);

    this.validateTimeRange(body.startTime, body.endTime);

    // Check overlap
    const existing = await this.recurringRepo.find({
      where: { doctor: { id: doctor.id }, dayOfWeek: body.dayOfWeek },
    });

    const newStart = this.timeToMinutes(body.startTime);
    const newEnd = this.timeToMinutes(body.endTime);

    for (const slot of existing) {
      const s = this.timeToMinutes(slot.startTime);
      const e = this.timeToMinutes(slot.endTime);
      if (newStart < e && newEnd > s) {
        throw new ConflictException('Time slot overlaps with existing slot');
      }
    }

    const availability = this.recurringRepo.create({ ...body, doctor });
    return this.recurringRepo.save(availability);
  }

  async getRecurring(user: User) {
    const doctor = await this.getDoctorProfile(user);
    return this.recurringRepo.find({
      where: { doctor: { id: doctor.id } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(user: User, id: number, body: Partial<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  }>) {
    const doctor = await this.getDoctorProfile(user);
    const slot = await this.recurringRepo.findOne({
      where: { id, doctor: { id: doctor.id } },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');

    const updatedStart = body.startTime || slot.startTime;
    const updatedEnd = body.endTime || slot.endTime;
    this.validateTimeRange(updatedStart, updatedEnd);

    Object.assign(slot, body);
    return this.recurringRepo.save(slot);
  }

  async deleteRecurring(user: User, id: number) {
    const doctor = await this.getDoctorProfile(user);
    const slot = await this.recurringRepo.findOne({
      where: { id, doctor: { id: doctor.id } },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');
    await this.recurringRepo.remove(slot);
    return { message: 'Availability slot deleted successfully' };
  }

  // ── Custom Override ──────────────────────────
  async createOverride(user: User, body: {
    date: string;
    startTime: string;
    endTime: string;
    isBlocked?: boolean;
  }) {
    const doctor = await this.getDoctorProfile(user);

    // Validate date
    const dateObj = new Date(body.date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (!body.isBlocked) {
      this.validateTimeRange(body.startTime, body.endTime);
    }

    // Check duplicate
    const existing = await this.customRepo.findOne({
      where: {
        doctor: { id: doctor.id },
        date: body.date,
      },
    });
    if (existing) throw new ConflictException('Override already exists for this date');

    const override = this.customRepo.create({ ...body, doctor });
    return this.customRepo.save(override);
  }

  async getByDate(user: User, date: string) {
    const doctor = await this.getDoctorProfile(user);

    // Check custom override first
    const custom = await this.customRepo.findOne({
      where: { doctor: { id: doctor.id }, date },
    });

    if (custom) {
      return {
        type: 'custom',
        date,
        data: custom,
      };
    }

    // Fall back to recurring
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const days = [
      'SUNDAY', 'MONDAY', 'TUESDAY',
      'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
    ];
    const dayOfWeek = days[dateObj.getDay()] as DayOfWeek;

    const recurring = await this.recurringRepo.find({
      where: { doctor: { id: doctor.id }, dayOfWeek },
    });

    if (recurring.length === 0) {
      return {
        type: 'recurring',
        date,
        dayOfWeek,
        data: [],
        message: 'No availability for this day',
      };
    }

    return {
      type: 'recurring',
      date,
      dayOfWeek,
      data: recurring,
    };
  }
}