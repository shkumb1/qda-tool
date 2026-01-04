import type { Code, Theme, QDADocument, CodeExcerpt } from '@/types/qda';
import { v4 as uuidv4 } from 'uuid';

export const SAMPLE_DOCUMENTS: Omit<QDADocument, 'id' | 'uploadedAt' | 'excerpts'>[] = [
  {
    title: 'Interview - Participant 01',
    type: 'txt',
    size: 4520,
    content: `Researcher: Thank you for agreeing to participate in this study about remote work experiences. Can you tell me about your transition to working from home?

Participant 01: Well, it was quite sudden for most of us. One day we were in the office, and the next we were setting up workstations in our bedrooms or living rooms. I remember feeling both excited and anxious about it.

Researcher: What were the main challenges you faced initially?

Participant 01: The biggest challenge was definitely the lack of separation between work and personal life. My apartment is small, so my desk is literally in my bedroom. I found myself working longer hours because the computer was always there, staring at me. It took me months to establish boundaries.

Another significant issue was communication. In the office, I could just walk over to someone's desk to ask a quick question. Now everything requires scheduling a video call or waiting for email responses. The spontaneous collaboration we used to have just disappeared.

Researcher: How did these challenges affect your mental health and wellbeing?

Participant 01: Honestly, the first few months were tough. I felt isolated and disconnected from my team. The lack of social interaction really impacted my mood. I started to feel like I was just a productivity machine rather than part of a community.

But over time, I adapted. I started taking regular breaks, going for walks, and scheduling virtual coffee chats with colleagues. It's not the same as being in person, but it helped me feel more connected.

Researcher: What about the positive aspects of remote work?

Participant 01: Oh, there are definitely positives! No commute has been life-changing. I save almost two hours every day that I used to spend on trains. I've used that time to exercise more and spend time with my family. My work-life balance has actually improved once I learned to set boundaries.

I also appreciate the flexibility. If I need to take a break in the afternoon for a personal appointment, I can just make up the time later. That autonomy is really valuable.

Researcher: How has remote work affected your productivity?

Participant 01: It's been a mixed bag. For focused, individual work, I'm definitely more productive at home. No interruptions, no noisy open office. I can really concentrate.

But for creative work that requires brainstorming with others, it's harder. Video calls just don't capture the same energy as being in a room together, throwing ideas around on a whiteboard.

Researcher: Looking forward, what would be your ideal work arrangement?

Participant 01: I think a hybrid model would be perfect. Maybe two or three days in the office for meetings and collaborative work, and the rest from home for focused tasks. That way, I get the best of both worlds - the social connection and collaboration opportunities of the office, plus the flexibility and focus time of remote work.`,
  },
  {
    title: 'Interview - Participant 02',
    type: 'txt',
    size: 3890,
    content: `Researcher: Can you describe your experience with remote work over the past year?

Participant 02: My experience has been quite different from what I expected. As someone who's naturally introverted, I thought I would thrive working from home. And in some ways, I have. But I also discovered that I valued the in-person interactions more than I realized.

Researcher: What has been the most significant change for you?

Participant 02: The blurring of boundaries between work and home life. My partner also works from home, so we're together 24/7 now. We had to learn to give each other space and respect work hours. It actually strengthened our relationship in some ways because we had to communicate more explicitly about our needs.

From a work perspective, I've become much more intentional about my communication. I write clearer emails, I prepare more thoroughly for meetings because I know video calls can be exhausting. I've developed better documentation habits because I can't just rely on asking someone in person.

Researcher: Have you noticed any changes in team dynamics?

Participant 02: Definitely. There's a more egalitarian feel to remote meetings, in a way. Everyone has the same-sized box on the screen. The loudest voices don't dominate as much. I've seen quieter team members speak up more in this format.

But we've also lost some of the informal relationship building. The casual conversations by the coffee machine, the lunch outings - those moments where you get to know colleagues as people, not just coworkers. We've tried to recreate that with virtual happy hours and game sessions, but it's not quite the same.

Researcher: How has your workspace at home evolved?

Participant 02: Significantly! I started at my kitchen table, hunched over a laptop. Now I have a proper home office with an ergonomic chair, external monitor, and good lighting for video calls. I've invested in noise-canceling headphones, a quality webcam, and better internet. These improvements have made a huge difference in both my productivity and physical comfort.

Researcher: What advice would you give to others adapting to remote work?

Participant 02: First, invest in your workspace. It doesn't have to be expensive, but having a dedicated work area and proper equipment matters for your health and productivity.

Second, establish routines. I still "commute" to work by taking a short walk before and after my workday. It helps me mentally transition between work and personal time.

Third, overcommunicate. When you can't see someone's body language or have casual check-ins, you need to be more proactive about sharing information and checking in with colleagues.

Finally, be patient with yourself. Adapting to remote work is a process. Some days will be better than others, and that's okay.`,
  },
  {
    title: 'Focus Group Notes - Team A',
    type: 'txt',
    size: 2950,
    content: `Focus Group Discussion: Team A - Engineering Department
Date: March 15, 2024
Participants: 6 (anonymized as P1-P6)

Topic 1: Communication Tools and Challenges

P1: "We use too many different tools. Slack, email, Zoom, Microsoft Teams - it's overwhelming trying to keep track of everything."

P3: "I agree. Sometimes important information gets lost because it's in the wrong channel. We need better organization."

P5: "The constant notifications are distracting. I've had to mute most channels just to get work done."

P2: "Video meeting fatigue is real. Back-to-back calls with no breaks are exhausting."

P4: "I think asynchronous communication needs more emphasis. Not everything requires a meeting."

P6: "Documentation has improved though. We're writing more things down now, which helps with onboarding new team members."

Topic 2: Collaboration and Creativity

P2: "Brainstorming sessions are harder online. The energy just isn't there."

P1: "We've tried virtual whiteboards but they feel clunky compared to the real thing."

P4: "Pair programming works surprisingly well over video though. Screen sharing is actually clearer than huddling around one monitor."

P3: "The lack of spontaneous conversations has hurt innovation. Those hallway chats where ideas sparked - we've lost that."

P5: "We've tried scheduled 'innovation time' but it feels forced. Creativity can't be scheduled."

P6: "I've found that smaller group calls work better than large meetings for creative work."

Topic 3: Work-Life Balance

P4: "I'm working more hours now than before. It's harder to 'leave' work when it's in your home."

P1: "But I've also gained flexibility. I can take care of personal tasks during the day and work in the evening if needed."

P3: "My mental health suffered initially. The isolation was hard. But I've adapted and actually prefer it now."

P6: "The commute savings are huge. That's time I now spend with my family."

P2: "Setting up a dedicated workspace helped me separate work from personal life."

P5: "I miss the social aspects of the office, but I don't miss the office politics and distractions."

Facilitator Summary:
Key themes emerging include communication overload, video fatigue, loss of spontaneous collaboration, challenges with work-life boundaries, but also appreciation for flexibility and commute savings. Team dynamics have shifted, with some positive changes in meeting equality and documentation practices.`,
  },
];

