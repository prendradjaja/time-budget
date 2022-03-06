{
  const $ = (s: string) => document.querySelector(s);
  const $$ = (s: string) => document.querySelectorAll(s);

  const selectors = {
    MOVE_LIST: "rm6",
    MOVE: "rm6 u8t",
    ORIENTATION_WHITE: ".main-board .orientation-white",
    ORIENTATION_BLACK: ".main-board .orientation-black",
  };

  const INVERTED = "inverted";

  const stylesheet = `
.heart-container {
  font-family: monospace;
  width: max-content;
  padding: 10px;
  font-size: 20px;
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 999999;
}

.heart-container:not(.inverted) {
  background: black;
}

.heart-container.inverted {
  background: red;
}

.heart-container:not(.inverted) .heart {
  color: red;
}

.heart-container:not(.inverted) .no-heart {
  color: white;
}

.heart-container.inverted .heart {
  color: white;
}

.heart-container.inverted .no-heart {
  color: black;
}
  `;

  const plan = [
    // Time is in seconds
    { move: 5, time: 14 * 60 },
    { move: 10, time: 13 * 60 },
    { move: 15, time: 12 * 60 },
    { move: 20, time: 11 * 60 },
    { move: 25, time: 10 * 60 },
    { move: 30, time: 9 * 60 },
    { move: 35, time: 8 * 60 },
    { move: Infinity, time: 0 },
  ];

  // const plan = [
  //   // Time is in seconds
  //   { move: 5, time: 5 * 60 },
  //   { move: 10, time: 4.5 * 60 },
  //   { move: 15, time: 4 * 60 },
  //   { move: 20, time: 3.5 * 60 },
  //   { move: 25, time: 3 * 60 },
  //   { move: 30, time: 2.5 * 60 },
  //   { move: 35, time: 2 * 60 },
  //   { move: Infinity, time: 0 },
  // ];

  const heartDuration = 60; // Seconds
  const maxHearts = 3;

  type PlanSegment = typeof plan[0];

  type Color = "white" | "black";

  interface Globals {
    moves: string[];
    color: Color;
    heartsEl: HTMLElement;
  }

  let globals: Globals = undefined as any;

  function main(): void {
    if (!globalThis?.process?.env?.TEST) {
      browserMain();
    } else {
      testsMain();
    }
  }

  function browserMain(): void {
    const moveListEl = $(selectors.MOVE_LIST);
    if (!moveListEl) {
      throw new Error("No move list");
    }

    const styleEl = document.createElement("style");
    styleEl.textContent = stylesheet;
    document.head.appendChild(styleEl);

    const heartsEl = document.createElement("div");
    heartsEl.classList.add("heart-container");
    document.body.appendChild(heartsEl);

    globals = {
      moves: [],
      color: getColor(),
      heartsEl,
    };

    setHearts(3);

    const observer = new MutationObserver(onMoveListMutation);
    observer.observe(moveListEl, { childList: true, subtree: true });
    // observer.disconnect();
  }

  function testsMain(): void {
    console.log("Running tests...");

    console.log(getPlanSegment(0).move === 5);
    console.log(getPlanSegment(2).move === 5);
    console.log(getPlanSegment(5).move === 5);

    console.log(getPlanSegment(12).move === 15);
    console.log(getPlanSegment(15).move === 15);

    console.log(getPlanSegment(32).move === 35);
    console.log(getPlanSegment(35).move === 35);

    console.log(getPlanSegment(36).move === Infinity);

    console.log(getHearts(1, 14.5 * 60).hearts === 3);

    // Three hearts
    console.log(getHearts(5, 14.5 * 60).hearts === 3);
    console.log(getHearts(5, 14.5 * 60).detail === "+0.5");

    console.log(getHearts(5, 14 * 60).hearts === 3);
    console.log(getHearts(5, 14 * 60).detail === "=0.0");

    console.log(getHearts(5, 13.2 * 60).hearts === 3); // Draining the first heart
    console.log(getHearts(5, 13.2 * 60).detail === "-0.8");

    // Two hearts
    console.log(getHearts(5, 13 * 60).hearts === 2);
    console.log(getHearts(5, 13 * 60).detail === "-1.0");

    console.log(getHearts(5, 12.8 * 60).hearts === 2); // Draining the next heart
    console.log(getHearts(5, 12.8 * 60).detail === "-1.2");

    // One heart
    console.log(getHearts(5, 12 * 60).hearts === 1);
    console.log(getHearts(5, 12 * 60).detail === "-2.0");

    console.log(getHearts(5, 11.5 * 60).hearts === 1); // Draining the third (final) heartt
    console.log(getHearts(5, 11.5 * 60).detail === "-2.5"); // Draining the third (final) heartt

    // Zero hearts
    console.log(getHearts(5, 11 * 60).hearts === 0);
    console.log(getHearts(5, 11 * 60).detail === "-3.0");

    console.log(getHearts(5, 9 * 60).hearts === 0); // Hearts don't go below 0
    console.log(getHearts(5, 9 * 60).detail === "-5.0");
  }

  function onMoveListMutation(): void {
    const moves = getMoves();
    if (moves === globals.moves) {
      return;
    }
    globals.moves = moves;

    const lastMoveColor: Color =
      globals.moves.length % 2 === 0 ? "black" : "white";
    if (globals.color !== lastMoveColor) {
      return;
    }

    console.log(`[${getClock()}]`, moves);
  }

  // Assumes the player is playing with normal orientation
  function getColor(): Color {
    if ($(selectors.ORIENTATION_WHITE)) {
      return "white";
    } else if ($(selectors.ORIENTATION_BLACK)) {
      return "black";
    } else {
      throw new Error("Color not found");
    }
  }

  function getMoves(): string[] {
    return Array.from($$(selectors.MOVE)).map(
      (el) => (el as HTMLElement).innerText
    );
  }

  function getClock(): string {
    const timeEl = $(".rclock-bottom .time") as HTMLElement | undefined;
    if (timeEl) {
      return timeEl.innerText.replaceAll("\n", "");
    } else {
      throw new Error("No clock");
    }
  }

  function getMoveNumber(): number {
    return Math.floor((globals.moves.length + 1) / 2);
  }

  /**
   * Time is in seconds
   */
  function getHearts(
    moveNumber: number,
    time: number
  ): { hearts: number; detail: string } {
    const planSegment = getPlanSegment(moveNumber);
    const deficit = planSegment.time - time;
    const heartsDeficit = deficit / heartDuration;
    const heartsLost = Math.floor(heartsDeficit);
    return {
      hearts: clamp(0, maxHearts, maxHearts - heartsLost),
      detail: formatDetail(-heartsDeficit),
    };
  }

  function formatDetail(n: number): string {
    const s = n.toFixed(1);
    if (s === "0.0" || s === "-0.0") {
      return "=0.0";
    } else if (!s.startsWith("-")) {
      return "+" + s;
    } else {
      return s;
    }
  }

  function clamp(lo: number, hi: number, n: number) {
    if (n > hi) {
      return hi;
    } else if (n < lo) {
      return lo;
    } else {
      return n;
    }
  }

  function getPlanSegment(moveNumber: number): PlanSegment {
    return plan.filter((segment) => segment.move >= moveNumber)[0];
  }

  function setHearts(n: number) {
    const hearts = new Array(n).fill('<span class="heart">♥</span>');
    const nulls = new Array(maxHearts - n).fill(
      '<span class="no-heart">♥</span>'
    );
    globals.heartsEl.innerHTML = [...hearts, ...nulls].join(" ");
  }

  function blinkHearts() {
    const reps = 5;
    const frameDuration = 200;
    for (let i = 0; i <= reps; i++) {
      setTimeout(() => {
        if (i % 2 !== 0 || i === reps) {
          globals.heartsEl.classList.remove(INVERTED);
        } else {
          globals.heartsEl.classList.add(INVERTED);
        }
      }, i * frameDuration);
    }
  }

  main();
}
