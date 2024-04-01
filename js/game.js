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
  // 箭頭速度(1~20)
  arrowSpeed: 5,
  // 食材動畫速度(1~3)
  foodSpeed: 2,
};

const foods = [
  { name: 'milk', text: '牛奶', weight: 10, price: 1 },
  { name: 'cream', text: '鮮奶油', weight: 10, price: 2.5 },
  { name: 'eggYellow', text: '蛋黃', weight: 5, price: 2 },
  { name: 'eggWhite', text: '蛋白', weight: 5, price: 0.5 },
  { name: 'sugar', text: '糖', weight: 5, price: 0.2 },
];

const adding = [{ name: 'vanilla', text: '香草醬', weight: 1.25, price: 5 }];

const defaultState = {
  currentFoodIndex: 0,
  currentFood: foods[0],
  foodInPot: 0,
  elements: {},
  throwElements: {},
  totalWeight: 0,
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
  update: () => {
    let newTotalWeight = 0;
    const list = Object.entries(state.elements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      newTotalWeight += i[1] * item.weight;
      return `${item.text} ... ${i[1] * item.weight}g`;
    });
    state.totalWeight = newTotalWeight;

    ui.foodDetailsAreaEl.textContent = list.join('\n');

    ui.foodWeightEl.textContent = newTotalWeight;

    state.cups = Math.floor(newTotalWeight / 100);
    ui.foodCupEl.textContent = state.cups;
    ui.startBakeEl.classList.toggle('on', state.cups > 0);
  },
};

/* ====== 箭頭 ====== */

