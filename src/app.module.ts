import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Si no detecta el .env, usa la cadena local por defecto para que no explote el proyecto
        const uri = configService.get<string>('MONGODB_URI') || 
                    process.env.MONGODB_URI || 
                    'mongodb://localhost:27017/gestor_documental';
        
        console.log('🔌 Conectando a:', uri);
        return { uri };
      },
    }),
    AuthModule,
    DocumentsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}