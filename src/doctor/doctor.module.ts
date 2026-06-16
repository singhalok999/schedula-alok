import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfile } from './doctor.entity';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { RecurringAvailability } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { Slot } from './slot.entity';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorProfile,
      RecurringAvailability,
      CustomAvailability,
      Slot,
    ]),
  ],
  providers: [DoctorService, AvailabilityService, SlotService],
  controllers: [DoctorController, AvailabilityController, SlotController],
})
export class DoctorModule {}