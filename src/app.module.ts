import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';

const DB_HOST = process.env.DB_HOST;
console.log(DB_HOST)
@Module({
  imports: [
    ...(DB_HOST
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: DB_HOST,
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'task_manager',
            entities: [User, Task],
            synchronize: true,
          }),
        ]
      : []),
    UsersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
