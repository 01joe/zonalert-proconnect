import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import {
  appConfig,
  databaseConfig,
  jwtConfig,
  throttleConfig,
  firebaseConfig,
} from './config/app.config';

import { DatabaseModule }        from './database/database.module';
import { AuthModule }            from './auth/auth.module';
import { UsersModule }           from './users/users.module';
import { IncidentsModule }       from './incidents/incidents.module';
import { ReportsModule }         from './reports/reports.module';
import { ConfirmationsModule }   from './confirmations/confirmations.module';
import { CommentsModule }        from './comments/comments.module';
import { ProfessionalsModule }   from './professionals/professionals.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { NotificationsModule }   from './notifications/notifications.module';
import { InterventionsModule }   from './interventions/interventions.module';
import { AllExceptionsFilter }   from './common/filters/all-exceptions.filter';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ResponseTimeMiddleware } from './common/middleware/response-time.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        [appConfig, databaseConfig, jwtConfig, throttleConfig, firebaseConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    IncidentsModule,
    ReportsModule,
    ConfirmationsModule,
    CommentsModule,
    ProfessionalsModule,
    ServiceRequestsModule,
    NotificationsModule,
    InterventionsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Note: FirebaseAdminService retiré du AppModule global
    // Il sera injecté directement dans NotificationsModule quand Firebase sera configuré
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ResponseTimeMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
