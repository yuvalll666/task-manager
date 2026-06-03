import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @Optional() @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(data: Partial<Task>): Promise<Task> {
    const task = this.tasksRepository.create(data);
    return this.tasksRepository.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    await this.findOne(id);
    await this.tasksRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tasksRepository.delete(id);
  }
}
