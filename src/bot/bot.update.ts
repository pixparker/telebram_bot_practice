import { Inject, Injectable, Logger } from '@nestjs/common';
import { Action, Ctx, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';
import { Command } from 'nestjs-telegraf';

@Update()
@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) { }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    this.usersService.registerUser(ctx.from?.id);
    this.usersService.incrementMessageCount();
    const firstName = ctx.from?.first_name ?? 'there';
    await ctx.reply(`سلام ${firstName}! به ربات خوش آمدی.`);

    await ctx.reply('برای راهنمایی از /help استفاده کن.');
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    this.usersService.registerUser(ctx.from?.id);
    this.usersService.incrementMessageCount();
    await ctx.reply(
      'دستورات موجود:\n/incr - افزودن کاربر جعلی\n/start - شروع ربات\n/help - راهنما\n/stats - تعداد کاربران\n/reset - پاکسازی لیست کاربران',
    );
  }

  @Command('stats')
  async onStats(@Ctx() ctx: Context) {
    this.usersService.registerUser(ctx.from?.id);
    this.usersService.incrementMessageCount();

    const count = this.usersService.getUserCount();
    const messageId = Date.now(); // Use timestamp as a unique ID
    await ctx.reply(`stats => users count: ${count}`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'A', callback_data: `answer_a:${messageId}` },
            { text: 'B', callback_data: `answer_b:${messageId}` },
            { text: 'C', callback_data: `answer_c:${messageId}` },
            { text: 'D', callback_data: `answer_d:${messageId}` },
          ],
          [
            { text: 'show more', callback_data: 'stats_more' },
            { text: 'google', url: 'https://www.google.com' },
          ],
        ],
      },
    });
  }

  @Action('stats_more')
  async onStatsMore(@Ctx() ctx: Context) {
    const ids: number[] = this.usersService.getUserIds();
    const count: number = ids.length;
    const preview: string = ids.slice(0, 10).join(', ');
    const totalMessages: number = this.usersService.getTotalMessages();
    const startedAt: Date = this.usersService.getStartedAt();

    await ctx.answerCbQuery('Showing more stats ...');
    const cb = ctx.callbackQuery;
    if (cb && 'message' in cb) {
      await ctx.deleteMessage();
    }
    await ctx.reply(
      `users count: ${count}\nmessages: ${totalMessages}\nfirst ids: ${preview || '-'}\nstarted: ${startedAt.toISOString()}\nnote: in-memory only`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗑️ پاک کردن همه کاربران', callback_data: 'stats_reset' }],
          ],
        },
      },
    );
  }

  @Command('incr')
  async onIncr(@Ctx() ctx: Context) {
    this.usersService.incrementMessageCount();
    const id = this.usersService.addFakeUser();
    const count = this.usersService.getUserCount();
    await ctx.reply(`fake user added: ${id}\nusers count: ${count}`);
  }

  @Command('reset')
  async onReset(@Ctx() ctx: Context) {
    this.usersService.incrementMessageCount();
    this.usersService.clearUsers();
    await ctx.reply('users cleared');
  }

  @Action('stats_reset')
  async onStatsReset(@Ctx() ctx: Context) {
    this.usersService.clearUsers();
    await ctx.answerCbQuery('Stats have been reset');
    await ctx.reply('users cleared');
  }

  @Action(/^answer_[abcd]:(\d+)$/)
  async onAnswer(@Ctx() ctx: Context) {
    const cb = ctx.callbackQuery;
    if (!cb || !('data' in cb) || !('message' in cb)) return;

    const data = cb.data;
    const [action, messageId] = data.split(':');
    const answer = action.split('_')[1].toUpperCase();
    const isCorrect = answer === 'D';

    // Get the original message text, fallback to empty if undefined
    const message = cb.message;
    const originalText = message && 'text' in message ? message.text || '' : '';
    const answerText = `\n\nپاسخ کاربر: ${answer}${isCorrect ? ' ✅' : ''}\nشناسه پیام: ${messageId}`;

    // Edit message without keyboard to prevent multiple answers
    await ctx.editMessageText(originalText + answerText);

    await ctx.answerCbQuery(
      isCorrect
        ? '✅ آفرین! پاسخ شما درست بود'
        : `شما گزینه ${answer} را انتخاب کردید`,
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    this.usersService.registerUser(ctx.from?.id);
    this.usersService.incrementMessageCount();
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    this.logger.log(`Message from ${ctx.from?.id}: ${text}`);
    const answer = 'پیام شما دریافت شد\n' + text;

    await ctx.reply(answer);
  }
}
