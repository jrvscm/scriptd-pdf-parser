const fs = require('fs');
const PDFJS = require('pdfjs-dist');
const _ = require('lodash');
const uuid = require('uuid/v4');
const ls = require('ls');

const CHUNK_TYPES = {
  loc: 'location',
  expo: 'exposition',
  speech: 'speech',
  dialogue: 'dialogue'
};

process.on('message', (data) => {
  parse({data: data})
})

const getPages = async (document) => {
  const pages = [];

  try {
    for (let i = 1; i <= document.numPages; i++) {
      let page = await document.getPage(i);
      let { height } = page.getViewport(1, 0);
      let text = await page.getTextContent({
        disableCombineTextItems: false,
        normalizeWhitespace: false
      });
      let rows = {};
      text.items.map(({ str, transform }) => {
        let [,,,, tx, ty] = transform;
        ty = height - ty;
        const row = rows[ty] || [];
        row.push({str, tx, ty});
        rows[ty] = row;
      });
      pages.push(rows);
    }
  } catch (err) {
    console.error(err);
    return;
  }

  return pages;
};

const getViewport = async (document) => {
  const page = await document.getPage(1);
  return page.getViewport(1, 0);
}

const smallestReducer = (smallest, ty, i, arr) => arr[i+1] ? Math.min(smallest, arr[i+1] - ty) : smallest;

const getChunks = (pages = []) => {
  const lineWrapDeltaY = Object.keys(pages[0]).reduce(smallestReducer, Infinity) + 2; // Adding a couple of pixels to deal with inconsistencies on line height
  const chunks = [];

  _.flatten(pages).map((rows, i, arr) => {
    let currentChunk = [];

    Object.keys(rows).map((ty, i, arr) => {
      if (i > 0 && ty - arr[i-1] > lineWrapDeltaY) {
        chunks.push(currentChunk);
        currentChunk = rows[ty];
        return;
      }

      currentChunk = currentChunk.concat(rows[ty]);
    });

    chunks.push(currentChunk);
  });

  return chunks;
};

const lettersToText = pages => {
  

  pages = pages.map( (chunks, pageIndex) => {

    let result = {};

    // if(pageIndex != 3) return chunks;

    chunks = chunks.map( (chunk, chunkIndex) => {
      const {tx, ty, str} = chunk;

      // grouping by TY, getting nice arrays for each line
      if(Array.isArray(result[ty])) {
        (result[ty]).push(chunk)
      }else{
        result[ty] = [chunk]
      }

      return chunk;
    })

    // console.log(Object.keys(result))


    result = Object.keys(result).map( arrayIndex => {
      let array = result[arrayIndex];
      array = _.orderBy(array, ['tx'],['asc']);

      const ty = arrayIndex;
      const tx = array[0]['tx'];
      const str = array.map( r => r.str).join('')

      /*
        returning nice line here like:

        [
          {
            "str": "Something went wrong.",
            "tx": 108,
            "ty": "141"
          }
        ]

      */
      return {str, tx, ty};
    })

    // return chunks;
    return Object.keys(result).map( key => result[key] )

  })

  // console.log(JSON.stringify(pages, null, 2))
  
  return pages;
}

const parseAndStoreCharacters = (line, characters) => {
  return _.compact(line.map(text => {
    const matches = text.str.match(/^([^(]+)(\([^)]+\)\s?)*$/);
    const name = matches && matches[1].trim();

    if (!name) {
      return;
    }

    const chunkCharacter = {
      name,
      id: _.findKey(characters, (_name) => _name == name) || uuid(),
      modifier: matches[2]
    };
    characters[chunkCharacter.id] = name;

    return chunkCharacter;
  }));
};

const getTitle = (cover) => {
  let title = cover[_.min(Object.keys(cover))].map(text => text.str).join(' ');

  let matches = title.match(/((\w\s)+)\s+((\w\s)+(\w))/);
  // i.e.: L O V E   C I T Y
  if (matches) {
    return `${matches[1].replace(/\s/g, '')} ${matches[3].replace(/\s/g, '')}`;
  }

  return title.trim();
};
const isLeftAligned = (text) => text.tx == leftAlignX;
const isTransition = (chunk, firstLine) => {
  // Assuming not-left-aligned single-lined blocks are always transitions
  if (chunk.length == firstLine.length) {
    return true;
  }

  const wChars = chunk.map(t => t.str).join('').replace(/\W/g, '');

  // Exception for 1425854875140 page 1
  if (/^COPANOTHERCOP/.test(wChars)) {
    return false;
  }

  // If we strip everything that isn't a "word character" and we're left with
  // all caps characters we assume it's a transition
  return /^[A-Z0-9]+$/.test(wChars);
};
const isHeader = (chunk) => {
  if (chunk.length == 1 && chunk[0].str.match(/^\d+\.?\s*$/)){
    return true;
  } else if(_.last(chunk).str.match(/^\d+\.?\s*$/) && _.last(chunk).ty <= viewport.height * 0.1) {
    return true;
  }
  return false;
};

