import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Railway fournit DATABASE_URL automatiquement avec PostgreSQL
        // Priorité : DATABASE_URL > variables individuelles
        const databaseUrl = process.env.DATABASE_URL;

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,    // Auto-création des tables
            logging: false,
            ssl: { rejectUnauthorized: false },  // Requis pour Railway
          };
        }

        // Fallback : variables individuelles (dev local)
        return {
          type: 'postgres',
          host:     configService.get<string>('database.host'),
          port:     configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: String(configService.get('database.password') ?? ''),
          database: configService.get<string>('database.name'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get<boolean>('database.synchronize'),
          logging: configService.get<boolean>('database.logging'),
          ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
