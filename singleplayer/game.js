// Parse URL parameters and put them into constant variables
let params = new URL(document.location).searchParams;
const COLORS = params.has("colors") ? parseInt(params.get("colors"), 10) : 6;
const SLOTS = params.has("slots") ? parseInt(params.get("slots"), 10) : 4;
const DUPLICATES = params.get("duplicates") === "on";
const GUESSES = params.has("guesses") ? parseInt(params.get("guesses"), 10) : 10;

// Define a map between color ids and color values
const COLOR_MAP = new Map()
COLOR_MAP.set("1", "#0278ee")
COLOR_MAP.set("2", "#dd0074")
COLOR_MAP.set("3", "#ff913e")
COLOR_MAP.set("4", "#02ee78")
COLOR_MAP.set("5", "#8046f5")
COLOR_MAP.set("6", "#3ccbb7")
COLOR_MAP.set("7", "#f0ff2e")
COLOR_MAP.set("8", "#ab000d")
COLOR_MAP.set("9", "#0d1f44")
COLOR_MAP.set("0", "#836397")

// This class holds all the game related functionality
class Game {
  constructor(colors, slots, duplicates, guesses) {
    // Set all the game settings
    this.colors = colors;
    this.slots = slots;
    this.duplicates = duplicates;
    this.guesses = guesses;

    // Create the game elements
    this.createElements();

    // Set some of the game state values
    this.solution = this.getRandomSequence();
    this.finished = false;
    this.currentRow = 0;

  }

  get availableColors() {
    let items = Array.from(COLOR_MAP.keys());
    return items.slice(0, this.colors);
  }

  createElements() {
    // Create a main-container
    const container = document.createElement("div");
    container.classList.add("main-container");
    document.body.appendChild(container);

    // Create a board
    const board = document.createElement("div");
    board.classList.add("board");
    container.appendChild(board);
    this.board = board;

    // The board will hold board-rows, one for each guess, plus a solution row
    for (let i = 0; i < this.guesses + 1; i++) {
      const boardRow = document.createElement("div");
      boardRow.classList.add("board-row");
      board.appendChild(boardRow)

      // The board-rows will hold colored-peg-slots, one for each slot
      for (let j = 0; j < this.slots; j++) {
        const coloredPegSlot = document.createElement("div");
        coloredPegSlot.classList.add("colored-peg-slot");
        coloredPegSlot.addEventListener("click", this.coloredPegHandler.bind(this));
        boardRow.appendChild(coloredPegSlot);
      }

      // The board-rows will also hold one small-peg-container
      const smallPegContainer = document.createElement("div");
      smallPegContainer.classList.add("small-peg-container");
      boardRow.appendChild(smallPegContainer);
      // The small-peg-container will hold small-peg-slots, one for each slot
      for (let j = 0; j < this.slots; j++) {
        const smallPegSlot = document.createElement("div");
        smallPegSlot.classList.add("small-peg-slot");
        smallPegContainer.appendChild(smallPegSlot);
      }
    }

    // Remove the small peg slots from the solution row
    board.children[this.guesses].children[this.slots].textContent = "";

    // Create an input panel
    const inputPanel = document.createElement("div");
    inputPanel.classList.add("input-panel");
    container.appendChild(inputPanel);
    this.inputPanel = inputPanel;

    // Put colored-peg-slots in the input panel, one for each color
    for (const colorId of this.availableColors) {
      const coloredPegSlot = document.createElement("div");
      coloredPegSlot.classList.add("colored-peg-slot");
      this.setPegColor(coloredPegSlot, colorId);
      coloredPegSlot.addEventListener("click", this.inputPanelHandler.bind(this));
      inputPanel.appendChild(coloredPegSlot);
    }

    // Add a check button to the input panel
    const checkButton = document.createElement("button");
    checkButton.id = "check-button";
    checkButton.type = "button"
    checkButton.textContent = "Check";
    checkButton.addEventListener("click", this.checkButtonHandler.bind(this));
    inputPanel.appendChild(checkButton);

    // Add a keyboard listener
    document.addEventListener("keydown", this.keyboardHandler.bind(this));
  }

  setPegColor(coloredPegSlot, colorId) {
    if (this.availableColors.includes(colorId)) {
      let svgTemplate = (num) => `url("data:image/svg+xml,%3Csvg version='1.1' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50' y='50' text-anchor='middle' dominant-baseline='middle' font-size='48'%3E${num}%3C/text%3E%3C/svg%3E")`
      coloredPegSlot.dataset.colorId = colorId;
      coloredPegSlot.style.setProperty("--bg-color", COLOR_MAP.get(colorId));
      coloredPegSlot.style.setProperty("--bg-image", svgTemplate(colorId));
    }
    else {
      coloredPegSlot.removeAttribute("data-color-id");
      coloredPegSlot.style.removeProperty("--bg-color");
      coloredPegSlot.style.removeProperty("--bg-image");
    }
  }

  getRandomColorId(exclude = []) {
    const palette = this.availableColors.filter(x => !exclude.includes(x));
    let randomIndex = Math.floor(Math.random() * palette.length);
    return palette[randomIndex];
  }

  getRandomSequence() {
    let sequence = [];
    let exclude = [];
    for (let i = 0; i < this.slots; i++) {
      let randomColor = this.getRandomColorId(exclude);
      if (!this.duplicates) {
        exclude.push(randomColor);
      }
      sequence.push(randomColor);
    }
    return sequence;
  }

  get selectedSlot() {
    return this._selectedSlot;
  }

