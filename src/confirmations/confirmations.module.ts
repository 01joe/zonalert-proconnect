import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Confirmation } from './entities/confirmation.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { ConfirmationsController } from './confirmations.controller';
import { ConfirmationsService } from './confirmations.service';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Confirmation, Incident]),
    IncidentsModule,
  ],
  controllers: [ConfirmationsController],
  providers: [ConfirmationsService],
})
export class ConfirmationsModule {}
