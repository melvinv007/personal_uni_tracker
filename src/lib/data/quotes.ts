/**
 * Motivational Quotes Data
 *
 * Purpose: Hardcoded list of motivational quotes for the home page.
 * A random quote is shown on each render/page refresh.
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
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Great things never come from comfort zones.", author: "Anonymous" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
  { text: "Small progress is still progress.", author: "Anonymous" },
  { text: "Your limitation—it's only your imagination.", author: "Anonymous" },
  { text: "Don’t wait for opportunity. Create it.", author: "Anonymous" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Hard work beats talent when talent doesn’t work hard.", author: "Tim Notke" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "Everything you’ve ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "If you’re going through hell, keep going.", author: "Winston Churchill" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Don’t limit your challenges. Challenge your limits.", author: "Anonymous" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Fall seven times and stand up eight.", author: "Japanese Proverb" },
  { text: "If opportunity doesn’t knock, build a door.", author: "Milton Berle" },
  { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving them.", author: "Zig Ziglar" },
  { text: "Don’t be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Success is how high you bounce when you hit bottom.", author: "George S. Patton" },
  { text: "Work hard in silence, let success make the noise.", author: "Frank Ocean" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "Don’t wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "You miss 100% of the shots you don’t take.", author: "Wayne Gretzky" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", author: "Steve Jobs" },
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
 * Gets a random quote from the static list.
 *
 * @returns Random quote
 *
 * Reference: PRD Section 9.2
 */
export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}
