import { AssistantRuntimeProvider, ComposerPrimitive, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type ChatModelAdapter } from '@assistant-ui/react';
import { Send } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { askChat } from '../../api/chat/service';
import { useRuntimeConfig } from '../../config/ConfigContext';
import type { ChatContext, ChatReply } from '../../domain/models';

function RuntimeChat({ context, onNavigate }: { context: ChatContext; onNavigate: (documentId: string, page: number) => void }) {
  const { t } = useTranslation();
  const { appConfig } = useRuntimeConfig();
  const conversationId = useRef(`CHAT-${crypto.randomUUID()}`);
  const [sources, setSources] = useState<NonNullable<ChatReply['sources']>>([]);
  const adapter = useMemo<ChatModelAdapter>(() => ({
    async run({ messages, abortSignal }) {
      const userMessage = [...messages].reverse().find((message) => message.role === 'user');
      const text = userMessage?.content.filter((part) => part.type === 'text').map((part) => part.text).join('\n') ?? '';
      const reply = await askChat(appConfig, conversationId.current, text, context, abortSignal);
      conversationId.current = reply.conversationId;
      setSources(reply.sources ?? []);
      return { content: [{ type: 'text', text: reply.message }] };
    },
  }), [appConfig, context]);
  const runtime = useLocalRuntime(adapter);
  return <AssistantRuntimeProvider runtime={runtime}>
    <ThreadPrimitive.Root className="chat-thread">
      <ThreadPrimitive.Viewport className="chat-viewport">
        <ThreadPrimitive.Empty><Typography color="text.secondary" variant="body2">{t('chatEmpty')}</Typography></ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages>{({ message }) => <MessagePrimitive.Root className={`chat-message chat-message-${message.role}`}><MessagePrimitive.Parts /></MessagePrimitive.Root>}</ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>
      {sources.length > 0 && <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', px: 1.5, pb: 1 }}>{sources.map((source) => <Button key={`${source.documentId}-${source.pageNumber}-${source.fieldKey ?? ''}`} size="small" variant="outlined" onClick={() => onNavigate(source.documentId, source.pageNumber)}>{source.documentId} · {t('pageShort', { page: source.pageNumber })}{source.fieldKey ? ` · ${source.fieldKey}` : ''}</Button>)}</Stack>}
      <Divider />
      <ComposerPrimitive.Root className="chat-composer"><ComposerPrimitive.Input aria-label={t('chatPlaceholder')} placeholder={t('chatPlaceholder')} className="chat-input" /><ComposerPrimitive.Send aria-label={t('send')} className="chat-send"><Send fontSize="small" /></ComposerPrimitive.Send></ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  </AssistantRuntimeProvider>;
}

export function ChatPanel({ context, onNavigate }: { context: ChatContext; onNavigate: (documentId: string, page: number) => void }) {
  const { t } = useTranslation();
  return <Card><CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}><Box sx={{ p: 2 }}><Typography variant="h6">{t('chatTitle')}</Typography></Box><RuntimeChat context={context} onNavigate={onNavigate} /></CardContent></Card>;
}