  set selectedSlot(slot) {
    const previousSlot = this.board.querySelector(".selected-slot");
    if (previousSlot !== null) {
      previousSlot.classList.remove("selected-slot");
    }
    if (slot === null) {
      return;
    }
    const rowElem = this.board.querySelector(".current-row");
    slot = ((slot % this.slots) + this.slots) % this.slots;
    rowElem.children[slot].classList.add("selected-slot");
    this._selectedSlot = slot;
  }

  get currentRow() {
    return this._currentRow;
  }

  set currentRow(row) {
    const previousRow = this.board.querySelector(".current-row");
    if (previousRow !== null) {
      previousRow.classList.remove("current-row");
    }
    if (row === null) {
      this.selectedSlot = null;
    }
    else if (row < 0 || row >= this.guesses) {
      return;
    }
    else {
      this.board.children[row].classList.add("current-row");
      this.selectedSlot = 0;
    }
      this._currentRow = row;
  }

  placePeg(colorId) {
    // Put the peg of the specified color in the current slot
    const slotElem = this.board.querySelector(".selected-slot");
    this.setPegColor(slotElem, colorId);
    // If it was not a deletion, move the slot one space
    if (this.availableColors.includes(colorId)) {
      this.selectedSlot = this.selectedSlot + 1;
    }
  }

  getCurrentGuess() {
    const sequence = [];
    const slotElems = this.board.querySelectorAll(".current-row .colored-peg-slot");
    for (const slot of slotElems) {
      sequence.push(slot.dataset.colorId);
    }
    return sequence;
  }

  checkGuess() {
    // If the current row is filled, get the sequence and check it against the solution
    const guess = this.getCurrentGuess();
    if (guess.includes(undefined)) {
      return;
    }

    // Calculate the number of small dark & light pegs needed
    let darkCount = 0;
    let lightCount = 0;
    for (const color of new Set(guess)) {
      let guessCount = guess.filter(x => x === color).length;
      let solutionCount = this.solution.filter(x => x === color).length;
      let minCount = Math.min(guessCount, solutionCount);
      lightCount += minCount;
    }
    for (let i = 0; i < this.slots; i++) {
      if (guess[i] === this.solution[i]) {
        darkCount++;
        lightCount--;
      }
    }

    // Place the small pages on the board
    const smallPegSlots = this.board.querySelectorAll(".current-row .small-peg-slot");
    let i = 0;
    let dC = darkCount;
    let lC = lightCount;
    while (dC > 0) {
      smallPegSlots[i].dataset.type = "dark";
      dC--;
      i++;
    }
    while (lC > 0) {
      smallPegSlots[i].dataset.type = "light";
      lC--;
      i++;
    }

    // If the game was won or it's the last move, show the solution and deselect everything
    if ((darkCount === this.slots) || (this.currentRow === this.guesses - 1)) {
      const solutionSlots = this.board.querySelectorAll(".board-row:last-child .colored-peg-slot");
      for (let i = 0; i < this.slots; i++) {
        this.setPegColor(solutionSlots[i], this.solution[i]);
      } 
      // Deselect the selected slot
      this.selectedSlot = null;
      // Deselect the current row
      this.currentRow = null;
      // Turn the check button into a reset button
      this.inputPanel.lastElementChild.textContent = "Reset";
      // Set the finished variable
      this.finished = true;
    }
    // If the game is still going, go to the next row
    else {
      this.currentRow = this.currentRow + 1;
    }
  }

  reset() {
    // Restart the game with a new random solution
    // Reset the colored pegs
    const coloredPegs = game.board.querySelectorAll(".colored-peg-slot[data-color-id]");
    for (const peg of coloredPegs) {
      this.setPegColor(peg, "");
    }
    // Reset the small pegs
    const smallPegs = game.board.querySelectorAll(".small-peg-slot[data-type]");
    for (const peg of smallPegs) {
      peg.removeAttribute("data-type");
    }
    // Reset the state
    this.solution = this.getRandomSequence();
    this.finished = false;
    this.currentRow = 0;
    this.inputPanel.lastElementChild.textContent = "Check";
  }
  
  inputPanelHandler(e) {
    // If the game is finished, do nothing
    if (this.finished) {
      return;
    }
    // Place a peg when a button in the panel is pushed
    const button = e.currentTarget;
    let colorId = button.dataset.colorId;
    this.placePeg(colorId);
  }

  checkButtonHandler() {
    // If the game is finished, reset
    if (this.finished) {
      this.reset();
    }
    // Check the current guess when the check button is clicked
    this.checkGuess();
  }

  coloredPegHandler(e) {
    // If the game is finished or this is not the current row, do nothing
    const parentRow = e.currentTarget.parentElement;
    if (this.finished || !parentRow.classList.contains("current-row")) {
      return;
    }
    // Clear the slot
    this.setPegColor(e.currentTarget, "");
    // Set the selected slot to the index
    const index = Array.from(parentRow.children).indexOf(e.currentTarget);
    this.selectedSlot = index;
  }

  keyboardHandler(e) {
    // If the game is finished, reset if enter is pressed
    if (this.finished) {
      if (e.key === "Enter") {
        this.reset();
      }
    }
    // Place a peg if a valid digit is pressed
    if (this.availableColors.includes(e.key)) {
      this.placePeg(e.key);
    }
    // Move the selected slot left or right with the arrow keys
    else if (e.key === "ArrowRight") {
      this.selectedSlot = this.selectedSlot + 1;
    }
    else if (e.key === "ArrowLeft") {
      this.selectedSlot = this.selectedSlot - 1;
    }
    // Clear the current slot if delete or backspace is pressed
    else if (["Backspace", "Delete"].includes(e.key)) {
      this.placePeg("");
    }
    // Check the current guess if enter is pressed
    else if (e.key === "Enter") {
      this.checkGuess();
    }
  }
}

const game = new Game(COLORS, SLOTS, DUPLICATES, GUESSES);