let leftAlignX, viewport;
const getParsedText = (chunk) =>
  chunk
    .map(text => text.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s([,.!?])(\s)?/g, '$1$2');

const debug = require('debug')('parser');
const parse = async (file) => {
  const document = await PDFJS.getDocument(file);
  const pages = await getPages(document);
  const title = getTitle(pages[0]);
  const rawChunks = getChunks(pages.slice(1));
  const chunks = lettersToText(rawChunks);

  const characters = {};
  viewport = await getViewport(document);
  leftAlignX = _.minBy(
    _.flatten(
      // Filtering out chunks that contain the page number as they might start
      // on a closer position to the left margin than all other text, which
      // screws with left align detection
      chunks.filter(chunk =>
        !(chunk[0].str.match(/^\d+\.?\s*$/) || chunk[chunk.length - 1].str.match(/^\d+\.?\s*$/))
      )
    ), 'tx'
  ).tx;

  const dialogueTextXValues = [];
  let blocks = _.compact(chunks.map(chunk => {
    const firstText = chunk[0];
    const firstLine = chunk.filter(text => text.ty == firstText.ty);

    if (isHeader(chunk)) {
      // Discard page number
      debug('Dropping header chunk. %o', chunk);
      return;
    }

    // If this block starts at the left align position
    // it can only be exposition or location
    if (isLeftAligned(firstText)) {
      const intExtMatch = firstText.str.match(/^((INT|EXT)\.?(\/(INT|EXT)\.)?)\s+(.*)$/);

      if (intExtMatch) {
        return {
          type: CHUNK_TYPES.loc,
          intExt: intExtMatch[1],
          location: intExtMatch[5] + chunk.slice(1).map(text => text.str).join('')
        };
      }

      return {
        type: CHUNK_TYPES.expo,
        text: getParsedText(chunk)
      };
    }

    if (isTransition(chunk, firstLine)) {
      return {
        type: CHUNK_TYPES.expo,
        text: getParsedText(chunk),
        meta: 'transition'
      };
    }

    if (firstText.str.trim() == title) {
      debug('Dropping title chunk. %o', chunk);
      return;
    }

    if (firstText.str.match(/^[A-Z']+(\s['A-Z])?/)) {
      const chunkCharacters = parseAndStoreCharacters(firstLine, characters);
      switch (chunkCharacters.length) {
        case 1:
          return {
            type: CHUNK_TYPES.speech,
            character: chunkCharacters[0],
            text: getParsedText(chunk.slice(1))
          };
        case 2:
          // Store the unparsed chunk to handle column identification with all
          // text positions accounted for
          const text = chunk.filter(text => text.ty > firstText.ty);
          dialogueTextXValues.push(...text.map(text => text.tx));
          return {
            type: CHUNK_TYPES.dialogue,
            characters: chunkCharacters,
            text
          };
        default:
          debug(`Warning: unexpected number of characters "${chunkCharacters.length}" in chunk. %O`, chunk);
          return;
      }
    }

    debug('Warning: dropping unidentified chunk. %O', chunk);
  }));

  const [leftColX, rightColX] = _.toPairs(_.countBy(dialogueTextXValues)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(a => a[0]);
  // Do a second pass to parse dialogues
  blocks = blocks.map(block => {
    if (block.type !== CHUNK_TYPES.dialogue) {
      return block;
    }

    return {
      type: block.type,
      characters: block.characters,
      text: [
        getParsedText(block.text.filter(text => text.tx >= leftColX && text.tx < rightColX)),
        getParsedText(block.text.filter(text => text.tx >= rightColX))
      ]
    };
  });

  return { title, characters, blocks };
};

let filename = '*';
if(process.argv.length === 3) filename = process.argv[2]

ls(`./pdfs/${filename}.pdf`, file => {
  parse(file.full).then(parsed => fs.writeFileSync(`./scripts/${file.name}.json`, JSON.stringify(parsed, null, 2)));
});

// scripts.map(script => parse(`./pdfs/${script}.pdf`).then(parsed => fs.writeFileSync(`./scripts/${script}.json`, JSON.stringify(parsed, null, 2))));
