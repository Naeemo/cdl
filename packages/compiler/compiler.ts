import {readFileSync} from "node:fs"

export type Data = string[][]

export interface Series {
    type: 'line'
}

export interface Chart {
    data: string
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

function tokensToCDLFile(tokens: string[]): CDLFile {
    const file: CDLFile = {data: {}, chart: {}}

    let dataStatus = 0
    let dataBody: string[][] = []
    let chartStatus = 0
    let chartBody: Chart = {data: '', series: []}
    for (let token of tokens) {
        // read data title
        if (dataStatus === 1) {
            file.data[token] = dataBody = []
            dataStatus = 2
            continue
        }

        // read data body
        if (dataStatus === 2) {
            // data body starts
            if (token === '{') {
                continue
            }
            // data body ends
            if (token === '}') {
                dataStatus = 0
                dataBody = []
                continue
            }
            dataBody.push(token.split(','))
            continue
        }

        // read chart title
        if (chartStatus === 1) {
            file.chart[token] = chartBody = {data: '', series: []}
            chartStatus = 2
            continue
        }

        // read chart body, data part
        if (chartStatus === 2) {
            // chart body data part starts
            if (token === '{') {
                continue
            }
            // chart body data part ends
            if (token === '-') {
                chartStatus = 3
                continue
            }
            chartBody.data = token
            continue
        }

        // read chart body, series part
        if (chartStatus === 3) {
            // chart body ends
            if (token === '}') {
                chartStatus = 0
                chartBody = {data: '', series: []}
                continue
            }
            if (token !== 'line') {
                console.warn('unrecognized chart series type', token);
                continue
            }
            chartBody.series.push({type: token})
            continue
        }

        switch (token) {
            case 'Data': {
                dataStatus = 1
                break
            }
            case 'Chart': {
                chartStatus = 1
                break
            }
        }
    }

    console.info(`================ ⬇️ cdl file ⬇️ ================`)
    console.info(JSON.stringify(file, null, '  '))
    console.info(`================ ⬆️ cdl file ⬆️ ================`)
    return file
}

export function compile(source: string): CDLFile {
    const trimmed = stripeComments(source)
    const tokens = parseForTokens(trimmed)
    const cdlFile = tokensToCDLFile(tokens)

    return cdlFile
}

(function cli() {
    const filePath = process.argv[2]
    const source = readFileSync(filePath, {encoding: "utf-8"})
    compile(source)
})()
