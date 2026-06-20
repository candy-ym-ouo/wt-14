export const CHARACTERS = {
  commander: {
    id: 'commander',
    name: '林远',
    title: '红方指挥官',
    color: '#cc6666',
    avatar: '⚔️'
  },
  strategist: {
    id: 'strategist',
    name: '苏晴',
    title: '军师',
    color: '#6666cc',
    avatar: '📜'
  },
  enemy_general: {
    id: 'enemy_general',
    name: '韩滔',
    title: '蓝方大将',
    color: '#666699',
    avatar: '🛡️'
  },
  scout_captain: {
    id: 'scout_captain',
    name: '陈风',
    title: '侦察队长',
    color: '#66cc66',
    avatar: '🏹'
  },
  narrator: {
    id: 'narrator',
    name: '旁白',
    title: '',
    color: '#888888',
    avatar: '📖'
  }
};

export const CHAPTERS = [
  {
    id: 'chapter_1',
    title: '第一章：边境烽火',
    subtitle: '硝烟初起',
    description: '蓝方军队突然袭击边境哨所，作为红方指挥官，你必须率军抵御入侵。',
    icon: '🏰',
    unlockRequirement: null,
    levels: [
      {
        id: 'level_1_1',
        title: '1-1 边境哨所',
        description: '击退入侵的蓝方先头部队',
        type: 'battle',
        mapX: 15,
        mapY: 30,
        difficulty: 1,
        prerequisites: [],
        preDialog: [
          {
            character: 'narrator',
            text: '永安三年秋，蓝方撕毁和平协议，铁骑南下，边境哨所首当其冲。'
          },
          {
            character: 'scout_captain',
            text: '报告指挥官！蓝方侦察兵出现在十里外，人数约一个小队！'
          },
          {
            character: 'commander',
            text: '所有人准备战斗！利用哨所周围的地形，给敌人一个迎头痛击！'
          },
          {
            character: 'strategist',
            text: '指挥官，建议先用侦察兵探查敌情，弓箭手在后方提供火力支援。'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 1, y: 4, preset: true },
          { type: 'infantry', x: 2, y: 4, preset: true },
          { type: 'archer', x: 1, y: 5, preset: true },
          { type: 'scout', x: 2, y: 5, preset: true }
        ],
        enemyUnits: [
          { type: 'scout', x: 9, y: 3, player: 'blue' },
          { type: 'scout', x: 10, y: 3, player: 'blue' },
          { type: 'infantry', x: 9, y: 5, player: 'blue' },
          { type: 'infantry', x: 10, y: 5, player: 'blue' }
        ],
        winCondition: 'elimination',
        maxTurns: 20,
        terrainModifier: null,
        rewards: {
          exp: 100,
          gold: 50,
          unlockUnits: [],
          items: []
        },
        postDialog: [
          {
            character: 'commander',
            text: '干得好！敌军的先头部队已经被我们击退了。'
          },
          {
            character: 'strategist',
            text: '根据俘虏的口供，敌军主力正在向此处集结，我们需要做好长期作战的准备。'
          },
          {
            character: 'scout_captain',
            text: '在战场上我们缴获了一些敌军的装备，可以用来武装新兵。'
          }
        ]
      },
      {
        id: 'level_1_2',
        title: '1-2 河谷伏击',
        description: '在河谷地带设伏，歼灭敌军增援部队',
        type: 'battle',
        mapX: 45,
        mapY: 30,
        difficulty: 2,
        prerequisites: ['level_1_1'],
        preDialog: [
          {
            character: 'strategist',
            text: '指挥官，侦察报告敌军一个增援小队正通过西北河谷前往前线。'
          },
          {
            character: 'commander',
            text: '河谷地形狭窄，是伏击的绝佳地点。传令下去，全军设伏！'
          },
          {
            character: 'scout_captain',
            text: '我们已经在河谷两侧高地布置了弓箭手，就等鱼儿上钩了。'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 2, y: 2, preset: true },
          { type: 'infantry', x: 2, y: 3, preset: true },
          { type: 'archer', x: 1, y: 1, preset: true },
          { type: 'archer', x: 1, y: 4, preset: true },
          { type: 'scout', x: 3, y: 2, preset: true },
          { type: 'scout', x: 3, y: 3, preset: true }
        ],
        enemyUnits: [
          { type: 'infantry', x: 9, y: 2, player: 'blue' },
          { type: 'infantry', x: 9, y: 3, player: 'blue' },
          { type: 'infantry', x: 10, y: 2, player: 'blue' },
          { type: 'archer', x: 10, y: 3, player: 'blue' },
          { type: 'scout', x: 8, y: 2, player: 'blue' },
          { type: 'scout', x: 8, y: 3, player: 'blue' }
        ],
        winCondition: 'elimination',
        maxTurns: 25,
        terrainModifier: null,
        rewards: {
          exp: 150,
          gold: 80,
          unlockUnits: ['knight'],
          items: []
        },
        postDialog: [
          {
            character: 'commander',
            text: '漂亮的伏击战！敌军增援已被全歼。'
          },
          {
            character: 'strategist',
            text: '此战缴获颇丰，我们可以组建一支骑士部队了。重装骑士将成为我们的攻坚利器。'
          }
        ]
      },
      {
        id: 'level_1_3',
        title: '1-3 据点争夺',
        description: '夺取蓝方前线据点，控制战略要地',
        type: 'battle',
        mapX: 75,
        mapY: 30,
        difficulty: 3,
        prerequisites: ['level_1_2'],
        preDialog: [
          {
            character: 'scout_captain',
            text: '前方发现蓝方一个小型据点，驻守着敌军一个中队。'
          },
          {
            character: 'commander',
            text: '这个据点控制着通往内陆的要道，必须拿下！骑士部队冲锋！'
          },
          {
            character: 'enemy_general',
            text: '哼，区区红方残兵也敢来攻我据点？让你们见识下蓝军的厉害！'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 1, y: 3, preset: true },
          { type: 'infantry', x: 1, y: 4, preset: true },
          { type: 'infantry', x: 1, y: 5, preset: true },
          { type: 'archer', x: 0, y: 3, preset: true },
          { type: 'archer', x: 0, y: 5, preset: true },
          { type: 'knight', x: 2, y: 4, preset: true },
          { type: 'scout', x: 2, y: 2, preset: true },
          { type: 'scout', x: 2, y: 6, preset: true }
        ],
        enemyUnits: [
          { type: 'infantry', x: 10, y: 3, player: 'blue' },
          { type: 'infantry', x: 10, y: 4, player: 'blue' },
          { type: 'infantry', x: 10, y: 5, player: 'blue' },
          { type: 'archer', x: 11, y: 3, player: 'blue' },
          { type: 'archer', x: 11, y: 5, player: 'blue' },
          { type: 'knight', x: 10, y: 6, player: 'blue' },
          { type: 'scout', x: 9, y: 2, player: 'blue' },
          { type: 'mage', x: 11, y: 4, player: 'blue' }
        ],
        winCondition: 'base_capture',
        maxTurns: 30,
        terrainModifier: null,
        rewards: {
          exp: 250,
          gold: 150,
          unlockUnits: ['mage'],
          items: []
        },
        postDialog: [
          {
            character: 'commander',
            text: '据点已被我军控制！这一战之后，蓝方的攻势将被彻底遏制。'
          },
          {
            character: 'strategist',
            text: '在据点中我们发现了蓝方的法师研究资料，可以训练我们自己的法师部队了。'
          },
          {
            character: 'enemy_general',
            text: '可恶...这只是开始，我军主力部队很快就会到来，你们等着吧！'
          }
        ]
      }
    ],
    chapterEndDialog: [
      {
        character: 'narrator',
        text: '第一章完。边境的烽烟暂时平息，但更大的风暴正在酝酿之中...'
      },
      {
        character: 'commander',
        text: '士兵们，你们都是好样的！但战斗还未结束，休整之后，我们将进军蓝方本土！'
      }
    ]
  },
  {
    id: 'chapter_2',
    title: '第二章：战略反攻',
    subtitle: '剑锋所指',
    description: '集结精锐部队，向蓝方控制区发起战略反攻。',
    icon: '⚔️',
    unlockRequirement: 'chapter_1',
    levels: [
      {
        id: 'level_2_1',
        title: '2-1 渡河之战',
        description: '强渡界河，打开反攻大门',
        type: 'battle',
        mapX: 15,
        mapY: 70,
        difficulty: 4,
        prerequisites: [],
        preDialog: [
          {
            character: 'strategist',
            text: '界河是蓝方的第一道天然防线，对岸驻守着重兵。'
          },
          {
            character: 'commander',
            text: '兵法云：置之死地而后生。今日我们就破釜沉舟，背水一战！'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 1, y: 8, preset: true },
          { type: 'infantry', x: 2, y: 8, preset: true },
          { type: 'infantry', x: 3, y: 8, preset: true },
          { type: 'archer', x: 1, y: 9, preset: true },
          { type: 'archer', x: 3, y: 9, preset: true },
          { type: 'knight', x: 2, y: 9, preset: true },
          { type: 'mage', x: 0, y: 8, preset: true },
          { type: 'scout', x: 0, y: 9, preset: true }
        ],
        enemyUnits: [
          { type: 'infantry', x: 9, y: 1, player: 'blue' },
          { type: 'infantry', x: 10, y: 1, player: 'blue' },
          { type: 'infantry', x: 9, y: 2, player: 'blue' },
          { type: 'archer', x: 10, y: 0, player: 'blue' },
          { type: 'archer', x: 9, y: 0, player: 'blue' },
          { type: 'knight', x: 10, y: 2, player: 'blue' },
          { type: 'mage', x: 11, y: 1, player: 'blue' },
          { type: 'scout', x: 8, y: 1, player: 'blue' }
        ],
        winCondition: 'elimination',
        maxTurns: 30,
        terrainModifier: null,
        rewards: {
          exp: 300,
          gold: 200,
          unlockUnits: [],
          items: []
        },
        postDialog: [
          {
            character: 'commander',
            text: '成功渡河！蓝方的天险已被我军踩在脚下。'
          },
          {
            character: 'strategist',
            text: '对岸是一望无际的平原，正是我军骑兵大展身手的地方。'
          }
        ]
      },
      {
        id: 'level_2_2',
        title: '2-2 平原会战',
        description: '与蓝方主力在平原决战',
        type: 'battle',
        mapX: 45,
        mapY: 70,
        difficulty: 5,
        prerequisites: ['level_2_1'],
        preDialog: [
          {
            character: 'scout_captain',
            text: '前方发现蓝方主力！韩滔亲自率军，阵容齐整，不可小觑。'
          },
          {
            character: 'enemy_general',
            text: '林远小儿！今日便是你的葬身之地！全军突击！'
          },
          {
            character: 'commander',
            text: '来得正好！就让我们在此决一雌雄！全军列阵！'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 0, y: 4, preset: true },
          { type: 'infantry', x: 0, y: 5, preset: true },
          { type: 'infantry', x: 1, y: 4, preset: true },
          { type: 'infantry', x: 1, y: 5, preset: true },
          { type: 'archer', x: 0, y: 3, preset: true },
          { type: 'archer', x: 0, y: 6, preset: true },
          { type: 'knight', x: 2, y: 4, preset: true },
          { type: 'knight', x: 2, y: 5, preset: true },
          { type: 'mage', x: 1, y: 3, preset: true },
          { type: 'scout', x: 2, y: 3, preset: true },
          { type: 'scout', x: 2, y: 6, preset: true }
        ],
        enemyUnits: [
          { type: 'infantry', x: 10, y: 4, player: 'blue' },
          { type: 'infantry', x: 10, y: 5, player: 'blue' },
          { type: 'infantry', x: 11, y: 4, player: 'blue' },
          { type: 'infantry', x: 11, y: 5, player: 'blue' },
          { type: 'archer', x: 11, y: 3, player: 'blue' },
          { type: 'archer', x: 11, y: 6, player: 'blue' },
          { type: 'knight', x: 9, y: 4, player: 'blue' },
          { type: 'knight', x: 9, y: 5, player: 'blue' },
          { type: 'mage', x: 10, y: 3, player: 'blue' },
          { type: 'mage', x: 10, y: 6, player: 'blue' },
          { type: 'scout', x: 9, y: 3, player: 'blue' },
          { type: 'scout', x: 9, y: 6, player: 'blue' }
        ],
        winCondition: 'elimination',
        maxTurns: 40,
        terrainModifier: null,
        rewards: {
          exp: 500,
          gold: 400,
          unlockUnits: [],
          items: []
        },
        postDialog: [
          {
            character: 'commander',
            text: '大胜！韩滔大败而逃，蓝方主力覆灭！'
          },
          {
            character: 'strategist',
            text: '这一战奠定了胜局，蓝方的首都已经门户大开。'
          },
          {
            character: 'enemy_general',
            text: '不可能...我精心训练的精锐之师...林远，我还会回来的！'
          }
        ]
      },
      {
        id: 'level_2_3',
        title: '2-3 王城攻略',
        description: '攻陷蓝方王城，结束战争',
        type: 'battle',
        mapX: 75,
        mapY: 70,
        difficulty: 6,
        prerequisites: ['level_2_2'],
        preDialog: [
          {
            character: 'narrator',
            text: '红方大军兵临城下，蓝方王城的最后守卫战即将打响。'
          },
          {
            character: 'commander',
            text: '将士们！攻下王城，这场战争就结束了！为了和平，冲锋！'
          },
          {
            character: 'enemy_general',
            text: '城在人在，城亡人亡！我韩滔誓与王城共存亡！'
          }
        ],
        playerUnits: [
          { type: 'infantry', x: 0, y: 3, preset: true },
          { type: 'infantry', x: 0, y: 4, preset: true },
          { type: 'infantry', x: 0, y: 5, preset: true },
          { type: 'infantry', x: 0, y: 6, preset: true },
          { type: 'archer', x: 1, y: 2, preset: true },
          { type: 'archer', x: 1, y: 7, preset: true },
          { type: 'knight', x: 1, y: 4, preset: true },
          { type: 'knight', x: 1, y: 5, preset: true },
          { type: 'mage', x: 0, y: 2, preset: true },
          { type: 'mage', x: 0, y: 7, preset: true },
          { type: 'scout', x: 1, y: 3, preset: true },
          { type: 'scout', x: 1, y: 6, preset: true }
        ],
        enemyUnits: [
          { type: 'infantry', x: 10, y: 3, player: 'blue' },
          { type: 'infantry', x: 10, y: 4, player: 'blue' },
          { type: 'infantry', x: 10, y: 5, player: 'blue' },
          { type: 'infantry', x: 10, y: 6, player: 'blue' },
          { type: 'infantry', x: 11, y: 4, player: 'blue' },
          { type: 'infantry', x: 11, y: 5, player: 'blue' },
          { type: 'archer', x: 11, y: 2, player: 'blue' },
          { type: 'archer', x: 11, y: 7, player: 'blue' },
          { type: 'knight', x: 9, y: 4, player: 'blue' },
          { type: 'knight', x: 9, y: 5, player: 'blue' },
          { type: 'mage', x: 11, y: 3, player: 'blue' },
          { type: 'mage', x: 11, y: 6, player: 'blue' },
          { type: 'scout', x: 9, y: 3, player: 'blue' },
          { type: 'scout', x: 9, y: 6, player: 'blue' }
        ],
        winCondition: 'base_capture',
        maxTurns: 50,
        terrainModifier: null,
        rewards: {
          exp: 1000,
          gold: 1000,
          unlockUnits: [],
          items: []
        },
        postDialog: [
          {
            character: 'narrator',
            text: '王城陷落，蓝方大势已去。韩滔身披数创，仍死战不退。'
          },
          {
            character: 'commander',
            text: '韩滔，你已尽力了。放下武器，我保证蓝方军民的安全。'
          },
          {
            character: 'enemy_general',
            text: '...林远，我韩滔纵横沙场数十年，今日败于你手，心服口服。希望你能善待我的子民。'
          },
          {
            character: 'strategist',
            text: '战争结束了，新的时代即将开始。'
          }
        ]
      }
    ],
    chapterEndDialog: [
      {
        character: 'narrator',
        text: '第二章完。历时三年的战争终于落下帷幕，红蓝双方在废墟之上签订了和平协议。'
      },
      {
        character: 'commander',
        text: '和平来之不易，我们要倍加珍惜。愿天下永无战事！'
      }
    ]
  }
];

export function getAllLevels() {
  const levels = [];
  CHAPTERS.forEach(chapter => {
    chapter.levels.forEach(level => {
      levels.push({ ...level, chapterId: chapter.id });
    });
  });
  return levels;
}

export function getChapterById(chapterId) {
  return CHAPTERS.find(c => c.id === chapterId) || null;
}

export function getLevelById(levelId) {
  for (const chapter of CHAPTERS) {
    const level = chapter.levels.find(l => l.id === levelId);
    if (level) return { ...level, chapterId: chapter.id, chapter };
  }
  return null;
}

export function getNextLevel(levelId) {
  const allLevels = getAllLevels();
  const idx = allLevels.findIndex(l => l.id === levelId);
  if (idx === -1 || idx >= allLevels.length - 1) return null;
  return allLevels[idx + 1];
}
