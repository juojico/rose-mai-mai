/* ====== 遊戲設定 ====== */
const setting = {
  // 是否上一顆球投完才能再投(true|false)
  needShotOver: false,
  // 投籃隨機值(0~100)
  throwFoodRandom: 10,
  // 每顆球最大運算格數(100~800)
  maxFrames: 400,
  pot: {
    x: [16, 42],
    y: [62, 70],
  },
};

const foods = [
  { name: 'milk', text: '牛奶', weight: 10, price: 1 },
  { name: 'cream', text: '鮮奶油', weight: 10, price: 2.5 },
  { name: 'eggYellow', text: '蛋黃', weight: 10, price: 3 },
  { name: 'eggWhite', text: '蛋白', weight: 10, price: 1 },
  { name: 'sugar', text: '糖', weight: 10, price: 0.4 },
];

const defaultState = {
  currentFoodIndex: 0,
  currentFood: foods[0],
  foodInPot: 0,
  elements: {},
  throwElements: {},
  cups: 0,
};

let state = JSON.parse(JSON.stringify(defaultState));

/* ====== 工具 ====== */

const numberFormat = (number, maxDigits = 1) =>
  new Intl.NumberFormat('zh-Hans-CN', {
    maximumFractionDigits: maxDigits,
  }).format(number);

/* ====== 畫面更新 ====== */

const ui = {
  foodWeightEl: document.getElementById('foodWeight'),
  foodCupEl: document.getElementById('foodCup'),
  foodDetailsAreaEl: document.getElementById('foodDetailsArea'),
  startBakeEl: document.getElementById('startBake'),
  foodDetailsAreaText: () => {
    const list = Object.entries(state.elements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      return `${item.text} ... ${i[1] * item.weight}g`;
    });

    ui.foodDetailsAreaEl.textContent = list.join('\n');
  },
  update: () => {
    const cup = Math.floor(state.foodInPot / 10);
    ui.foodWeightEl.textContent = state.foodInPot * 10;
    ui.foodCupEl.textContent = cup;
    ui.startBakeEl.classList.toggle('on', cup > 0);
    ui.foodDetailsAreaText();
  },
};

/* ====== 箭頭 ====== */

const arrow = {
  rotateMax: 100,
  rotateMin: 30,
  deg: 30,
  rotateTo: 1,
  el: document.getElementById('arrow'),
  reset: () => {
    arrow.deg = 30;
    arrow.rotateTo = 1;
    arrow.el.style.transform = `rotate(${(arrow.deg += arrow.rotateTo)}deg)`;
  },
  animate: () => {
    const arrowAnimate = () => {
      arrow.el.style.transform = `rotate(${(arrow.deg += arrow.rotateTo)}deg)`;

      if (arrow.deg > arrow.rotateMax) {
        arrow.rotateTo = -1;
      }
      if (arrow.deg < arrow.rotateMin) {
        arrow.rotateTo = 1;
      }

      window.requestAnimationFrame(arrowAnimate);
    };

    arrowAnimate();
  },
  init: () => {
    arrow.reset();
    arrow.animate();
  },
};

/* ====== 鍋子 ====== */

const pot = {
  el: document.getElementById('pot'),
  setPot: (foodName) => {
    state.foodInPot++;
    if (state.elements[foodName]) {
      state.elements[foodName] += 1;
    } else {
      state.elements[foodName] = 1;
    }
    ui.update();
  },
};

/* ====== 選擇食材 ====== */

const selectFood = {
  el: document.getElementById('food'),
  textEl: document.getElementById('foodText'),
  changeFoodEl: document.getElementById('changeFood'),
  setFood: () => {
    selectFood.el.classList = `food onHand ${state.currentFood.name}`;
    selectFood.textEl.textContent = `${state.currentFood.text}(${state.currentFood.weight}g)`;
  },
  changeFood: (index = 1) => {
    let newIndex = state.currentFoodIndex + index;
    if (newIndex > foods.length - 1) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = foods.length - 1;
    }
    state.currentFoodIndex = newIndex;
    state.currentFood = foods[newIndex];
    selectFood.setFood();
  },
  init: () => {
    selectFood.setFood();
  },
};

/* ====== 投球 ====== */

let hasThrow = false;
let foodId = 1;

const decimal = 10000;
const random = setting.throwFoodRandom * 100;

const foodAreaEl = document.getElementById('foodArea');
const playerEl = document.getElementById('player');