export const SAMPLE_CODES: Omit<Code, 'id' | 'createdAt'>[] = [
  // Main codes
  {
    name: 'Work-Life Balance',
    level: 'main',
    color: '#3b82f6',
    excerptIds: [],
    frequency: 0,
    documentCount: 0,
  },
  {
    name: 'Communication',
    level: 'main',
    color: '#3b82f6',
    excerptIds: [],
    frequency: 0,
    documentCount: 0,
  },
  {
    name: 'Productivity',
    level: 'main',
    color: '#3b82f6',
    excerptIds: [],
    frequency: 0,
    documentCount: 0,
  },
  {
    name: 'Mental Health',
    level: 'main',
    color: '#3b82f6',
    excerptIds: [],
    frequency: 0,
    documentCount: 0,
  },
  {
    name: 'Technology',
    level: 'main',
    color: '#3b82f6',
    excerptIds: [],
    frequency: 0,
    documentCount: 0,
  },
];

export const SAMPLE_THEMES: Omit<Theme, 'id' | 'createdAt'>[] = [
  {
    name: 'Individual Experience',
    description: 'Personal experiences and challenges of remote work',
    color: '#ec4899',
    codeIds: [],
  },
  {
    name: 'Organizational Dynamics',
    description: 'Team and organizational level impacts',
    color: '#8b5cf6',
    codeIds: [],
  },
  {
    name: 'Technology Adoption',
    description: 'Tools, platforms, and technological adaptations',
    color: '#0ea5e9',
    codeIds: [],
  },
];

export function loadSampleData(
  addDocument: (doc: Omit<QDADocument, 'id' | 'uploadedAt' | 'excerpts'>) => void,
  addCode: (name: string, parentId?: string, level?: Code['level']) => Code,
  addTheme: (name: string, color: string, parentId?: string) => Theme
) {
  // Add sample documents
  SAMPLE_DOCUMENTS.forEach((doc) => {
    addDocument(doc);
  });

  // Add sample codes
  SAMPLE_CODES.forEach((code) => {
    addCode(code.name, undefined, code.level);
  });

  // Add sample themes
  SAMPLE_THEMES.forEach((theme) => {
    addTheme(theme.name, theme.color);
  });
}
