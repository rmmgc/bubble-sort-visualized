/**
 * Create unsorted dummy data.
 *
 * @param {number} length Amount of data in the list
 * @param {number} maxNumber Maximum number that can be generated
 * @returns {Array<number>}
 */
function createData(length = 15, maxNumber = 200) {
  return Array.from(
    { length },
    () => Math.round(Math.random() * maxNumber),
  );
}

export default createData;
