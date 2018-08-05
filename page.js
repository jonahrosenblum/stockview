function binarySearch(keyword, list) {
    let start = 0;
    let end = list.length - 1;
    while (start <= end) {
        const middle = Math.floor((start + end) / 2);
        if (keyword > list[middle]) {
            start = middle + 1;
        }
        else if (keyword < list[middle]) {
            end = middle - 1;
        }
        else {
            return middle;
        }
    }
    return -1;
}

function getBadKeywords() {
    return Promise.resolve($.ajax({
        url: 'https://api.myjson.com/bins/d1bru'
    }));
}

function keywordGood(keyword, badKeywords) {
    keyword = keyword.toLowerCase().replace(/(?![a-z])./g, '')
    if (binarySearch(keyword, badKeywords) > -1) {
        return false;
    }
    return true;
}

function getStockJSON(query) {
    query = query.toString().replace('\'s','').replace(/(?![a-zA-Z&-])./g, '');
    const link = 'https://autoc.finance.yahoo.com/autoc?query=' + query
                  + '&region=1&lang=en';
    return Promise.resolve($.ajax({
        url: link
    }));
}

function findKeywords(text, badKeywords) {
    const text_split = text.split(' ');
    let keywords = [];
    for (let i = 0; i < text_split.length; ++i) {
        const keyword = text_split[i];
        if (keyword) {
            const firstLetter = keyword.replace('$', '')[0].replace(/(?![A-Z])./g, '').replace(/\r?\n|\r/g, '');
            if (firstLetter && keywordGood(keyword, badKeywords)) {
                keywords.push(keyword);
            }
        }
    }
    return keywords;
}

function addLinkNode(stockData, node) {
    const link = 'https://finance.yahoo.com/quote/' + stockData[1];
    let newLink = document.createElement('a');
    let linkText = document.createTextNode(stockData[0] + ' ');
    newLink.appendChild(linkText);
    newLink.title = 'stockview';
    newLink.target = '_blank';
    newLink.href = link;
    style_list = ['fontFamily', 'color', 'fontWeight', 'borderBottomStyle',
                  'textDecoration', 'fontWeight'];
    for (let style = 0; style < style_list.length; ++style) {
        newLink.style[style_list[style]] = 'inherit';
    }
    if (true) {
        node.parentNode.insertBefore(newLink, node);
    }
}

function breakUpTextNode(text, keyword, node) {
    let splitText = text.split(keyword);
    // https://stackoverflow.com/questions/4514144/
    for (let i = splitText.length; i-->1;) {
        splitText.splice(i, 0, keyword);
    }
    if (splitText[0].length && node) {
        let newText = document.createTextNode(splitText[0]);
        if (true) {
            node.parentNode.insertBefore(newText, node)
        }
    }
    splitText = splitText.splice(2, splitText.length);
    return splitText.join('');
}

async function replaceWordsWithLinks(elements) {
    let badKeywords = await getBadKeywords();
    badKeywords = badKeywords['list'];
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        for (let j = 0; j < element.childNodes.length; j++) {
            let node = element.childNodes[j];
            if (node.nodeType === 3) {
                let text = node.nodeValue;
                let potentialKeywords = findKeywords(text, badKeywords);
                for (let k = 0; k < potentialKeywords.length; ++k) {
                    let potentialKeyword = potentialKeywords[k];
                    let jsonData = await getStockJSON(potentialKeyword)
                    jsonData = jsonData['ResultSet']['Result'][0];
                    if (jsonData && node.parentNode) {
                        let stockData = await [potentialKeyword,
                            jsonData['symbol'].replace('-USD.SW',''),
                            jsonData['exchDisp']];
                        text = breakUpTextNode(text, stockData[0], node);
                        addLinkNode(stockData, node);
                        node.parentNode.replaceChild(document.createTextNode(text), node);
                    }
                }
            }
        }
    }
}

let elements = document.querySelectorAll('P, B, I');
replaceWordsWithLinks(elements);
