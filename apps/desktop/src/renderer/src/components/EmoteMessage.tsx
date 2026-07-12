import type { CommentEmote } from "@bili/types";
import { splitEmotes } from "../lib/format";

interface Props {
  message: string;
  emotes: Record<string, CommentEmote>;
}

export function EmoteMessage({ message, emotes }: Props) {
  return (
    <>
      {splitEmotes(message).map((part, i) => {
        if (part.type === "emote" && emotes[part.value]) {
          const emote = emotes[part.value];
          return (
            <img
              key={`${part.value}-${i}`}
              className="emote"
              src={emote.url}
              title={part.value}
              alt={part.value}
            />
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}
