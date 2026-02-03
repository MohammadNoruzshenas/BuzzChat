import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @UseGuards(JwtAuthGuard)
    @Get('history/:otherUserId')
    async getHistory(@Param('otherUserId') otherUserId: string, @Req() req: any) {
        return this.chatService.getChatHistory(req.user.userId, otherUserId);
    }
}

