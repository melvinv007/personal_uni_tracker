/**
 * Motivational Quotes Data
 *
 * Purpose: Hardcoded list of motivational quotes for the home page.
 * A different quote is shown each day using (dayOfYear % totalQuotes).
 *
 * No external API needed — PRD Section 9.2.
 *
 * Reference: PRD Section 9.2 (Motivational Quote Card)
 */

/** Quote shape */
export interface Quote {
  text: string;
  author: string;
}

/** Static list of motivational quotes relevant to studying/productivity */
export const QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "If you want to achieve greatness, stop asking for permission.", author: "Unknown" },
];

/**
 * Gets the quote for today based on day of year.
 * Uses modular arithmetic: dayOfYear % totalQuotes.
 *
 * @param date - Date to get quote for (defaults to today)
 * @returns Today's quote
 *
 * Reference: PRD Section 9.2
 */
export function getTodayQuote(date: Date = new Date()): Quote {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}
