/* ============================================================
   data.js — all the picky lists in one friendly place.
   Wardrobe options, color palettes, furniture and build blocks.
   Kids (and grown-ups) can add new options here without touching
   the game logic.
   ============================================================ */

window.GameData = (function () {
  const LANG_KEY = 'kidsGamesLanguage';

  const UI = {
    en: {
      langShort: 'PL',
      langTitle: 'Change language',
      creatorTitle: '✨ Make Your Idol ✨',
      creatorSub: 'Dress up your super-strong hero, then go build a brand-new city!',
      namePlaceholder: 'Your idol name…',
      surprise: '✨ Surprise Me!',
      done: 'Done →',
      tabs: { hair: 'Hair', top: 'Jacket', bottoms: 'Bottoms', boots: 'Boots', prop: 'Prop', face: 'Face', extras: 'Extras', aura: 'Aura' },
      skinTone: 'Skin tone',
      eyes: 'Eyes',
      expression: 'Expression',
      faceGem: 'Face gem',
      accessories: 'Accessories (pick as many as you like)',
      chooseAura: 'Choose your aura',
      style: 'Style',
      colour: 'Colour',
      statuses: {
        permission: 'Ask the neighbour',
        demolish: 'Smash the house!',
        clean: 'Sweep the rubble',
        build: 'Build a new house',
        decorate: 'Decorate the rooms',
        movein: 'Moving in!',
      },
      instruct: {
        permission: 'Tap “Ask nicely”, then “Smash time!” to start on this house.',
        demolish: 'Tap the house blocks to smash them with your super hands — smash them all!',
        clean: 'Tap the rubble to sweep it up. Fill the bar to 100% to clear the lot.',
        build: 'Pick a block, then tap the grid to place it. Tap the same spot again to stack UP and build floors. Use ➖➕ to size the house. Tap 🧽 Eraser then a block to remove it. In a hurry? Tap 🏠 Quick House.',
        decorate: 'Tap a room (Kitchen, Bathroom…) to zoom in and decorate just that room, or 🏠 Whole house to see it all. Pick furniture, tap the floor to place it, tap a piece to remove it. Colour dots paint.',
        movein: 'Your new idol neighbour is moving in — give a wave! Tap “Next lot →” to build the next house.',
        fallback: 'Tap around and have fun!',
      },
      controls: '🖐 drag to spin · 🔍 pinch / scroll to zoom · 👆 tap to act',
      askDialog: 'Can I rebuild your old house and make it fancy?',
      askNicely: '🙏 Ask nicely',
      yesDialog: "Yes please! I can't wait to live in a brand-new home! 💖",
      smashTime: 'Smash time! 💪',
      quickHouse: '🏠 Quick House',
      houseSize: 'House size',
      smaller: '➖',
      bigger: '➕',
      eraser: '🧽 Eraser',
      peeking: '👁 Peeking inside',
      outside: '🏠 Looking outside',
      wholeHouse: 'Whole house',
      paintItem: 'Paint item',
      paintWalls: 'Paint walls',
      paintFloor: 'Paint floor',
      moveIn: 'Move in! →',
      welcomeTip: 'Give your new neighbour a warm welcome! 👋',
      nextLot: 'Next lot →',
      cleanDone: 'All clean! ✨',
      cleanPct: (pct) => `Clean: ${pct}%`,
      welcomeHome: '🎉 Welcome home! 🎉',
      cityHomes: (name, count) => `${name}'s city has ${count} home${count > 1 ? 's' : ''}!`,
      defaultName: 'Star',
      helpTitle: 'Help',
      soundTitle: 'Sound on/off',
    },
    pl: {
      langShort: 'EN',
      langTitle: 'Zmień język',
      creatorTitle: '✨ Stwórz swoją idolkę ✨',
      creatorSub: 'Ubierz super-silnego bohatera, a potem zbuduj zupełnie nowe miasto!',
      namePlaceholder: 'Imię idola…',
      surprise: '✨ Losuj!',
      done: 'Gotowe →',
      tabs: { hair: 'Włosy', top: 'Kurtka', bottoms: 'Dół', boots: 'Buty', prop: 'Rekwizyt', face: 'Twarz', extras: 'Dodatki', aura: 'Aura' },
      skinTone: 'Odcień skóry',
      eyes: 'Oczy',
      expression: 'Mina',
      faceGem: 'Ozdoba twarzy',
      accessories: 'Dodatki (wybierz ile chcesz)',
      chooseAura: 'Wybierz aurę',
      style: 'Styl',
      colour: 'Kolor',
      statuses: {
        permission: 'Zapytaj sąsiada',
        demolish: 'Zburz dom!',
        clean: 'Zamieć gruz',
        build: 'Zbuduj nowy dom',
        decorate: 'Udekoruj pokoje',
        movein: 'Przeprowadzka!',
      },
      instruct: {
        permission: 'Kliknij „Poproś ładnie”, potem „Czas burzyć!”, żeby zacząć przy tym domu.',
        demolish: 'Klikaj klocki domu, żeby rozbić je super-rękami — zburz wszystko!',
        clean: 'Klikaj gruz, żeby go zamieść. Napełnij pasek do 100%, żeby oczyścić działkę.',
        build: 'Wybierz klocek, potem klikaj siatkę, żeby go postawić. Kliknij to samo miejsce znowu, żeby budować W GÓRĘ i robić piętra. Zmień wielkość ➖➕. Kliknij 🧽 Gumka, potem klocek, żeby go zdjąć. Spieszysz się? Kliknij 🏠 Szybki Dom.',
        decorate: 'Kliknij pokój (Kuchnia, Łazienka…), żeby przybliżyć i udekorować tylko ten pokój, albo 🏠 Cały dom, żeby zobaczyć wszystko. Wybierz mebel, kliknij podłogę, żeby go postawić, kliknij mebel, żeby go usunąć. Kolorowe kropki malują.',
        movein: 'Nowy idol-sąsiad się wprowadza — pomachaj! Kliknij „Następna działka →”, żeby budować dalej.',
        fallback: 'Klikaj i baw się dobrze!',
      },
      controls: '🖐 przeciągnij, żeby obracać · 🔍 uszczypnij / przewiń, żeby przybliżyć · 👆 kliknij, żeby działać',
      askDialog: 'Czy mogę przebudować twój stary dom i zrobić go super?',
      askNicely: '🙏 Poproś ładnie',
      yesDialog: 'Tak, proszę! Nie mogę się doczekać nowego domu! 💖',
      smashTime: 'Czas burzyć! 💪',
      quickHouse: '🏠 Szybki Dom',
      houseSize: 'Wielkość domu',
      smaller: '➖',
      bigger: '➕',
      eraser: '🧽 Gumka',
      peeking: '👁 Patrzysz do środka',
      outside: '🏠 Patrzysz z zewnątrz',
      wholeHouse: 'Cały dom',
      paintItem: 'Maluj mebel',
      paintWalls: 'Maluj ściany',
      paintFloor: 'Maluj podłogę',
      moveIn: 'Wprowadź! →',
      welcomeTip: 'Przywitaj ciepło nowego sąsiada! 👋',
      nextLot: 'Następna działka →',
      cleanDone: 'Wszystko czyste! ✨',
      cleanPct: (pct) => `Czystość: ${pct}%`,
      welcomeHome: '🎉 Witaj w domu! 🎉',
      cityHomes: (name, count) => `Miasto ${name} ma już ${count} ${count === 1 ? 'dom' : 'domy'}!`,
      defaultName: 'Gwiazda',
      helpTitle: 'Pomoc',
      soundTitle: 'Dźwięk wł./wył.',
    },
  };

  const PL_NAMES = {
    purple: 'Fioletowy', pink: 'Różowy', blue: 'Niebieski', black: 'Czarny', silver: 'Srebrny', blonde: 'Blond', ombre: 'Ombré',
    white: 'Biały', gold: 'Złoty', yellow: 'Żółty', patterned: 'Wzorzysty', cyan: 'Cyjan', green: 'Zielony',
    brown: 'Brązowe', violet: 'Fioletowe',
    long: 'Długie falujące', ponytail: 'Wysoki kucyk', buns: 'Kosmiczne koki', bob: 'Gładki bob', braids: 'Warkocze', halfup: 'Półupięte z grzywką',
    jacket: 'Cekinowa kurtka', strappy: 'Top na ramiączkach', tee: 'Ozdobny T-shirt', blouse: 'Błyszcząca bluzka',
    skirt: 'Spódnica z łańcuszkiem', pants: 'Wzorzyste spodnie', shorts: 'Wysokie szorty', layered: 'Warstwowa spódnica',
    knee: 'Do kolan', combat: 'Bojówki', sneakers: 'Sneakersy', covers: 'Nakładki na buty',
    none: 'Brak', wand: 'Gwiezdna różdżka', blade: 'Błyszczące ostrze', baton: 'Świetlny baton',
    smile: 'Uśmiech', cool: 'Cool', wink: 'Mrugnięcie', star: 'Gwiazda', gem: 'Klejnot',
    floor: 'Podłoga', wall: 'Ściana', window: 'Okno', door: 'Drzwi', roof: 'Dach',
    paintCream: 'Kremowy', paintMint: 'Miętowy', paintBlue: 'Niebo', paintPink: 'Różowy', wood: 'Drewno', tile: 'Kafelki',
    kitchen: 'Kuchnia', bathroom: 'Łazienka', bedroom: 'Sypialnia', living: 'Salon',
    counter: 'Blat', sink: 'Zlew', stove: 'Kuchenka', fridge: 'Lodówka', table: 'Stół', chair: 'Krzesło', cabinet: 'Szafka',
    tub: 'Wanna', toilet: 'Toaleta', bsink: 'Umywalka', mirror: 'Lustro', towel: 'Ręczniki',
    bed: 'Łóżko', dresser: 'Komoda', lamp: 'Lampa', rug: 'Dywan', wardrobe: 'Szafa',
    sofa: 'Sofa', tv: 'TV', bookshelf: 'Regał', plant: 'Roślina', painting: 'Obraz',
  };

  function lang() { return localStorage.getItem(LANG_KEY) === 'pl' ? 'pl' : 'en'; }
  function setLang(next) { localStorage.setItem(LANG_KEY, next === 'pl' ? 'pl' : 'en'); }
  function t(key, ...args) {
    const parts = key.split('.');
    let value = UI[lang()];
    parts.forEach((part) => { value = value && value[part]; });
    if (value == null) {
      value = UI.en;
      parts.forEach((part) => { value = value && value[part]; });
    }
    return typeof value === 'function' ? value(...args) : value;
  }
  function name(item) { return lang() === 'pl' ? (PL_NAMES[item.id] || item.name) : item.name; }
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
    lang, setLang, t, name,
  };
})();