const throwFood = () => {
  if (setting.needShotOver && hasThrow) return;

  const topValue = 1.9;
  const g = 0.02 * decimal;
  let wind = Math.random() - 0.5;
  const radians = ((arrow.deg + 90) * Math.PI) / 180;
  let topAdd = Math.round(
    Math.cos(radians) * topValue * decimal + Math.random() * random
  );
  let leftAdd = Math.round(
    -Math.sin(radians) * decimal + Math.random() * random
  );
  let top = 79;
  let left = 80;
  let isAlreadyIn = false;
  let frames = 0;

  hasThrow = true;

  const foodName = state.currentFood.name;
  if (state.throwElements[foodName]) {
    state.throwElements[foodName] += 1;
  } else {
    state.throwElements[foodName] = 1;
  }
  console.log('🚀 ~ throwFood ~ state.throwElements:', state.throwElements);

  const food = document.createElement('div');

  food.id = `food${++foodId}`;
  food.classList = `food ${foodName}`;
  food.setAttribute('data-food', foodName);
  food.style.top = `${top}%`;
  food.style.left = `${left}%`;

  foodAreaEl.append(food);

  const rangeX = {
    top: [setting.pot.y[1] - 3, setting.pot.y[1] - 1],
    left: [setting.pot.x[0] + 2, setting.pot.x[1]],
  };

  const foodAnimate = () => {
    frames++;

    playerEl.classList.toggle('on', hasThrow && frames < 10);
    selectFood.el.classList.toggle('hide', hasThrow && frames < 20);

    // 是否進球
    if (!isAlreadyIn) {
      if (
        top > rangeX.top[0] &&
        top < rangeX.top[1] &&
        left > rangeX.left[0] &&
        left < rangeX.left[1] &&
        topAdd > 0
      ) {
        isAlreadyIn = true;
        pot.setPot(food.getAttribute('data-food'));
        hasThrow = false;
        return;
      }
    }

    // 最大動畫範圍及時間
    if (top > 98 || left < -20 || left > 120 || frames > setting.maxFrames) {
      hasThrow = false;
      return;
    }

    // 是否碰地
    if (top > 96) {
      if (Math.abs(topAdd) < 1) {
        topAdd = 0;
      } else {
        topAdd = Math.round(-topAdd / 2);
      }
      if (Math.abs(leftAdd) < 1) {
        leftAdd = 0;
      } else {
        leftAdd = Math.round(leftAdd * 0.95 + (leftAdd > 0 ? -1 : 1));
      }
      if (Math.abs(topAdd) < 1 && Math.abs(leftAdd) < 1) {
        hasThrow = false;
        return;
      }
    } else {
      topAdd += g;
      leftAdd += wind;
    }

    top += topAdd / decimal;
    left += leftAdd / decimal;

    food.style.top = `${top}%`;
    food.style.left = `${left}%`;
    food.style.transform = `translate(-50%, -50%) rotate(${left * 10}deg)`;

    window.requestAnimationFrame(foodAnimate);
  };

  foodAnimate();
};

/* ====== 烤布丁 ====== */