const arrow = {
  rotateMax: 90,
  rotateMin: 40,
  deg: 40,
  rotateTo: setting.arrowSpeed,
  el: document.getElementById('arrow'),
  reset: () => {
    arrow.deg = 30;
    arrow.rotateTo = setting.arrowSpeed;
    arrow.el.style.transform = `rotate(${(arrow.deg += arrow.rotateTo)}deg)`;
  },
  animate: () => {
    const arrowAnimate = () => {
      arrow.el.style.transform = `rotate(${(arrow.deg += arrow.rotateTo)}deg)`;

      if (arrow.deg > arrow.rotateMax) {
        arrow.rotateTo = -setting.arrowSpeed;
      }
      if (arrow.deg < arrow.rotateMin) {
        arrow.rotateTo = setting.arrowSpeed;
      }

      setTimeout(() => {
        window.requestAnimationFrame(arrowAnimate);
      }, 100);
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
let foodId = 0;

const decimal = 10000;
const random = setting.throwFoodRandom * 100;

const foodAreaEl = document.getElementById('foodArea');
const playerEl = document.getElementById('player');

const throwFood = () => {
  if (setting.needShotOver && hasThrow) return;

  const topValue = 1.7 * setting.foodSpeed;
  const g = 0.05 * setting.foodSpeed * decimal;
  const radians = ((arrow.deg + 85) * Math.PI) / 180;
  let topAdd = Math.round(
    Math.cos(radians) * topValue * decimal + Math.random() * random
  );
  let leftAdd = Math.round(
    -Math.sin(radians) * setting.foodSpeed * decimal + Math.random() * random
  );
  let top = 79;
  let left = 80;
  let isAlreadyIn = false;
  let frames = 0;

  const currentFoodId = ++foodId;

  hasThrow = true;

  const foodName = state.currentFood.name;
  if (state.throwElements[foodName]) {
    state.throwElements[foodName] += 1;
  } else {
    state.throwElements[foodName] = 1;
  }

  const food = document.createElement('div');

  food.id = `food${currentFoodId}`;
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

    if (currentFoodId === foodId) {
      playerEl.classList.toggle('on', hasThrow && frames < 10);
      selectFood.el.classList.toggle('hide', hasThrow && frames < 10);
    }

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
    }

    top += topAdd / decimal;
    left += leftAdd / decimal;

    food.style.top = `${top}%`;
    food.style.left = `${left}%`;
    food.style.transform = `translate(-50%, -50%) rotate(${left * 10}deg)`;

    setTimeout(() => {
      window.requestAnimationFrame(foodAnimate);
    }, 30);
  };

  foodAnimate();
};

/* ====== 烤布丁 ====== */

const bake = {
  data: {},
  resultPuddingEl: document.getElementById('resultPudding'),
  resultCommentEl: document.getElementById('resultComment'),
  resultDetailsEl: document.getElementById('resultDetails'),
  resultImgEl: document.getElementById('resultImg'),
  calc: () => {
    // 計算比例及成本
    let total = 0;
    let totalPrice = 0;

    const list = Object.entries(state.elements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      total += i[1] * item.weight;
      totalPrice += i[1] * item.price;
      bake.data[i[0]] = i[1] * item.weight;
      return `${item.text} ... ${i[1] * item.weight}g`;
    });

    // 額外食材
    const copies = Math.ceil(state.cups / 2);
    const addingText = `${adding[0].text} ... ${copies * adding[0].weight}cc`;

    totalPrice += copies * adding[0].price;

    bake.data.total = total;

    // 計算耗損成本
    let throwTotalPrice = 0;

    const throwList = Object.entries(state.throwElements).map((i) => {
      const item = foods.find((f) => f.name === i[0]);
      throwTotalPrice += i[1] * item.price;
      return `${item.text} ... ${i[1] * item.weight}g`;
    });

    const resultDetails = `你的配方:\n${list.join(
      '\n'
    )}\n${addingText}\n食材成本:${numberFormat(
      totalPrice
    )}元\n損耗成本:${numberFormat(throwTotalPrice)}元`;

    console.log(resultDetails);

    bake.resultDetailsEl.textContent = resultDetails;
  },
  start: () => {
    bake.data = {};
    bake.calc();

    const total = bake.data.total;
    const y = bake.data?.eggYellow || 0;
    const w = bake.data?.eggWhite || 0;
    const m = bake.data?.milk || 0;
    const c = bake.data?.cream || 0;
    const s = bake.data?.sugar || 0;

    console.log(
      '🚀 ~ startBake ~ startBake:',
      `食材總數：`,
      state.foodInPot,
      `加入食材：`,
      state.elements,
      bake.data,
      // `已丟出食材：`,
      // state.throwElements
      'm ' + (m / total).toFixed(3),
      'w ' + (w / total).toFixed(3),
      'y ' + (y / total).toFixed(3),
      'c ' + (c / total).toFixed(3),
      's ' + (s / total).toFixed(3)
    );

    let isSuccess = true;

    let result = '你烤出了一個意想不到的布丁!';
    let resultComment = '';
    let resultImg = 'rose-mai-mai';

    switch (true) {
      /* ====== 沒烤出布丁 ====== */
      // 只有糖
      case s >= total:
        result = `獲得 ${state.cups} 杯熱熱的糖! (你只加了糖)`;
        isSuccess = false;
        resultImg = 'sugar';
        break;
      // 糖過多
      case s / total > 0.4:
        result = `獲得 ${state.cups} 杯糖漿! (糖比例過高)`;
        isSuccess = false;
        resultImg = 'syrup';
        break;
      // 只有蛋黃和蛋白
      case y + w + s >= total:
        result = `獲得 ${state.cups} 塊硬硬的蒸蛋! (你只加了蛋)`;
        isSuccess = false;
        resultImg = 'egg';
        break;
      // 沒有加蛋
      case m + c + s >= total:
        result = `獲得 ${state.cups} 杯熱牛奶! (你沒有加蛋)`;
        isSuccess = false;
        resultImg = 'milk';
        break;
      // 蛋黃蛋白<1/8
      case (y + w) / total < 0.125:
        result = '布丁沒有成型! (蛋比例過少)';
        isSuccess = false;
        resultImg = 'fail';
        break;
      // 蛋黃蛋白>1/2
      case (y + w) / total > 0.4:
        result = `獲得 ${state.cups} 杯蒸蛋! (蛋比例過高)`;
        isSuccess = false;
        resultImg = 'egg';
        break;

      /* ====== 基本布丁類別 ====== */
      // 奶酪
      case y <= 0:
        result = `獲得 ${state.cups} 杯奶酪`;
        resultImg = 'cheese';
        break;
      // 中式硬布丁
      case c / total < 0.1 && w / (y + w) >= 0.5 && (y + w) / total > 0.25:
        result = `烤出了 ${state.cups} 杯中式硬布丁`;
        resultImg = 'hard';
        break;
      // 昭和硬布丁
      case c / total < 0.25 &&
        y / (y + w) > 0.5 &&
        (y + w) / total > 0.25 &&
        s / total > 0.04:
        result = `烤出了 ${state.cups} 杯昭和硬布丁`;
        resultImg = 'showa';
        break;
      // 布蕾
      case c / total > 0.3 &&
        y / (y + w) >= 0.9 &&
        (y + w) / total < 0.25 &&
        s / total > 0.04:
        result = `烤出了 ${state.cups} 杯布蕾`;
        resultImg = 'bree';
        break;
      // 螺絲麥麥的軟布丁
      case c / total > 0.3 &&
        m / total > 0.45 &&
        s / total > 0.04 &&
        s / total < 0.06 &&
        (y + w) / total < 0.2 &&
        y / (y + w) > 0.5:
        result = `恭喜你!!烤出了 ${state.cups} 杯螺絲麥麥的軟布丁!`;
        resultImg = 'rose-mai-mai';
        break;
      // 軟布丁
      case c / total >= 0.2 || (y + w) / total <= 0.25:
        result = `烤出了 ${state.cups} 杯軟布丁`;
        resultImg = 'soft';
        break;
      // 硬布丁
      default:
        result = `烤出了 ${state.cups} 杯硬布丁`;
        resultImg = 'hard';
        break;
    }

    console.log('🚀 ~ startBake ~ result:', result);

    bake.resultImgEl.src = `./img/game/result/${resultImg}.png`;

    bake.resultPuddingEl.textContent = result;

    /* ====== 評論 ====== */
    if (isSuccess) {
      // 口感
      switch (true) {
        case c / total > 0.3 && (y + w) / total <= 0.2:
          resultComment += `入口即化`;
          break;
        case c / total >= 0.2 || (y + w) / total <= 0.25:
          resultComment += `口感綿密`;
          break;
        case w / total >= 0.3:
          resultComment += `超硬`;
          break;
        case (y + w) / total > 0.25:
          resultComment += `口感偏硬，蛋味明顯`;
          break;
        case w / total >= 0.12:
          resultComment += `口感Q彈`;
          break;
        case y / total >= 0.12 && c / total > 0.3:
          resultComment += `口感綿密柔滑，蛋香濃郁`;
          break;
        case y / total >= 0.12:
          resultComment += `口感紮實綿密，蛋香濃郁`;
          break;

        case c / total < 0.2:
          resultComment += `口感偏硬`;
          break;
        default:
          resultComment = `口感軟綿`;
          break;
      }

      // 甜度
      switch (true) {
        case s / total >= 0.3:
          resultComment += `，超爆甜，連螞蟻都甜死了!!`;
          break;
        case s / total >= 0.2:
          resultComment += `，甜死人了!`;
          break;
        case s / total >= 0.14:
          resultComment += `，好甜，做給螞蟻人吃的吧`;
          break;
        case s / total >= 0.08 && c / total > 0.4:
          resultComment += `，有點甜膩`;
          break;
        case s / total >= 0.06:
          resultComment += `，有點甜`;
          break;
        case s / total >= 0.03:
          resultComment += `，不會太甜，很剛好`;
          break;
        case s / total >= 0.01:
          resultComment += `，好像可以甜一點`;
          break;
        default:
          resultComment += `，是不是忘了加糖？`;
          break;
      }

      // 整體
      switch (true) {
        case c / total > 0.1 &&
          m / total > 0.4 &&
          s / total > 0.035 &&
          s / total < 0.06 &&
          y / (y + w) > 0.5:
          resultComment += `，非常美味!`;
          break;
        case s / total >= 0.03 &&
          s / total < 0.1 &&
          y / total > 0.08 &&
          y / total < 0.3 &&
          w / total < 0.2:
          resultComment += `，好吃!`;
          break;
      }

      bake.resultCommentEl.textContent = `某客人：「 ${resultComment} 」`;
    }

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
