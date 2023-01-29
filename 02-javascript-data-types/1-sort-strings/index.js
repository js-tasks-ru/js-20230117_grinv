/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */

const collator = new Intl.Collator(['ru', 'en'], {
  caseFirst: 'upper',
});

export function sortStrings(arr, param = 'asc') {
  return [...arr].sort((symbol1, symbol2) => {
    const compareResult = collator.compare(symbol1, symbol2);
    return param === 'asc' ? compareResult : (compareResult * -1);
  });
}
