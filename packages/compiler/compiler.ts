import {readFileSync} from "node:fs"

export type Data = string[][]

export interface Series {
    type: 'line'
}

export interface Chart {
    data: Data
    series: Series[]
}

export interface CDLFile {
    data: {
        [name: string]: Data
    }
    chart: {
        [name: string]: Chart
    }
}

export function stripeComments(source: string): string[] {
    let content: string[] = []
    let singleLineCommentCount = 0
    let multipleLineCommentCount = 0
    let isMultipleLineCommentEnding = false

    for (let char of source) {
        // single line comment
        if (singleLineCommentCount === 2) {
            // single line comment ends
            if (char === '\n') {
                singleLineCommentCount = 0
            }
            continue
        }

        // multiple line comment
        if (multipleLineCommentCount === 2) {
            // multiple line comment ends
            if (isMultipleLineCommentEnding && char === '/') {
                multipleLineCommentCount = 0
                isMultipleLineCommentEnding = false
            }
            isMultipleLineCommentEnding = char === '*';
            continue
        }

        switch (char) {
            case '/': {
                if (singleLineCommentCount === 1) {
                    // single line comment starts
                    singleLineCommentCount = 2
                    // multiple line comment start fail cuz single line comment starts
                    multipleLineCommentCount = 0
                } else {
                    // single line comment first slash
                    singleLineCommentCount = 1
                    // multiple line comment first slash
                    multipleLineCommentCount = 1
                }
                break
            }

            case "*": {
                if (multipleLineCommentCount === 1) {
                    // multiple line comment starts
                    multipleLineCommentCount = 2
                    // single line comment start fail cuz multiple line comment starts
                    singleLineCommentCount = 0
                } else {
                    content.push(char)
                }
                break
            }

            default:
                if (singleLineCommentCount === 1 || multipleLineCommentCount === 1) {
                    // single line comment start fail cuz only one slash
                    singleLineCommentCount = 0
                    // multiple line comment start fail cuz only one slash
                    multipleLineCommentCount = 0
                    // push the slash back
                    content.push('/')
                }

                content.push(char)
                break;
        }
    }

    console.info(`================ ⬇️ striped comments ⬇️ ================`)
    console.info(content.join(''))
    console.info(`================ ⬆️ striped comments ⬆️ ================`)
    return content
}

function parseForTokens(chars: string[]): string[] {
    const tokens: string[] = []
    let token = ''
    let isReadingKeywordTitle = false
    let keywordTitleEndingSpaces: string[] = []
    for (let char of chars) {
        switch (char) {
            case ' ':
            case '\n': {
                if (!token) {
                    continue
                }
                if (isReadingKeywordTitle) {
                    keywordTitleEndingSpaces.push(char)
                    continue
                }
                if (token === 'Data' || token === 'Chart') {
                    isReadingKeywordTitle = true
                }
                tokens.push(token);
                token = ''
                break;
            }
            case '{': {
                if (isReadingKeywordTitle) {
                    isReadingKeywordTitle = false
                    keywordTitleEndingSpaces.length = 0
                    tokens.push(token);
                    token = char
                    continue
                }
                token += char
                break
            }
            default:
                if (isReadingKeywordTitle) {
                    token += keywordTitleEndingSpaces.join('')
                    keywordTitleEndingSpaces.length = 0
                }
                token += char
                break
        }
    }
    console.info(`================ ⬇️ tokens ⬇️ ================`)
    console.info(tokens)
    console.info(`================ ⬆️ tokens ⬆️ ================`)
    return tokens
}

export function compile(source: string): CDLFile {
    const trimmed = stripeComments(source)
    const tokens = parseForTokens(trimmed)

    return {
        data: {},
        chart: {}
    }
}

(function cli() {
    const filePath = process.argv[2]
    const source = readFileSync(filePath, {encoding: "utf-8"})
    compile(source)
})()