const bake = {
  data: {},
  resultPuddingEl: document.getElementById('resultPudding'),
  resultDetailsEl: document.getElementById('resultDetails'),
  calc: () => {
    let total = 0;

    const list = Object.entries(state.elements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      total += i[1] * item.price;
      return `${item.text} ... ${i[1] * item.weight}g`;
    });

    let throwTotal = 0;

    const throwList = Object.entries(state.throwElements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      throwTotal += i[1] * item.price;
      return `${item.text} ... ${i[1] * item.weight}g`;
    });

    const resultDetails = `你的配方:\n${list.join('\n')}\n成本:${numberFormat(
      total
    )}元\n損耗成本:${numberFormat(throwTotal)}元`;

    console.log(resultDetails);

    bake.resultDetailsEl.textContent = resultDetails;
  },
  start: () => {
    const total = state.foodInPot;
    const cup = Math.floor(state.foodInPot / 10);
    const y = state.elements?.eggYellow || 0;
    const w = state.elements?.eggWhite || 0;
    const m = state.elements?.milk || 0;
    const c = state.elements?.cream || 0;
    const s = state.elements?.sugar || 0;
    bake.calc();

    console.log(
      '🚀 ~ startBake ~ startBake:',
      `食材總數：`,
      state.foodInPot,
      `加入食材：`,
      state.elements,
      // `已丟出食材：`,
      // state.throwElements
      'm ' + (m / total).toFixed(3),
      'w ' + (w / total).toFixed(3),
      'y ' + (y / total).toFixed(3),
      'c ' + (c / total).toFixed(3),
      's ' + (s / total).toFixed(3)
    );

    let isFail = false;

    let result = '你烤出了一個意想不到的布丁!';

    switch (true) {
      /* ====== 沒烤出布丁 ====== */
      // 只有糖
      case s >= total:
        result = `獲得 ${cup} 杯熱熱的糖! (你只加了糖)`;
        isFail = true;
        break;
      // 糖過多
      case s / total > 0.4:
        result = `獲得 ${cup} 杯糖漿! (糖比例過高)`;
        isFail = true;
        break;
      // 只有蛋黃和蛋白
      case y + w + s >= total:
        result = `獲得 ${cup} 塊硬硬的蒸蛋! (你只加了蛋)`;
        isFail = true;
        break;
      // 沒有加蛋
      case m + c + s >= total:
        result = `獲得 ${cup} 杯熱牛奶! (你沒有加蛋)`;
        isFail = true;
        break;
      // 蛋黃蛋白<1/8
      case (y + w) / total < 0.125:
        result = '布丁沒有成型! (蛋黃+蛋白需至少佔1/8)';
        isFail = true;
        break;
      // 蛋黃蛋白>1/2
      case (y + w) / total > 0.4:
        result = `獲得 ${cup} 杯蒸蛋! (蛋比例過高)`;
        isFail = true;
        break;

      /* ====== 基本布丁類別 ====== */
      // 奶酪
      case y <= 0:
        result = `獲得 ${cup} 杯奶酪`;
        break;
      // 中式硬布丁
      case c / total < 0.1 && w / (y + w) >= 0.5 && (y + w) / total > 0.25:
        result = `烤出了 ${cup} 杯中式硬布丁`;
        break;
      // 昭和硬布丁
      case c / total < 0.2 &&
        y / (y + w) > 0.5 &&
        (y + w) / total > 0.25 &&
        s / total > 0.04:
        result = `烤出了 ${cup} 杯昭和硬布丁`;
        break;
      // 布蕾
      case c / total > 0.35 &&
        y / (y + w) >= 0.9 &&
        (y + w) / total < 0.2 &&
        s / total > 0.04:
        result = `烤出了 ${cup} 杯布蕾`;
        break;
      // 螺絲麥麥的軟布丁
      case c / total > 0.3 &&
        m / total > 0.45 &&
        s / total > 0.04 &&
        s / total < 0.06 &&
        (y + w) / total < 0.2 &&
        y / (y + w) > 0.5:
        result = `恭喜你!!烤出了 ${cup} 杯螺絲麥麥的軟布丁!`;
        break;
      // 硬布丁
      case c / total < 0.2 || (y + w) / total > 0.25:
        result = `烤出了 ${cup} 杯硬布丁`;
        break;
      // 軟布丁
      case c / total >= 0.2 || (y + w) / total <= 0.25:
        result = `烤出了 ${cup} 杯軟布丁`;
        break;

      /* ====== 口感 ====== */
      /* ====== 味道 ====== */

      default:
        break;
    }

    console.log('🚀 ~ startBake ~ result:', result);

    bake.resultPuddingEl.textContent = result;
    dialog.open();
  },
};

/* ====== 結果彈窗 ====== */

const dialog = {
  el: document.getElementById('dialog'),
  continueEl: document.getElementById('continue'),
  restartEl: document.getElementById('restart'),
  close: () => {
    dialog.el.classList.remove('on');
  },
  open: () => {
    dialog.el.classList.add('on');
  },
  init: () => {
    dialog.continueEl.addEventListener('click', () => {
      dialog.close();
    });
    dialog.restartEl.addEventListener('click', () => {
      console.log('🚀 ~ dialog.restartEl.addEventListener ~ restartEl:');
      gameRestart();
      dialog.close();
    });
  },
};

/* ====== 遊戲流程 ====== */

const gameStart = () => {
  arrow.init();
  selectFood.init();
  dialog.init();
};

const gameRestart = () => {
  state = JSON.parse(JSON.stringify(defaultState));

  while (foodAreaEl.firstChild) {
    foodAreaEl.removeChild(foodAreaEl.firstChild);
  }

  ui.update();
  selectFood.init();
};

window.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.keyCode == 32) {
    throwFood();
  }
  // 左
  if (e.keyCode == 65 || e.keyCode == 37) {
    selectFood.changeFood();
  }
  // 右
  if (e.keyCode == 68 || e.keyCode == 39) {
    selectFood.changeFood(-1);
  }
});

playerEl.addEventListener('click', () => {
  throwFood();
});

selectFood.changeFoodEl.addEventListener('click', () => {
  selectFood.changeFood();
});

ui.startBakeEl.addEventListener('click', () => {
  bake.start();
});

gameStart();
