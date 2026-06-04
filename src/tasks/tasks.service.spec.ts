import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TasksService } from "./tasks.service";
import { Task, TaskStatus } from "./task.entity";
import { UsersService } from "../users/users.service";

const mockTaskRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};

const mockUsersService = {
    findOne: jest.fn(),
};

const baseTask = {
    title: "Walk the dog",
    description: "Taking the dog out for a walk",
    dueDate: new Date(),
};

const baseUser = {
    id: "user-1",
    name: "Yuval",
    email: "yuval@test.com",
    createdAt: "2026-12-31",
};

const task = {
    ...baseTask,
    id: "task-1",
    createdAt: "2026-12-31",
    user: baseUser,
};

const notExistsId = "not-existing-id";

describe("TasksService", () => {
    let tasksService: TasksService;
    let tasksRepository: jest.Mocked<Repository<Task>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: mockTaskRepository,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        tasksService = module.get<TasksService>(TasksService);
        tasksRepository = module.get(getRepositoryToken(Task));

        jest.clearAllMocks();
    });

    it("creates and returns a task", async () => {
        mockUsersService.findOne.mockResolvedValue({
            id: "user-1",
            name: "Yuval",
            email: "yuval@test.com",
        });

        mockTaskRepository.create.mockReturnValue(baseTask);
        mockTaskRepository.save.mockResolvedValue(baseTask);

        const result = await tasksService.create({
            title: "Walk the dog",
            description: "Taking the dog out for a walk",
            dueDate: "2026-12-31",
            userId: "user-1",
        });

        expect(result).toEqual(baseTask);
        expect(result.title).toBe("Walk the dog");
        expect(mockTaskRepository.save).toHaveBeenCalledWith(baseTask);
        expect(mockUsersService.findOne).toHaveBeenCalledWith("user-1");
    });

    describe("findByUser()", () => {
        it("returns all tasks for a user", async () => {
            mockUsersService.findOne.mockResolvedValue(baseUser);
            mockTaskRepository.find.mockResolvedValue([
                {
                    ...task,
                    title: "Walk the dog",
                    description: "Taking the dog out for a walk",
                    status: TaskStatus.PENDING,
                },
                {
                    ...task,
                    title: "Take the trash",
                    description: "Take the trash out to throw away",
                    status: TaskStatus.DONE,
                },
            ]);

            const tasks = await tasksService.findByUser(baseUser.id);

            expect(Array.isArray(tasks)).toBeTruthy();
            expect(tasks.length).toBe(2);
            expect(tasks[0].user.id).toBe(baseUser.id);
            expect(tasks[1].user.id).toBe(baseUser.id);
            expect(mockTaskRepository.find).toHaveBeenCalledWith({
                where: { user: { id: baseUser.id } },
                relations: { user: true },
            });
        });

        it("throws NotFoundException when user does not exists", async () => {
            mockUsersService.findOne.mockRejectedValue(new NotFoundException());
            await expect(tasksService.findByUser(notExistsId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it("returns empty array when user have no tasks", async () => {
            mockUsersService.findOne.mockResolvedValue(baseUser);
            mockTaskRepository.find.mockResolvedValue([]);

            const tasks = await tasksService.findByUser(baseUser.id);

            expect(tasks).toEqual([]);
            expect(tasks.length).toBe(0);
        });
    });

    describe("findOne()", () => {
        it("should return a task by id", async () => {
            mockTaskRepository.findOne.mockResolvedValue(task);
            const result = await tasksService.findOne(task.id);
            expect(result).toEqual(task);
            expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
                where: { id: task.id },
                relations: { user: true },
            });
        });

        it("should throw NotFoundException when task not found", async () => {
            mockTaskRepository.findOne.mockResolvedValue(null);
            await expect(tasksService.findOne(notExistsId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("updateStatus()", () => {
        it("updates and returns the task", async () => {
            let task = {
                id: "task-1",
                title: "Walk the dog",
                status: TaskStatus.IN_PROGRESS,
            };

            mockTaskRepository.findOne.mockResolvedValue(task);
            mockTaskRepository.save.mockResolvedValue({
                ...task,
                status: TaskStatus.DONE,
            });

            const result = await tasksService.updateStatus(
                task.id,
                TaskStatus.DONE,
            );

            expect(result.status).toBe(TaskStatus.DONE);
            expect(mockTaskRepository.save).toHaveBeenCalledWith({
                ...task,
                status: TaskStatus.DONE,
            });
        });
    });

    describe("remove()", () => {
        it("throws NotFoundException when task is not found", async () => {
            mockTaskRepository.findOne.mockResolvedValue(null);
            await expect(tasksService.remove(notExistsId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it("deletes the task when it exists", async () => {
            mockTaskRepository.findOne.mockResolvedValue(baseTask);
            await tasksService.remove("task-1");
            expect(mockTaskRepository.delete).toHaveBeenCalledWith("task-1");
        });
    });
});
