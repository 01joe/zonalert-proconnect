import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intervention } from './entities/intervention.entity';
import { InterventionsService } from './interventions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Intervention])],
  providers: [InterventionsService],
  exports: [InterventionsService],
})
export class InterventionsModule {}
