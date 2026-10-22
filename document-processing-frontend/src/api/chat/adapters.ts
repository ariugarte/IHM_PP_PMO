import { z } from 'zod';
import type { ChatContext, ChatReply } from '../../domain/models';

const chatReplySchema = z.object({
  conversationId: z.string(), message: z.string(),
  sources: z.array(z.object({ documentId: z.string(), pageNumber: z.number().int().positive(), fieldKey: z.string().optional() })).optional(),
});

export const toChatRequest = (conversationId: string, message: string, context: ChatContext) => ({ conversationId, message, context });
export const adaptChatReply = (raw: unknown): ChatReply => chatReplySchema.parse(raw);
