import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [...(process.env.DB_HOST ? [TypeOrmModule.forFeature([Task])] : [])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
