/* ====== 遊戲設定 ====== */
const setting = {
  time: 600,
  // 是否上一顆球投完才能再投(true|false)
  needShotOver: false,
  // 投籃隨機值(0~100)
  throwFoodRandom: 30,
  // 每顆球最大運算格數(100~800)
  maxFrames: 400,
};

const timeFormat = (time) => {
  const minutes = String(Math.floor(time / 60)).padStart(2, 0);
  const seconds = String(time % 60).padStart(2, 0);

  return `${minutes}:${seconds}`;
};

/* ==================== */

let timeLeft = setting.time;

const timeEl = document.getElementById('time');

const render = () => {
  timeLeft--;
  timeEl.textContent = timeFormat(timeLeft);
  if (timeLeft < 1) {
    gameEmd();
  }
};

/* ====== 箭頭 ====== */

const rotateMax = 100;
const rotateMin = 30;
let deg = 30;
let rotateTo = 1;

const arrowEl = document.getElementById('arrow');

const arrowAni = () => {
  const arrowAnimate = () => {
    arrowEl.style.transform = `rotate(${(deg += rotateTo)}deg)`;

    if (deg > rotateMax) {
      rotateTo = -1;
    }
    if (deg < rotateMin) {
      rotateTo = 1;
    }
    if (timeLeft < 1) {
      return;
    }

    window.requestAnimationFrame(arrowAnimate);
  };

  arrowAnimate();
};

/* ====== 鍋子 ====== */

const potEl = document.getElementById('pot');
const foodWeightEl = document.getElementById('foodWeight');
const foodCupEl = document.getElementById('foodCup');
const startBakeEl = document.getElementById('startBake');

const pot = {
  width: 20,
  height: 8,
  left: 30,
  top: 80,
};

let foodInPot = 0;
let elements = {};

const setPot = (foodName) => {
  foodInPot++;
  if (elements[foodName]) {
    elements[foodName] += 1;
  } else {
    elements[foodName] = 1;
  }
  const cup = Math.floor(foodInPot / 10);
  foodWeightEl.textContent = foodInPot * 10;
  foodCupEl.textContent = cup;
  console.log('🚀 ~ setPot ~ setPot:', foodInPot, foodName, elements);
  if (cup > 0) {
    startBakeEl.classList.add('on');
  }
};

/* ====== 選擇食材 ====== */

const foods = ['milk', 'cream', 'eggYellow', 'eggWhite', 'sugar'];
const foodsText = ['牛奶', '鮮奶油', '蛋黃', '蛋白', '糖'];
let currentFoodIndex = 0;

const foodEl = document.getElementById('food');
const foodTextEl = document.getElementById('foodText');

const setFood = () => {
  foodEl.classList = `food ${foods[currentFoodIndex]}`;
  foodTextEl.textContent = `${foodsText[currentFoodIndex]}(10g)`;
};

setFood();

const selectFood = (index = 1) => {
  let newIndex = currentFoodIndex + index;
  if (newIndex > foods.length - 1) {
    newIndex = 0;
  }
  if (newIndex < 0) {
    newIndex = foods.length - 1;
  }
  currentFoodIndex = newIndex;
  setFood();
};

/* ====== 投球 ====== */

let hasThrow = false;
let foodId = 1;
let throwElements = {};

const decimal = 10000;
const random = setting.throwFoodRandom * 100;

const gameAreaEl = document.getElementById('gameArea');
const playerEl = document.getElementById('player');

const throwFood = () => {
  if (setting.needShotOver && hasThrow) return;

  const topValue = 1.9;
  const g = 0.02 * decimal;
  let wind = Math.random() - 0.5;
  const radians = ((deg + 90) * Math.PI) / 180;
  let topAdd = Math.round(
    Math.cos(radians) * topValue * decimal + Math.random() * random
  );
  let leftAdd = Math.round(
    -Math.sin(radians) * decimal + Math.random() * random
  );
  let top = 90;
  let left = 85;
  let isAlreadyIn = false;
  let frames = 0;

  hasThrow = true;

  const currentFood = foods[currentFoodIndex];
  if (throwElements[currentFood]) {
    throwElements[currentFood] += 1;
  } else {
    throwElements[currentFood] = 1;
  }
  console.log('🚀 ~ throwFood ~ throwElements:', throwElements);

  const food = document.createElement('div');

  food.id = `food${++foodId}`;
  food.classList = `food ${currentFood}`;
  food.setAttribute('data-food', currentFood);
  food.style.top = `${top}%`;
  food.style.left = `${left}%`;

  gameAreaEl.append(food);

  const rangeX = {
    top: [pot.top + pot.height - 3, pot.top + pot.height - 1],
    left: [pot.left + 2, pot.left + pot.width],
  };

  const foodAnimate = () => {
    frames++;

    playerEl.classList.toggle('on', hasThrow && frames < 10);
    foodEl.classList.toggle('hide', hasThrow && frames < 20);

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
        setPot(food.getAttribute('data-food'));
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

const startBake = () => {
  const total = foodInPot;
  const cup = Math.floor(foodInPot / 10);
  const y = elements?.eggYellow || 0;
  const w = elements?.eggWhite || 0;
  const m = elements?.milk || 0;
  const c = elements?.cream || 0;
  const s = elements?.sugar || 0;

  console.log(
    '🚀 ~ startBake ~ startBake:',
    `食材總數：`,
    foodInPot,
    `加入食材：`,
    elements,
    // `已丟出食材：`,
    // throwElements
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
    case c / total < 0.2 && (y + w) / total > 0.25:
      result = `烤出了 ${cup} 杯硬布丁`;
      break;
    // 軟布丁
    case c / total > 0.3 || (y + w) / total < 0.25:
      result = `烤出了 ${cup} 杯軟布丁`;
      break;

    /* ====== 口感 ====== */
    /* ====== 味道 ====== */

    default:
      break;
  }

  console.log('🚀 ~ startBake ~ result:', result);
};

/* ====== 遊戲流程 ====== */

let timeInterval;

const gameStart = () => {
  timeInterval = setInterval(render, 1000);
  arrowAni();
};

const gameEmd = () => {
  clearInterval(timeInterval);
  console.log('🚀 ~ gameEmd ');
  alert(`遊戲結束\n獲得食材${foodInPot}`);
};

window.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.keyCode == 32) {
    throwFood();
  }
  // 左
  if (e.keyCode == 65 || e.keyCode == 37) {
    selectFood();
  }
  // 右
  if (e.keyCode == 68 || e.keyCode == 39) {
    selectFood(-1);
  }
});

playerEl.addEventListener('click', () => {
  throwFood();
});

startBakeEl.addEventListener('click', () => {
  startBake();
});

gameStart();
