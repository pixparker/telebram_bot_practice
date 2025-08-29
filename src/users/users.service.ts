import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly uniqueUserIds = new Set<number>();
  private readonly startedAt: Date = new Date();
  private totalMessages = 0;

  registerUser(userId?: number): void {
    if (typeof userId !== 'number') {
      return;
    }

    this.uniqueUserIds.add(userId);
  }

  getUserCount(): number {
    return this.uniqueUserIds.size;
  }

  getUserIds(): number[] {
    return Array.from(this.uniqueUserIds);
  }

  incrementMessageCount(): void {
    this.totalMessages += 1;
  }

  getTotalMessages(): number {
    return this.totalMessages;
  }

  getStartedAt(): Date {
    return this.startedAt;
  }

  addFakeUser(): number {
    const ids = this.getUserIds();
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;
    this.uniqueUserIds.add(nextId);

    return nextId;
  }

  clearUsers(): void {
    this.uniqueUserIds.clear();
  }
}
