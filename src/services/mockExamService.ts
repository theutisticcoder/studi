
/**
 * Mock service that returns a list of exam titles.
 * In a real app, integrate with backend or API fetching real exam data.
 */
export async function getRandomExams(): Promise<string[]> {
  await new Promise(r => setTimeout(r, 800));
  const subjects = [
    'AP Calculus AB',
    'AP Physics C: Mechanics',
    'AP Chemistry',
    'AP Biology',
    'AP English Language',
    'AP World History',
  ];
  // Pick 6 random subjects
  const shuffled = subjects.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
}
