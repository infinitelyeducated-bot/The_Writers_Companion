// Worked examples for the audience and genre families. Data only (no imports from
// examples.ts), so examples.ts can build real books from it without a cycle.
// Every excerpt is original text, short enough to read in a minute.

export interface RawExample {
  id: string
  title: string
  subtitle?: string
  author: string
  genre: string
  description: string
  dedication?: string
  epigraph?: [string, string]
  chapters: { title: string; paras: string[] }[]
  length: string
  pages: string
}

export const RAW_EXAMPLES: RawExample[] = [
  { id: 'firstnovel', title: 'The Last Ferry to Dunmore', subtitle: 'A novel', author: 'Priya Venn', genre: 'Debut novel',
    description: 'A teacher who has never left the mainland takes the last ferry to an island that is closing its school.',
    dedication: 'For my mother, who kept every draft.',
    epigraph: ['An island is only a place that has agreed to be small.', 'Island proverb'],
    chapters: [
      { title: 'Chapter One', paras: ['The ferry left eleven minutes late, which Anna Reyes took as a sign. She had packed for a year and told everyone it was a term.', 'The island came up out of the haze like a held breath finally let go. A boy on the rail pointed and said its name as if it were a person he owed money.', '“You’re the new one,” he said. “Mrs. Hale said you’d be thinner.”'] },
      { title: 'Chapter Two', paras: ['The school had eleven desks and one window that opened. Anna chose the window.', 'By Friday she knew every child by the way they lied. By Sunday she knew the island was lying to her too, and kindly, which was worse.'] }],
    length: 'Aim for 70,000–100,000 words · a debut novel an agent will read', pages: 'Aim for roughly 240–340 pages at 5.5 × 8.5' },
  { id: 'series', title: 'Ashfall', subtitle: 'The Ember Reach, Book Two', author: 'Dara Quill', genre: 'Series book',
    description: 'Book two: the survivors of the northern keep must cross the burned reach before the winter gates close.',
    dedication: 'For the readers who asked what happened next.',
    chapters: [
      { title: 'Chapter One', paras: ['Three weeks had passed since the keep fell, and Merrin still woke counting the dead.', 'Tomas had not spoken since the river. He walked at the back of the line, carrying the banner that no longer had a king to fly it for.', '“If we reach the gates by the new moon,” said Captain Ilse, “we live. If not, we are a story someone else tells.”'] },
      { title: 'Chapter Two', paras: ['The reach was grey from horizon to horizon, ash drifted against the walls of villages that had never been told the war was over.', 'Merrin found the first sign at dusk: a child’s shoe, set carefully on a stone, pointing north.'] }],
    length: 'Aim for 80,000–110,000 words · each book standing alone', pages: 'Aim for roughly 300–420 pages at 5.25 × 8' },
  { id: 'professional', title: 'The Ten-Minute Leader', subtitle: 'Small habits for people with no time', author: 'Marcus Oyelaran', genre: 'Business book',
    description: 'A short field guide to leading a team in the gaps between meetings.',
    chapters: [
      { title: 'Chapter 1', paras: ['You do not have an hour. Nobody does. This book assumes you have ten minutes, twice a day, and a team that would like to be led rather than managed.', 'Every chapter ends with one habit you can try tomorrow morning. Not a framework. A habit.'] },
      { title: 'Chapter 2', paras: ['The best leaders I have worked with shared one trait: they asked a question before they gave an answer, and they waited for the reply.', 'Try it once today. Ask, then count to five before you speak. Notice what the silence does.'] }],
    length: 'Aim for 30,000–60,000 words · short enough to finish on a flight', pages: 'Aim for roughly 140–240 pages at 6 × 9' },
  { id: 'family', title: 'Grandpa Ray’s Kitchen', subtitle: 'Stories and recipes for the people I love', author: 'Raymond Ellis', genre: 'Family story',
    description: 'Eighty years of stories, told at the kitchen table for the grandchildren.',
    dedication: 'For Lily, Sam and Josie, who always asked for one more story.',
    chapters: [
      { title: 'First Story', paras: ['I was born in the back bedroom of a farmhouse in the winter of 1944, and the first thing I am told I did was refuse to cry.', 'Your great-grandmother said that settled it: this one would be stubborn. She was right, and I have been grateful for it ever since.'] },
      { title: 'Second Story', paras: ['The kitchen was the warmest room in the house, so that is where everything important happened.', 'Sunday dinner was at two. If you were late, you ate standing up, and nobody felt sorry for you.'] }],
    length: 'Aim for 15,000–50,000 words · as long as your stories need', pages: 'Aim for roughly 80–220 pages at 6 × 9' },
  { id: 'retirees', title: 'Second Light', subtitle: 'Essays from the first ten years of retirement', author: 'Margaret Doyle', genre: 'Life writing',
    description: 'Short essays on gardens, grief, and the surprising busyness of having time.',
    dedication: 'For Tom, who would have disagreed with most of this.',
    chapters: [
      { title: 'Essay One', paras: ['On the morning after my last day of work I woke at six, out of habit, and lay there listening to a house that wanted nothing from me.', 'It took a year to learn what to do with that silence. The first lesson was that it was not empty.'] },
      { title: 'Essay Two', paras: ['I planted tomatoes the way my father did, too close together and with great optimism.', 'Some things do not need to be done well to be done happily.'] }],
    length: 'Aim for 25,000–60,000 words · a collection of short essays', pages: 'Aim for roughly 120–240 pages at 5.5 × 8.5' },
  { id: 'hobby', title: 'Notes From the Kitchen Table', author: 'Jamie Rourke', genre: 'Notebook book',
    description: 'A year of small stories written for the pleasure of it, one cup of tea at a time.',
    dedication: 'For anyone who writes just because.',
    chapters: [
      { title: 'January', paras: ['The year began, as years do, with a list I did not follow and a pen I did not want to put down.', 'This is the first entry. It has no point. That is the point.'] },
      { title: 'February', paras: ['Snow all week. The cat has claimed the radiator and I have claimed the cat.', 'Today I wrote four sentences about a lighthouse I have never visited, and they were the best part of the day.'] }],
    length: 'No fixed length · write what you enjoy', pages: 'Aim for roughly 60–180 pages at 5 × 8' },
  { id: 'selfpub', title: 'Harbor Lights', subtitle: 'A cozy mystery', author: 'Colleen Marsh', genre: 'Ready to upload',
    description: 'A retired baker finds a stranger’s note in a loaf of bread and cannot leave it alone.',
    dedication: 'For the readers who found me first.',
    epigraph: ['Every small town keeps one secret in the bakery.', 'Colleen Marsh'],
    chapters: [
      { title: 'Chapter 1', paras: ['Edna Pike had been baking the same rye since 1987, and in all that time nothing had ever been inside it but rye.', 'The note was folded into eighths, written in pencil, and said only: “Don’t trust the harbor master.”'] },
      { title: 'Chapter 2', paras: ['The harbor master, Walt Brennan, bought a loaf every Tuesday and paid in exact change.', 'Edna decided she would make a very special loaf this week.'] }],
    length: 'Aim for 50,000–90,000 words · ready for KDP or IngramSpark', pages: 'Aim for roughly 200–340 pages at 5.5 × 8.5' },
  { id: 'romance', title: 'A Summer Worth Keeping', subtitle: 'A novel', author: 'Elise Hartwell', genre: 'Romance',
    description: 'A wedding planner who does not believe in weddings falls for the florist who does.',
    dedication: 'For everyone who stayed for the second chance.',
    chapters: [
      { title: 'Chapter One', paras: ['Nora Bell had planned two hundred and six weddings and attended none of them with her whole heart.', 'Then Theo Marlowe walked into the barn with a bucket of peonies and an apology, and the afternoon went quiet around him.', '“You’re standing in my aisle,” she said. “And you’re standing in my light,” he said, smiling, and that was the beginning of the trouble.'] },
      { title: 'Chapter Two', paras: ['By Thursday she had stopped pretending the flowers were the reason she kept walking past the barn.', 'By Saturday she had stopped pretending anything at all.'] }],
    length: 'Aim for 60,000–90,000 words · a satisfying, complete love story', pages: 'Aim for roughly 240–340 pages at 5.5 × 8.5' },
  { id: 'fantasy', title: 'The Crown of Small Hours', subtitle: 'Book One of the Hollowing', author: 'Tamsin Verrall', genre: 'Fantasy',
    description: 'A clockmaker’s apprentice discovers the city’s bells are all that hold back the night.',
    dedication: 'For the ones who read by torchlight.',
    epigraph: ['Every kingdom is a promise the dark has not yet broken.', 'The Book of Bells'],
    chapters: [
      { title: 'Chapter One', paras: ['In the city of Vael, the bells rang at the quarter hour, and no one living could say who had first wound them.', 'Ilya wound them now, forty steps above the market, with grease to the elbow and a secret she had told no one: the bells had missed a stroke last night.', 'Somewhere below, a door she had never seen before stood open in the clock tower wall.'] },
      { title: 'Chapter Two', paras: ['The stairs behind the door descended further than the tower was tall.', 'Ilya took a candle and the smallest of her wrenches, and counted the steps, because counting was the only thing that had ever made the dark behave.'] }],
    length: 'Aim for 90,000–140,000 words · room to build a world', pages: 'Aim for roughly 340–520 pages at 6 × 9' },
  { id: 'scifi', title: 'The Quiet Between Stars', subtitle: 'A novel', author: 'Idris Calder', genre: 'Science fiction',
    description: 'The navigator of a generation ship finds a signal that was sent from inside the hull.',
    epigraph: ['Distance is only time that has not yet arrived.', 'Ship’s log, Year 212'],
    chapters: [
      { title: 'Chapter 1', paras: ['Navigator Sera Okoye had been awake for four hours when the signal arrived, and by the fifth she had stopped believing in coincidences.', 'The Ardent had been in transit for two hundred and twelve years. Nothing aboard transmitted. Nothing had needed to since the last of the Earthborn died.', '“It is coming from Deck Nine,” said the ship. “Deck Nine has been sealed since Year Forty.”'] },
      { title: 'Chapter 2', paras: ['The lift to Deck Nine had no button. Sera held the override key for a full minute before she turned it.', 'The doors opened onto a corridor full of light, and at the end of it, someone had left a chair facing the window.'] }],
    length: 'Aim for 80,000–120,000 words · enough room for the idea', pages: 'Aim for roughly 300–440 pages at 6 × 9' },
  { id: 'mystery', title: 'The Ninth Hour', subtitle: 'A thriller', author: 'Cal Winslow', genre: 'Mystery / Thriller',
    description: 'A night nurse realises the patient who died at 3 a.m. was killed by someone who still works the ward.',
    chapters: [
      { title: 'Chapter 1', paras: ['At 3:07 a.m. Mr. Aldous Crane stopped breathing, and at 3:09 Nurse Joan Pryce knew he had not done it alone.', 'The monitor had been switched off. Not paused. Switched off, by a hand that knew exactly which button to press.', 'She reached for the phone, and found the line already dead.'] },
      { title: 'Chapter 2', paras: ['Seven staff were on shift. Joan had worked beside every one of them for years.', 'One of them had just locked the ward door from the outside.'] }],
    length: 'Aim for 70,000–100,000 words · short, fast chapters', pages: 'Aim for roughly 260–360 pages at 5.5 × 8.5' },
  { id: 'paranormal', title: 'What the Lantern Knows', subtitle: 'A novel', author: 'Odessa Lark', genre: 'Paranormal',
    description: 'A woman inherits her grandmother’s house and its inhabitants, none of them alive.',
    epigraph: ['The dead are only impatient.', 'Odessa Lark'],
    chapters: [
      { title: 'Chapter One', paras: ['The house at Marrow Lane had been empty for six years, and it had not been quiet for one of them.', 'Wren Calloway stood in the hall with the key still warm in her hand and counted the footsteps overhead. Four. Then a fifth, lighter, that stopped at the top of the stairs.', '“You’re late,” said a voice from the lantern on the shelf. “She said you’d come on a Tuesday.”'] },
      { title: 'Chapter Two', paras: ['The lantern would not stay lit unless someone told it the truth.', 'Wren found this out the hard way, which is how she found out most things in that house.'] }],
    length: 'Aim for 70,000–100,000 words · atmosphere over speed', pages: 'Aim for roughly 260–360 pages at 5.5 × 8.5' },
  { id: 'adventure', title: 'The Long Way Down', subtitle: 'A novel', author: 'Rex Halloran', genre: 'Adventure',
    description: 'Three strangers, one stolen map and a river that does not forgive mistakes.',
    chapters: [
      { title: 'Chapter 1', paras: ['The plane went down at 11:40 in the morning, and by noon Cole Merritt had already stopped counting the things that were going wrong.', 'The river was forty feet below the ridge. The map was in the pilot’s coat. The pilot was not answering.', '“Jungle’s that way,” said the woman beside him, pointing at everything. “Which means so are we.”'] },
      { title: 'Chapter 2', paras: ['They found the first trap at dusk, and the second one found them.', 'By the time the sky went dark, Cole had learned two things: the map was real, and so was whoever else was following it.'] }],
    length: 'Aim for 70,000–100,000 words · momentum on every page', pages: 'Aim for roughly 260–380 pages at 6 × 9' },
  { id: 'historical', title: 'The Cartographer’s Daughter', subtitle: 'A novel of 1745', author: 'Helena Prewitt', genre: 'Historical',
    description: 'In the winter of 1745, a mapmaker’s daughter is asked to draw the road her country will use to fall.',
    dedication: 'For the women left out of the margins.',
    epigraph: ['The past is a country; they draw different maps there.', 'After L. P. Hartley'],
    chapters: [
      { title: 'Chapter I', paras: ['Edinburgh, November 1745. The snow came early that year, and with it the rumour that the Prince had crossed the border.', 'Catherine Rae sat at her father’s drafting table and inked the border of a map she had been told not to finish.', '“Make it accurate,” said the man at the door. “Make it so accurate it could kill someone.”'] },
      { title: 'Chapter II', paras: ['She had been trained to measure what she saw and to trust it, which made her a poor spy and an excellent witness.', 'By candlelight she began to understand what the map was for.'] }],
    length: 'Aim for 90,000–130,000 words · research worn lightly', pages: 'Aim for roughly 320–460 pages at 6 × 9' },
  { id: 'horror', title: 'The Quiet Room', subtitle: 'A novel', author: 'Vera Thorne', genre: 'Horror',
    description: 'The new owners of a house discover that one room has been listening to them since the day they moved in.',
    epigraph: ['Some silences have teeth.', 'Vera Thorne'],
    chapters: [
      { title: 'Chapter One', paras: ['The estate agent had not mentioned the room, and when Dana asked, he said there was no such room.', 'It was at the end of the upstairs hall, behind a door painted to match the wall, and it was exactly the temperature of a held breath.', 'That night, from inside it, someone began to hum the lullaby she had never told anyone she remembered.'] },
      { title: 'Chapter Two', paras: ['Dana did not open the door. She stood in the hall in the dark and listened to herself breathing.', 'Slowly, from the other side, the humming stopped. Then it began again, a little nearer the floor.'] }],
    length: 'Aim for 60,000–90,000 words · dread builds slowly', pages: 'Aim for roughly 220–340 pages at 5.5 × 8.5' },
  { id: 'literary', title: 'What the River Kept', subtitle: 'A novel', author: 'Anselm Ferreira', genre: 'Literary fiction',
    description: 'Three generations of a family and the town that watched them fail to talk to each other.',
    dedication: 'For my father.',
    epigraph: ['We were all of us leaving, and only some of us left.', 'Anselm Ferreira'],
    chapters: [
      { title: 'One', paras: ['My father taught me to read the river the way other fathers taught their sons to read the weather: with one eye, and without saying what he saw.', 'The river rose in March that year and took the lower field and the shed and, eventually, the argument we had been having since 1974.'] },
      { title: 'Two', paras: ['My mother kept a drawer of unsent letters, and on Sundays she would take one out and read it aloud to the kitchen.', 'It was years before I understood that the kitchen was the only one who had ever been meant to answer.'] }],
    length: 'Aim for 60,000–100,000 words · depth over plot', pages: 'Aim for roughly 220–340 pages at 5.5 × 8.5' },
  { id: 'ya', title: 'Static', subtitle: 'A novel', author: 'Mara Quinn', genre: 'Young adult',
    description: 'A sixteen-year-old radio nerd picks up a signal that knows her name.',
    dedication: 'For the kids who listen when nobody is talking.',
    chapters: [
      { title: 'Chapter 1', paras: ['Zoe Park had exactly three friends, four antennas, and one rule: never answer when the radio calls your name.', 'She broke it on a Tuesday, at 2:14 a.m., because the voice on the other end was crying.', '“Okay,” she whispered. “Who is this?” The static cleared. “I think,” said the voice, “I’m you.”'] },
      { title: 'Chapter 2', paras: ['At school the next day, everything felt like a rerun of a show she hadn’t quite seen.', 'By lunch, Zoe had started writing down every strange thing, because that is what scientists do, and also because she was terrified.'] }],
    length: 'Aim for 50,000–85,000 words · a voice that feels like a friend', pages: 'Aim for roughly 200–340 pages at 5.5 × 8.5' },
  { id: 'shortstories', title: 'Small Hours', subtitle: 'Stories', author: 'Noor Abbasi', genre: 'Collection',
    description: 'Seven short stories about the hour when the house stops pretending.',
    dedication: 'For the night owls.',
    chapters: [
      { title: 'The Night Baker', paras: ['At four every morning, Mr. Haddad turned on the oven and spoke to the dough as if it were listening.', 'It was the only conversation he trusted. The dough never repeated what he said.'] },
      { title: 'Last Bus', paras: ['The last bus left at 12:40 and carried exactly the same people every night, though none of them would have admitted to knowing each other.', 'Tonight there was one extra passenger, and she had a ticket for a stop that did not exist.'] }],
    length: 'Aim for 25,000–75,000 words · each story its own length', pages: 'Aim for roughly 120–280 pages at 5.25 × 8' },
]
