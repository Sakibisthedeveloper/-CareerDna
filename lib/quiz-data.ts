export type PersonalityType = 'creative' | 'analytical' | 'social' | 'technical';

export interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    type: PersonalityType;
  }[];
}

export const questions: Question[] = [
  {
    id: 1,
    text: "How do you prefer to spend your free time?",
    options: [
      { text: "Drawing, writing, or making videos", type: "creative" },
      { text: "Solving puzzles or playing strategy games", type: "analytical" },
      { text: "Hanging out with friends and meeting new people", type: "social" },
      { text: "Tinkering with gadgets or coding", type: "technical" },
    ],
  },
  {
    id: 2,
    text: "What kind of school projects did you enjoy most?",
    options: [
      { text: "Art projects or creative writing", type: "creative" },
      { text: "Science experiments or math problems", type: "analytical" },
      { text: "Group presentations or debates", type: "social" },
      { text: "Computer lab tasks or building models", type: "technical" },
    ],
  },
  {
    id: 3,
    text: "When facing a problem, what's your first instinct?",
    options: [
      { text: "Brainstorm unique and out-of-the-box solutions", type: "creative" },
      { text: "Analyze the data and facts first", type: "analytical" },
      { text: "Ask others for their input and collaborate", type: "social" },
      { text: "Look for a tool or technology to fix it", type: "technical" },
    ],
  },
  {
    id: 4,
    text: "Which TV show character do you relate to most?",
    options: [
      { text: "The artistic visionary", type: "creative" },
      { text: "The brilliant detective", type: "analytical" },
      { text: "The charismatic leader", type: "social" },
      { text: "The tech genius hacker", type: "technical" },
    ],
  },
  {
    id: 5,
    text: "If you could start a club, what would it be?",
    options: [
      { text: "Photography or Drama Club", type: "creative" },
      { text: "Debate or Chess Club", type: "analytical" },
      { text: "Volunteering or Event Planning Club", type: "social" },
      { text: "Robotics or Coding Club", type: "technical" },
    ],
  },
  {
    id: 6,
    text: "What's your favorite subject?",
    options: [
      { text: "Arts or Literature", type: "creative" },
      { text: "Math or Physics", type: "analytical" },
      { text: "Psychology or Sociology", type: "social" },
      { text: "Computer Science or IT", type: "technical" },
    ],
  },
  {
    id: 7,
    text: "How would your friends describe you?",
    options: [
      { text: "Imaginative and artistic", type: "creative" },
      { text: "Logical and smart", type: "analytical" },
      { text: "Friendly and talkative", type: "social" },
      { text: "Tech-savvy and handy", type: "technical" },
    ],
  },
  {
    id: 8,
    text: "What kind of YouTube videos do you watch?",
    options: [
      { text: "DIY, art tutorials, or vlogs", type: "creative" },
      { text: "Science explainers or documentaries", type: "analytical" },
      { text: "Podcasts or social commentary", type: "social" },
      { text: "Tech reviews or coding tutorials", type: "technical" },
    ],
  },
  {
    id: 9,
    text: "Pick a dream workspace:",
    options: [
      { text: "A colorful studio with music", type: "creative" },
      { text: "A quiet lab with data screens", type: "analytical" },
      { text: "A buzzing open office with people", type: "social" },
      { text: "A high-tech setup with multiple monitors", type: "technical" },
    ],
  },
  {
    id: 10,
    text: "What drives you most?",
    options: [
      { text: "Creating something beautiful", type: "creative" },
      { text: "Finding the truth in data", type: "analytical" },
      { text: "Helping and connecting with people", type: "social" },
      { text: "Building functional solutions", type: "technical" },
    ],
  },
];
