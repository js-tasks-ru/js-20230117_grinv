/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  return function(obj) {
    const checkNextLevel = (path, data) => {
      if (path.length <= 1) {
        return data?.[path[0]] || undefined;
      }

      const [nextPath, ...otherPath] = path;
      return checkNextLevel(otherPath, data[nextPath]);
    };

    return checkNextLevel(path.split('.'), obj);
  };
}
