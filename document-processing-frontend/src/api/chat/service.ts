import type { AppConfig } from '../../config/schema';
import type { ChatContext, ChatReply } from '../../domain/models';
import { httpClient } from '../http';
import { endpoint } from '../routes';
import { adaptChatReply, toChatRequest } from './adapters';

export async function askChat(config: AppConfig, conversationId: string, message: string, context: ChatContext, signal?: AbortSignal): Promise<ChatReply> {
  const { url, route } = endpoint(config, 'chat', 'ask');
  return adaptChatReply(await httpClient.json(url, { method: route.method, body: toChatRequest(conversationId, message, context), signal }));
}
