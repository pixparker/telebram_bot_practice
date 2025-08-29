import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [BotUpdate],
})
export class BotModule { }
