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
    return -1
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

function addLinkNode(stockData, node, wordArr) {
    wordArr.arr.push(stockData[0]);
    let newLink = document.createElement('a');
    let linkText = document.createTextNode(stockData[0] + ' ');
    newLink.appendChild(linkText);
    newLink.title = 'StockView Link';
    newLink.style.color = 'inherit';
    newLink.target = '_blank';
    newLink.style.borderBottomStyle = 'none';
    newLink.style.textDecoration = 'none';
    newLink.href = 'https://finance.yahoo.com/quote/' + stockData[1] + '?p='
                    + stockData[1];
    node.parentNode.insertBefore(newLink, node);
}

function breakUpTextNode(text, keyword, node) {
    let splitText = text.split(keyword);
    // https://stackoverflow.com/questions/4514144/
    for (let i = splitText.length; i-->1;) {
        splitText.splice(i, 0, keyword);
    }
    if (splitText[0].length) {
        let newText = document.createTextNode(splitText[0]);
        node.parentNode.insertBefore(newText, node)
    }
    splitText.shift();
    splitText.shift();
    return splitText.join('');

}

async function replaceWordsWithLinks(elements, wordArr) {
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
                    try {
                        let jsonData = await getStockJSON(potentialKeyword)
                        jsonData = jsonData['ResultSet']['Result'][0];
                        if (jsonData) {
                            let stockData = await [potentialKeyword, jsonData['symbol'].replace('-USD.SW',''), jsonData['exchDisp']];
                            text = breakUpTextNode(text, stockData[0], node);
                            addLinkNode(stockData, node, wordArr);
                            node.parentNode.replaceChild(document.createTextNode(text), node);
                        }
                    } catch (error) {
                        if (error != 'TypeError: Cannot read property \'insertBefore\' of null')
                        console.log('Error with ' + potentialKeyword + '-'
                                    + error);
                    }
                }
            }
        }
    }
}

let elements = document.querySelectorAll('P,B');
let wordArr = {arr:[]};
replaceWordsWithLinks(elements, wordArr);
console.log(wordArr);
