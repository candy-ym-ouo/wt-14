export const BOARD_CONFIG = {
  width: 12,
  height: 10,
  tileSize: 56,
  hexLayout: false,
  gridColor: 0x3d2817,
  backgroundColor: 0x1a0f08,
  terrainColors: {
    plain: 0x5c4033,
    forest: 0x2d5016,
    mountain: 0x696969,
    water: 0x1e4d6b,
    ruin: 0x8b7355,
    base_red: 0x8b0000,
    base_blue: 0x00008b
  },
  terrainMoveCost: {
    plain: 1,
    forest: 2,
    mountain: 3,
    water: 999,
    ruin: 1,
    base_red: 1,
    base_blue: 1
  },
  terrainDefense: {
    plain: 0,
    forest: 2,
    mountain: 3,
    water: 0,
    ruin: 2,
    base_red: 3,
    base_blue: 3
  }
};

export const TERRAIN_MAP = [
  ['base_red','plain','plain','forest','plain','plain','mountain','plain','plain','ruin','plain','base_blue'],
  ['plain','plain','forest','forest','plain','mountain','mountain','plain','forest','plain','plain','plain'],
  ['plain','forest','forest','plain','plain','plain','mountain','plain','forest','forest','plain','plain'],
  ['plain','plain','plain','plain','water','water','plain','plain','plain','forest','plain','plain'],
  ['mountain','plain','plain','water','water','water','water','plain','plain','plain','plain','ruin'],
  ['mountain','mountain','plain','water','water','water','water','plain','plain','plain','forest','plain'],
  ['plain','plain','plain','plain','water','water','plain','plain','forest','forest','plain','plain'],
  ['plain','plain','forest','forest','plain','plain','plain','ruin','forest','plain','plain','plain'],
  ['plain','forest','plain','plain','forest','mountain','mountain','plain','plain','plain','plain','plain'],
  ['base_red','plain','plain','ruin','plain','mountain','plain','plain','forest','plain','plain','base_blue']
];
