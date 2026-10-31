import type { BookDoc } from '../model/types'

// Demo manuscript: a short novella used to seed the sample project.

export const DEMO_LAYOUT = 'trade'

export function demoDoc(): BookDoc {
  const scenes: BookDoc['scenes'] = {}
  const blocks: BookDoc['blocks'] = []
  const footnotes: Record<string, string> = {}

  const add = (type: 'frontmatter' | 'part' | 'chapter' | 'backmatter', title: string, kind: string | undefined, sceneGroups: string[][]) => {
    const id = 'blk_' + Math.random().toString(36).slice(2, 9)
    const sceneIds: string[] = []
    for (const paras of sceneGroups) {
      const sid = 'sc_' + Math.random().toString(36).slice(2, 9)
      scenes[sid] = paras.map((t) => {
        if (t === '* * *') return { type: 'sceneBreak' as const }
        if (t.startsWith('## ')) return { type: 'heading' as const, attrs: { level: 2 as const }, content: [{ type: 'text' as const, text: t.slice(3) }] }
        if (t.startsWith('### ')) return { type: 'heading' as const, attrs: { level: 3 as const }, content: [{ type: 'text' as const, text: t.slice(4) }] }
        if (t.startsWith('> ')) {
          const [quote, attrib] = t.slice(2).split('||')
          return { type: 'blockquote' as const, attrs: { attribution: attrib || undefined }, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: quote.trim() }] }] }
        }
        if (t.startsWith('- ')) {
          return {
            type: 'bulletList' as const,
            content: t.slice(2).split('|').map((li) => ({ type: 'listItem' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: li.trim() }] }] })),
          }
        }
        // footnote marker: text{fn:some key}
        const fnMatch = /^(.*?)\{fn:([a-z0-9_]+)\}(.*)$/.exec(t)
        if (fnMatch) {
          footnotes[fnMatch[2]] = FOOTNOTES[fnMatch[2]] || ''
          return {
            type: 'paragraph' as const,
            content: [
              { type: 'text' as const, text: fnMatch[1] },
              { type: 'footnoteRef' as const, attrs: { id: fnMatch[2] } },
              { type: 'text' as const, text: fnMatch[3] },
            ],
          }
        }
        return { type: 'paragraph' as const, content: [{ type: 'text' as const, text: t }] }
      })
      sceneIds.push(sid)
    }
    blocks.push({ id, type, title, kind: kind as never, sceneIds })
  }

  add('frontmatter', 'Title Page', 'titlepage', [[]])
  add('frontmatter', 'Copyright', 'copyright', [[]])
  add('frontmatter', 'Dedication', 'dedication', [['For everyone who has ever kept the light on.']])
  add('frontmatter', 'Epigraph', 'epigraph', [
    ['> The sea keeps no records but the ones we make of it.||— Attributed to a lighthouse keeper, 1911'],
  ])

  add('part', 'Part One — The Keeping', undefined, [
    ['At the north end of the point, where the rock narrows to a finger and the wind comes off the water with nothing in its way, the lighthouse had stood for one hundred and forty years. It was not the tallest light on the coast. It was only the loneliest, and the loneliest, Maren had discovered, was the one that stayed on.'],
  ])

  add('chapter', 'Chapter One', undefined, [
    [
      'The lamp needed cleaning on Tuesdays, and on Tuesdays it rained, so Maren had come to think of the rain as part of the work: an order she had to fulfil, a way of the weather telling her what came next. She climbed the ninety-nine steps with the rag in her back pocket and the oil can in her hand and counted them aloud, as her father had, and as his mother had before him.',
      'Outside, the sea was the colour of a coin left in a drawer. The gulls had gone inland. That was the first sign, though she did not know it yet — the gulls going inland before a storm, as if the sky were a room they had been asked to leave.',
      '"You are early," she said to the weather, and the weather, as usual, did not answer.',
      '* * *',
      'The bell at the door rang at four. Nobody rang the bell at four. In winter the supply boat came on Thursdays, and the post came when the post came, which was never. Maren set the oil can down on the third landing and went down the spiral of the stairs with her hand on the rail, feeling the iron still warm from the lamp above.',
      'There was a man on the step. He was wet through and holding a leather case above his head as though it were a child, and he had the look of someone who had walked a very long way to be disappointed.',
      '"I am looking for the keeper," he said.',
      '"You have found her," said Maren. "She is not receiving visitors."',
      'The man considered this. Rain ran off the edge of the case in a neat line, and he watched it fall as though it were something he had made. "I am not a visitor," he said at last. "I am a historian. I have come about the light.{fn:historians} The records say it went dark for eleven days in 1911, and I would like to know why."',
      'Maren did not step aside. The light had never gone dark in her lifetime, and she had lived here all of it, and she knew, the way she knew the count of the stairs, that the light had never gone dark before that either. But she also knew — had known since she was nine, since her father had shown her the ledger with the missing pages — that some records lie by omission, and that the sea, patient as it was, kept every one of them.',
      '"Come in," she said, "before the wind does."',
    ],
    [
      '## The Ledger',
      'The ledger lived in a cupboard behind the stairs, wrapped in a square of oilcloth that smelled of the boat shed. Maren had not opened it since the spring. She opened it now on the kitchen table, between the two of them, while the kettle began its long complaint on the stove.',
      'The historian — his name was Aldous Pike, and he said it as though he expected her to have heard of it — turned the pages with the delicacy of a man handling something he had been told not to touch. Every page was ruled in a steady hand. Every page had a date, a weather note, a time the lamp was lit, a time it was put out.',
      'Every page, that is, until the winter of 1911, where four leaves had been cut out with a blade, so cleanly that the thread showed like a scar.',
      '> A record with a hole in it is not a record. It is a question wearing a record\'s clothes.||— Maren\'s father, often',
      'Pike sat back. "Who removed these?"',
      '"The keeper before my father," said Maren. "She was my grandmother. She kept the light for forty years, and then one morning she rowed to the mainland and did not come back, and nobody ever asked her why, because in those days nobody asked a woman why."',
      'The kettle screamed. She lifted it off the flame and poured, and the steam rose between them and hung there, and for a moment the kitchen was as private as a room can be when two people are deciding how much of the truth to tell.',
    ],
  ])

  add('chapter', 'Chapter Two', undefined, [
    [
      'They worked through the night, because the lamp did not care what they were doing and would not be neglected. Maren went up at dusk to light it and stayed to watch the first turn of the lens, that long slow sweep across the water, the beam going out and out until it was too far to be light at all and became, instead, a promise.',
      'Pike came up behind her with two cups of tea and stood at the gallery rail with his collar turned up. The rain had stopped. The sea had that polished look it gets when it is thinking.',
      '"My grandfather kept a light, too," he said. "On the other coast. He used to say the work was not the lighting of it. The work was the not letting it go out."',
      '"That is the whole of it," Maren said. "Everything else is maintenance."',
      '* * *',
      'It was near three when she found the letter. It had been folded into the seam of the binding, where the cut pages had been, and it had waited there a hundred and ten years to be found by someone who knew where to look — or, more honestly, by someone who had run out of other places to look.',
      'The hand was her grandmother\'s. She knew it from the old labels in the cupboard, from the faded tally marks on the doorframe. It was addressed to no one. It began, simply:',
      '> To whoever is keeping the light when this is read —||',
      'and then, in a smaller, steadier hand, the truth of those eleven dark days, written down at last because the sea keeps no records but the ones we make of it, and a woman who has been asked to forget will, if she is careful, find a way to remember.',
      '### What the letter said',
      'Maren read it twice. The first time for the words. The second time for the silences between them, which were longer, and which she had inherited.',
      '- The lamp did not fail. It was put out.|- The keeper did not leave. She was sent for.|- The record was not lost. It was hidden, in a place the sea could not reach, by a woman who did not trust the sea.|- Eleven days, and then the light came back on, and the world decided that nothing had happened.',
      'Pike read it third, and when he had finished he folded it along its old creases and did not say anything for a long while. Then he said, "I came here to write about a failure of equipment."',
      '"You came here to write about a failure of remembering," Maren said. "The equipment was fine."',
    ],
  ])

  add('part', 'Part Two — The Turning', undefined, [
    ['There are two kinds of night on the point: the kind with a light in it, and the kind without. Maren had lived through ten thousand of the first and none of the second, and it was the second that she began, that spring, to think about.'],
  ])

  add('chapter', 'Chapter Three', undefined, [
    [
      'The supply boat came on Thursday with flour, oil, three letters and a telegram. Maren read the telegram on the pier with the wind trying to take it out of her hands. It was from the trust that owned the light. It said the light was to be automated in the autumn, and that the keeper\'s position would be "honourably concluded", and that she should expect a visit from the engineer.',
      'She read it four times, which was three times too many, and then she folded it into her pocket and carried the flour up the hill and made bread, because the bread did not care either.',
      'Pike found her at the table with her hands in the dough. He had been out on the headland all morning with his notebook, measuring the length of the beam against the dark. He said, "The engineer is coming on the fourteenth."',
      '"How do you know that?"',
      '"Because I am the engineer\'s son," said Pike. "I did not come about the eleven days. I came because my father was sent to do the same work here that he did on my grandfather\'s coast, and because he never came home from it, and because the letter he left behind said only that I should find the keeper and ask her to show me the ledger."',
      '* * *',
      'The rain came back that night, and the two of them climbed the ninety-nine steps together, and Maren counted them aloud, and Pike counted with her, and by the time they reached the lamp the counting had become something else — a kind of agreement, the way two people agreeing to keep something alive will always sound like counting.',
      '"If they automate it," Pike said, "who will notice when it goes dark?"',
      '"Nobody," said Maren. "That is the point of a machine. It is never tired, and it never asks to be remembered."',
      'She opened the little door of the lamp and put the flame to the wick, and the light went out into the rain and was swallowed, and then the lens turned, and there it was again, going out and out, a promise at the edge of how far anyone could see.',
    ],
  ])

  add('backmatter', 'Acknowledgments', 'acknowledgments', [
    ['Every book is a lighthouse kept by more than one person. My thanks to the keepers: to the archives that let me read the ledgers, to the readers who told me when the beam swung wide, and to everyone who has ever left a light on for somebody else.'],
  ])
  add('backmatter', 'About the Author', 'aboutAuthor', [
    ['The author has never kept a lighthouse, but has spent a great deal of time in rooms where the light was on and the door was shut, which is nearly the same thing.'],
  ])
  add('backmatter', 'Notes', 'endnotes', [[]])

  return { version: 1, blocks, scenes, footnotes }
}

const FOOTNOTES: Record<string, string> = {
  historians:
    'The term "historian" in the coastal registers of the period usually meant an inspector of lights, and was not a compliment.',
}
