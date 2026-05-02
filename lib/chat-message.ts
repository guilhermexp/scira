type MessagePartLike = {
  type?: string;
  text?: string;
};

type MessageLike = {
  content?: string;
  parts?: MessagePartLike[];
};

export function getMessageTextContent(message?: MessageLike | null): string {
  if (!message) {
    return '';
  }

  const textPart = [...(message.parts ?? [])].reverse().find((part) => part?.type === 'text' && typeof part.text === 'string');

  if (textPart?.text) {
    return textPart.text;
  }

  return typeof message.content === 'string' ? message.content : '';
}

export function isInternalDataPart(part: MessagePartLike | undefined | null): boolean {
  return typeof part?.type === 'string' && part.type.startsWith('data-');
}
