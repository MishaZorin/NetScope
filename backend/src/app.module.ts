import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsModule } from './metrics/metrics.module';
import { ServersModule } from './servers/servers.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    
   
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],  
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('POSTGRES_USER') || 'myuser',
        password: String(configService.get<string>('POSTGRES_PASSWORD') || 'mypassword'),
        database: configService.get<string>('POSTGRES_DB') || 'mydb',
         autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    
   
    MetricsModule,
    
   
    ServersModule,

   
   
  ],
})
export class AppModule {}
