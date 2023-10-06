import { createData, createDOMElements } from '../utils';

/**
 * @typedef {object} DriverSettings - static and user defined settings used by the driver
 * @prop {number} maxBarHeight - maximum height of the single bar in the animation
 * @prop {number} barWidth - width of the single bar
 * @prop {number} barSpacing - space between the bars
 * @prop {number} textOffset - vertical distance between the bar label and the bar
 * @prop {number} animationSpeed - animation speed in ms
 * @prop {number} listLength - amount of items in the list to sort
 */

/**
 * @typedef {object} DriverState - internal state managed by the driver
 * @prop {HTMLDivElement} playerElement - HTML element where animation player is located
 * @prop {any} timerId - ID of currently active timeout. Timeout API is used to managed the animation
 * @prop {Array<number>} list - List that is currently being sorted
 * @prop {boolean} pause - flag to indicated if animation is paused
 * @prop {number} loopIndex - index of the running loop
 * @prop {number} remainingRepetitions - total amount of the remaining repetitions
 * @prop {Array<function>} onSortCompletedSubscribers - list of callbacks to invoke when sorting is completed
 */

function driver() {
  /** @type {DriverSettings}  */
  let settings = {
    maxBarHeight: 200,
    barWidth: 30,
    barSpacing: 5,
    textOffset: 20,
    animationSpeed: 300,
    listLength: 10,
  }
  
  /** @type {DriverState}  */
  let playerState = {
    playerElement: document.getElementById('player-wrapper'),
    timerId: null,
    onSortCompletedSubscribers: [],
  };

  // Populate player element with initial data
  playerState.playerElement.style.height = `${settings.maxBarHeight + 150}px`;
  playerState.playerElement.innerHTML = '<p>Press "Play" button to start</p>';

  /**
   * Create or return player SVG container eleemnt 
   * @returns {SVGAElement} Container element
   */
  function getPlayerSvgContainer() {
    let svgContainer = playerState.playerElement.querySelector('svg');
    if (svgContainer === null) {
      svgContainer = createDOMElements(playerState.list, settings);
      playerState.playerElement.innerHTML = '';
      playerState.playerElement.append(svgContainer);
    }
    return svgContainer;
  }
  
  /**
   * Enable horizontal scroll based on the container size.
   * @param {SVGElement} svgContainer
   */
  function adjustHorizontalScroll(svgContainer) {
    // Check content width
    const playerWrapperWidth = playerState.playerElement.clientWidth;
    const svgContainerWidth = svgContainer.clientWidth;

    // Allow horizontal scroll if player wrapper can not show all elements
    if (playerWrapperWidth > svgContainerWidth) {
      playerState.playerElement.classList.remove('scroll-x')
    } else {
      playerState.playerElement.classList.add('scroll-x')
    }
  }

  /**
   * Get elements that have to compared depending on the current index.
   * @param {SVGElement} svgContainer
   */
  function getBubbleSortElements(svgElements) {
    const { loopIndex } = playerState;

    const leftElement = svgElements.find(
      element => Number(element.getAttribute('data-index')) === loopIndex
    );
    const rightElement = svgElements.find(
      element => Number(element.getAttribute('data-index')) === loopIndex + 1
    );
    return [leftElement, rightElement];
  }

  /**
   * Swaps elements in the list if left element is bigger than the right element.
   * @param {SVGGElement} leftElement 
   * @param {SVGGElement} rightElement 
   * @returns {boolean} Did swap elements
   */
  function performSwapIfNeeded(leftElement, rightElement) {
    const { list, loopIndex } = playerState;

    if (list[loopIndex] <= list[loopIndex + 1]) {
      return false;
    }

    [list[loopIndex], list[loopIndex + 1]] = [list[loopIndex + 1], list[loopIndex]];

    leftElement.setAttribute('transform', `translate(${(loopIndex + 1) * (settings.barWidth + settings.barSpacing)} 0)`);
    rightElement.setAttribute('transform', `translate(${loopIndex * (settings.barWidth + settings.barSpacing)} 0)`);

    leftElement.setAttribute('data-index', loopIndex + 1);
    rightElement.setAttribute('data-index', loopIndex);

    return true;
  }

  // Runs sorting based on bubble sort algorithm
  function bubbleSort() {
    const { loopIndex, remainingRepetitions } = playerState;
    const svgContainer = getPlayerSvgContainer();
    adjustHorizontalScroll(svgContainer);

    /** @type {Array<SVGElement>} */
    const elementsToSort = Array.from(svgContainer.children);

    // Check if list is sorted
    if (loopIndex >= remainingRepetitions) {
      playerState.onSortCompletedSubscribers.forEach(callback => callback());
      elementsToSort.forEach(element => element.classList.add('swapped'));
      return;
    }

    const [leftElement, rightElement] = getBubbleSortElements(elementsToSort);

    // Mark elements as current
    leftElement.classList.add('current');
    rightElement.classList.add('current');

    // Player is paused, skip sorting for the moment
    if (playerState.pause) {
      return;
    }

    const didSwap = performSwapIfNeeded(leftElement, rightElement);

    // Update loop index
    playerState.timerId = setTimeout(() => {
      playerState.loopIndex++;

      if (playerState.loopIndex >= playerState.remainingRepetitions) {
        // Current repetition has finished
        if (didSwap) {
          leftElement.setAttribute('class', 'bar swapped');
          rightElement.classList.remove('current');
        } else {
          leftElement.classList.remove('current');
          rightElement.setAttribute('class', 'bar swapped');
        }

        playerState.remainingRepetitions--;
        playerState.loopIndex = 0;
      } else {
        // Current repetition still in progress
        leftElement.classList.remove('current');
        rightElement.classList.remove('current');
      }

      bubbleSort();
    }, settings.animationSpeed);
  }

  return {
    play(options = {}) {
      // Prepare the playerState if pause is not active
      if (playerState.pause) {
        playerState.pause = false;
      } else {
        settings = { ...settings, ...options };
        playerState = {
          ...playerState,
          list: createData(settings.listLength, settings.maxBarHeight),
          pause: false,
          loopIndex: 0,
          remainingRepetitions: settings.listLength - 1,
        }
      }

      bubbleSort();
    },
    stop() {
      // Clear scheduled timeout and remove SVG container from player element
      clearTimeout(playerState.timerId);
      playerState.pause = false;
      playerState.playerElement.classList.remove('scroll-x');
      playerState.playerElement.innerHTML = '<p>Press "Play" button to start</p>';
    },
    pause() {
      // Update the playerState so the player is paused
      playerState.pause = true;
    },
    onSortCompleted(callback) {
      playerState.onSortCompletedSubscribers.push(callback);
    }
  }
}

export default driver;
