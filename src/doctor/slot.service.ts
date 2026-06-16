import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from './slot.entity';
import { DoctorProfile } from './doctor.entity';
import { RecurringAvailability, DayOfWeek } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,

    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,

    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
  ) {}

  // ── Helpers ──────────────────────────────────
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private generateSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
  ): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
    let current = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    while (current + durationMinutes <= end) {
      slots.push({
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(current + durationMinutes),
      });
      current += durationMinutes;
    }
    return slots;
  }

  private getDayOfWeek(dateStr: string): DayOfWeek {
    const days = [
      'SUNDAY', 'MONDAY', 'TUESDAY',
      'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
    ];
    const date = new Date(dateStr);
    return days[date.getDay()] as DayOfWeek;
  }

  // ── Main: Get Slots ──────────────────────────
  async getSlotsForDoctor(
    doctorId: number,
    date: string,
    duration: number = 30,
  ) {
    // Validate doctor
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate duration
    if (duration < 5 || duration > 120) {
      throw new BadRequestException('Duration must be between 5 and 120 minutes');
    }

    // Past date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    // Get availability windows
    let availabilityWindows: { startTime: string; endTime: string }[] = [];

    // Check custom override first
    const customSlots = await this.customRepo.find({
      where: { doctor: { id: doctorId }, date },
    });

    if (customSlots.length > 0) {
      // Use custom availability
      availabilityWindows = customSlots
        .filter(s => !s.isBlocked)
        .map(s => ({ startTime: s.startTime, endTime: s.endTime }));
    } else {
      // Use recurring availability
      const dayOfWeek = this.getDayOfWeek(date);
      const recurring = await this.recurringRepo.find({
        where: { doctor: { id: doctorId }, dayOfWeek },
      });
      availabilityWindows = recurring.map(r => ({
        startTime: r.startTime,
        endTime: r.endTime,
      }));
    }

    if (availabilityWindows.length === 0) {
      return {
        message: 'No availability for this date',
        date,
        slots: [],
      };
    }

    // Generate all slots
    const allSlots: { startTime: string; endTime: string }[] = [];
    for (const window of availabilityWindows) {
      const slots = this.generateSlots(
        window.startTime,
        window.endTime,
        duration,
      );
      allSlots.push(...slots);
    }

    // Filter past slots if today
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const filteredSlots = allSlots.filter(slot => {
      if (isToday) {
        return this.timeToMinutes(slot.startTime) > currentMinutes;
      }
      return true;
    });

    // Check already booked slots
    const bookedSlots = await this.slotRepo.find({
      where: { doctor: { id: doctorId }, date, isBooked: true },
    });

    const bookedTimes = bookedSlots.map(s => s.startTime);

    const availableSlots = filteredSlots.filter(
      slot => !bookedTimes.includes(slot.startTime),
    );

    if (availableSlots.length === 0) {
      return {
        message: 'No available slots for this date',
        date,
        slots: [],
      };
    }

    return {
      message: 'Slots fetched successfully',
      date,
      doctorId,
      duration,
      totalSlots: availableSlots.length,
      slots: availableSlots,
    };
  }
}