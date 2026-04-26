import type { ContentGoal, ContentType } from '@/types/workspace.types';

type ChatMessage = { role: 'system' | 'user'; content: string };

const GOAL_LABELS: Record<ContentGoal, string> = {
  validate: 'validate whether this problem is real and worth solving',
  community: 'build a community of early users around this product',
  features: 'gather input on what features people would most want to see',
  launch: 'announce the product launch and drive early sign-ups',
};

export function buildTweetMessages(
  idea: { title: string; pitch: string; audience: string; problem: string },
  goal: ContentGoal,
  stepContext?: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You write authentic, engaging tweets for indie hackers and founders.
Write as a real person building in public — direct, honest, and specific. No corporate speak.
Rules:
- Under 260 characters (leave room for a reply thread)
- One clear point or question per tweet
- Speak directly to the target audience
- End with a question or call to action when it fits naturally
- No hashtags unless they add real value
- Do NOT use "Excited to announce", "Game-changer", "Revolutionize", or similar hype phrases
- Respond ONLY with the tweet text. No quotes, no explanation.`,
    },
    {
      role: 'user',
      content: `Write a tweet to ${GOAL_LABELS[goal]}.

Product: <user_input>${idea.title}</user_input>
Pitch: <user_input>${idea.pitch}</user_input>
Audience: <user_input>${idea.audience}</user_input>
Problem: <user_input>${idea.problem}</user_input>${stepContext ? `\nContext: <user_input>${stepContext}</user_input>` : ''}`,
    },
  ];
}

export function buildRedditMessages(
  idea: { title: string; pitch: string; audience: string; problem: string },
  goal: ContentGoal,
  stepContext?: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You write genuine Reddit posts for indie hackers and startup founders.
Write as a real person, not a marketer. Reddit users hate promotional posts — be honest and conversational.
Rules:
- Start with a relatable hook or question, not a pitch
- Share the problem you're solving from personal experience when relevant
- Ask for feedback or opinions — make it a conversation
- 100–250 words total
- Include a title line starting with "Title:" followed by a newline, then the post body
- No excessive self-promotion — the product can be mentioned naturally but is not the focus
- Respond ONLY with the post (title + body). No explanation.`,
    },
    {
      role: 'user',
      content: `Write a Reddit post to ${GOAL_LABELS[goal]}.

Product: <user_input>${idea.title}</user_input>
Pitch: <user_input>${idea.pitch}</user_input>
Audience: <user_input>${idea.audience}</user_input>
Problem: <user_input>${idea.problem}</user_input>${stepContext ? `\nContext: <user_input>${stepContext}</user_input>` : ''}`,
    },
  ];
}

export function buildContentMessages(
  type: ContentType,
  idea: { title: string; pitch: string; audience: string; problem: string },
  goal: ContentGoal,
  stepContext?: string
): ChatMessage[] {
  return type === 'tweet'
    ? buildTweetMessages(idea, goal, stepContext)
    : buildRedditMessages(idea, goal, stepContext);
}
