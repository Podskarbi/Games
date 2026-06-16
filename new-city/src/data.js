/* ============================================================
   data.js — all the picky lists in one friendly place.
   Wardrobe options, color palettes, furniture and build blocks.
   Kids (and grown-ups) can add new options here without touching
   the game logic.
   ============================================================ */

window.GameData = (function () {
  // ---- Shared colour swatches -------------------------------------------
  const HAIR_COLORS = [
    { id: 'purple', name: 'Purple', hex: '#a44cff' },
    { id: 'pink', name: 'Pink', hex: '#ff5fb0' },
    { id: 'blue', name: 'Blue', hex: '#3aa0ff' },
    { id: 'black', name: 'Black', hex: '#2b2b33' },
    { id: 'silver', name: 'Silver', hex: '#cfd4dc' },
    { id: 'blonde', name: 'Blonde', hex: '#f4d774' },
    { id: 'ombre', name: 'Ombré', hex: '#2b2b33', hex2: '#a44cff' },
  ];

  const SKIN_TONES = [
    { id: 's1', hex: '#ffe0c4' },
    { id: 's2', hex: '#f6c79b' },
    { id: 's3', hex: '#e0a06b' },
    { id: 's4', hex: '#c47b4a' },
    { id: 's5', hex: '#8d5524' },
    { id: 's6', hex: '#5a3415' },
  ];

  const EYE_COLORS = [
    { id: 'brown', hex: '#6b3d1f' },
    { id: 'blue', hex: '#3a7bd5' },
    { id: 'green', hex: '#3aa86b' },
    { id: 'violet', hex: '#9a4cd6' },
    { id: 'gold', hex: '#d4a017' },
  ];

  // ---- Wardrobe categories ----------------------------------------------
  // Each option carries the colours the 2D preview + 3D voxel avatar use.
  const WARDROBE = {
    hair: {
      label: 'Hair',
      tip: 'Pick your hair',
      styles: [
        { id: 'long', name: 'Long flowing' },
        { id: 'ponytail', name: 'High ponytail' },
        { id: 'buns', name: 'Space buns' },
        { id: 'bob', name: 'Sleek bob' },
        { id: 'braids', name: 'Braids' },
        { id: 'halfup', name: 'Half-up + bangs' },
      ],
      colors: HAIR_COLORS,
    },
    top: {
      label: 'Jacket',
      tip: 'Choose your stage top',
      styles: [
        { id: 'jacket', name: 'Sequin jacket' },
        { id: 'strappy', name: 'Strappy top' },
        { id: 'tee', name: 'Embellished tee' },
        { id: 'blouse', name: 'Shimmer blouse' },
      ],
      colors: [
        { id: 'black', name: 'Black', hex: '#23232b' },
        { id: 'white', name: 'White', hex: '#f4f4f8' },
        { id: 'blue', name: 'Electric blue', hex: '#2f7bff' },
        { id: 'pink', name: 'Hot pink', hex: '#ff3f9a' },
        { id: 'gold', name: 'Gold', hex: '#e8b13a' },
      ],
    },
    bottoms: {
      label: 'Bottoms',
      tip: 'Pick your bottoms',
      styles: [
        { id: 'skirt', name: 'Chain skirt' },
        { id: 'pants', name: 'Printed pants' },
        { id: 'shorts', name: 'High shorts' },
        { id: 'layered', name: 'Layered skirt' },
      ],
      colors: [
        { id: 'yellow', name: 'Yellow', hex: '#f4cf3a' },
        { id: 'blue', name: 'Blue', hex: '#3a6dff' },
        { id: 'black', name: 'Black', hex: '#23232b' },
        { id: 'pink', name: 'Pink', hex: '#ff6fb0' },
        { id: 'patterned', name: 'Patterned', hex: '#7a4cff' },
      ],
    },
    boots: {
      label: 'Boots',
      tip: 'Step into boots',
      styles: [
        { id: 'knee', name: 'Knee-high' },
        { id: 'combat', name: 'Combat' },
        { id: 'sneakers', name: 'Sneakers' },
        { id: 'covers', name: 'Boot covers' },
      ],
      colors: [
        { id: 'black', name: 'Black', hex: '#1f1f27' },
        { id: 'white', name: 'White', hex: '#eef0f4' },
        { id: 'gold', name: 'Gold', hex: '#e8b13a' },
        { id: 'pink', name: 'Pink', hex: '#ff6fb0' },
      ],
    },
    prop: {
      label: 'Prop',
      tip: 'Grab a sparkly prop',
      styles: [
        { id: 'none', name: 'No prop' },
        { id: 'wand', name: 'Star wand' },
        { id: 'blade', name: 'Sparkle blade' },
        { id: 'baton', name: 'Light baton' },
      ],
      colors: [
        { id: 'cyan', name: 'Cyan', hex: '#43e8ff' },
        { id: 'pink', name: 'Pink', hex: '#ff5fb0' },
        { id: 'gold', name: 'Gold', hex: '#ffd34d' },
        { id: 'green', name: 'Green', hex: '#5dff9b' },
      ],
    },
    face: {
      label: 'Face',
      tip: 'Make your face',
      skin: SKIN_TONES,
      eyes: EYE_COLORS,
      expressions: [
        { id: 'smile', name: 'Smile' },
        { id: 'cool', name: 'Cool' },
        { id: 'wink', name: 'Wink' },
      ],
      gems: [
        { id: 'none', name: 'None' },
        { id: 'star', name: 'Star' },
        { id: 'gem', name: 'Gem' },
      ],
    },
    aura: {
      label: 'Aura',
      tip: 'Choose your aura',
      styles: [
        { id: 'none', name: 'None', hex: '#ffffff' },
        { id: 'gold', name: 'Golden sparkle', hex: '#ffd34d' },
        { id: 'neon', name: 'Neon trail', hex: '#43e8ff' },
        { id: 'star', name: 'Star burst', hex: '#ff5fb0' },
      ],
    },
  };

  // A starting outfit so the preview never looks empty.
  function defaultAvatar() {
    return {
      name: '',
      hair: { style: 'long', color: 'purple' },
      top: { style: 'jacket', color: 'black' },
      bottoms: { style: 'skirt', color: 'pink' },
      boots: { style: 'knee', color: 'black' },
      prop: { style: 'wand', color: 'cyan' },
      face: { skin: 's2', eyes: 'brown', expression: 'smile', gem: 'star' },
      accessories: { armbands: false, gloves: true, choker: true, earrings: true, belt: false },
      aura: 'gold',
    };
  }

  // ---- Build phase: block palette ----------------------------------------
  // Voxel cubes that snap to the build grid.
  const BLOCKS = [
    { id: 'floor', name: 'Floor', hex: '#caa472', kind: 'floor' },
    { id: 'wall', name: 'Wall', hex: '#e8dccb', kind: 'wall' },
    { id: 'window', name: 'Window', hex: '#aee3ff', kind: 'window' },
    { id: 'door', name: 'Door', hex: '#9a5b32', kind: 'door' },
    { id: 'roof', name: 'Roof', hex: '#d65c5c', kind: 'roof' },
  ];

  // Wall / floor paint + material choices for decorating.
  const MATERIALS = [
    { id: 'paintCream', name: 'Cream', hex: '#efe6d6' },
    { id: 'paintMint', name: 'Mint', hex: '#bdead0' },
    { id: 'paintBlue', name: 'Sky', hex: '#bcdcff' },
    { id: 'paintPink', name: 'Pink', hex: '#ffcfe2' },
    { id: 'wood', name: 'Wood', hex: '#c08a52' },
    { id: 'tile', name: 'Tile', hex: '#dfe6ea' },
  ];

  // ---- Decorate phase: furniture per room --------------------------------
  // size = [width, height, depth] in voxel units. color = default tint.
  const ROOMS = {
    kitchen: {
      label: 'Kitchen',
      items: [
        { id: 'counter', name: 'Counter', size: [1, 0.9, 0.6], hex: '#d9c7a8' },
        { id: 'sink', name: 'Sink', size: [0.8, 0.9, 0.6], hex: '#c9d3da' },
        { id: 'stove', name: 'Stove', size: [0.9, 0.9, 0.7], hex: '#5a5a66' },
        { id: 'fridge', name: 'Fridge', size: [0.8, 1.6, 0.7], hex: '#e8eef2' },
        { id: 'table', name: 'Table', size: [1.2, 0.8, 0.8], hex: '#b07b48' },
        { id: 'chair', name: 'Chair', size: [0.5, 0.9, 0.5], hex: '#a06a3e' },
        { id: 'cabinet', name: 'Cabinet', size: [1, 1.4, 0.5], hex: '#cdb38c' },
      ],
    },
    bathroom: {
      label: 'Bathroom',
      items: [
        { id: 'tub', name: 'Tub', size: [1.6, 0.7, 0.8], hex: '#eaf4fb' },
        { id: 'toilet', name: 'Toilet', size: [0.6, 0.9, 0.7], hex: '#f2f6f9' },
        { id: 'bsink', name: 'Sink', size: [0.7, 0.9, 0.5], hex: '#dfe8ee' },
        { id: 'mirror', name: 'Mirror', size: [0.7, 0.9, 0.15], hex: '#bfe6ff' },
        { id: 'towel', name: 'Towels', size: [0.5, 0.6, 0.25], hex: '#ffc6dd' },
      ],
    },
    bedroom: {
      label: 'Bedroom',
      items: [
        { id: 'bed', name: 'Bed', size: [1.6, 0.6, 1.1], hex: '#9ec7ff' },
        { id: 'dresser', name: 'Dresser', size: [1.1, 0.9, 0.5], hex: '#bb8a57' },
        { id: 'lamp', name: 'Lamp', size: [0.4, 1.2, 0.4], hex: '#ffe49a' },
        { id: 'rug', name: 'Rug', size: [1.4, 0.06, 1], hex: '#ff9ec2' },
        { id: 'wardrobe', name: 'Wardrobe', size: [1, 1.8, 0.6], hex: '#9a6b3d' },
      ],
    },
    living: {
      label: 'Living room',
      items: [
        { id: 'sofa', name: 'Sofa', size: [1.7, 0.8, 0.8], hex: '#7fb2e8' },
        { id: 'tv', name: 'TV', size: [1.3, 0.8, 0.15], hex: '#2b2b33' },
        { id: 'bookshelf', name: 'Bookshelf', size: [1, 1.7, 0.4], hex: '#a4713f' },
        { id: 'plant', name: 'Plant', size: [0.5, 1.2, 0.5], hex: '#4caa66' },
        { id: 'painting', name: 'Painting', size: [0.9, 0.7, 0.12], hex: '#ffcf6b' },
      ],
    },
  };

  // Cheerful one-liners shown in the Help tooltip per phase.
  const HELP = {
    demolish: 'Tap the blocks to smash the old house with your super hands!',
    permission: 'Walk up and ask the neighbour before you smash their house.',
    clean: 'Tap the rubble to sweep it all away and clear the lot.',
    build: 'Pick a block, then tap the glowing grid to build a new house.',
    decorate: 'Pick furniture and colours to make each room super fancy.',
    movein: 'A new idol neighbour is moving in — give them a wave!',
  };

  function hexToColor(hex) { return parseInt(hex.replace('#', '0x')); }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  return {
    WARDROBE, BLOCKS, MATERIALS, ROOMS, HELP,
    HAIR_COLORS, SKIN_TONES, EYE_COLORS,
    defaultAvatar, hexToColor, pick,
  };
})();
