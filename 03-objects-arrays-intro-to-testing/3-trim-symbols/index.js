/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (!string || size === 0) {
    return '';
  }

  if (!size) {
    return string;
  }

  const isLastElement = (index) => Number(index) === string.length - 1;
  const saveResult = () => symbolsAmount.push({symbol: markedSymbol, amount: count});
  const resetMarker = (currentSymbol) => {
    count = 1;
    markedSymbol = currentSymbol;
  };

  const symbolsAmount = [];
  let count = 0;
  let markedSymbol = string[0];

  Object.entries(string).forEach(([index, currentSymbol]) => {
    if (currentSymbol !== markedSymbol) {
      saveResult();
      resetMarker(currentSymbol);

      if (isLastElement(index)) {
        saveResult();
      }

      return;
    }

    count++;

    if (isLastElement(index)) {
      saveResult();
    }
  });

  return Object.values(symbolsAmount).reduce((accumulator, {symbol, amount}) => {
    return accumulator + symbol.repeat(Math.min(size, amount));
  }, '');
}
