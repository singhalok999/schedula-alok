import {
  Controller, Get, Param,
  Query, ParseIntPipe,
} from '@nestjs/common';
import { SlotService } from './slot.service';

@Controller('doctor')
export class SlotController {
  constructor(private slotService: SlotService) {}

  @Get(':doctorId/slots')
  getSlots(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
    @Query('duration') duration?: number,
  ) {
    if (!date) {
      return {
        message: 'date query param is required',
        statusCode: 400,
      };
    }
    return this.slotService.getSlotsForDoctor(
      doctorId,
      date,
      duration ? Number(duration) : 30,
    );
  }
}