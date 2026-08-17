/**
 * Comprehensive Hindi <> English Bidirectional Translation & Transliteration Dictionary
 * for Grocery, Vegetables, Fruits, Dairy, Spices, and Daily Essentials.
 */

export interface ItemTranslation {
  english: string;
  hindi: string;       // Devanagari script (e.g. 'आलू')
  hinglish: string[];  // Romanized Hindi keywords (e.g. ['aaloo', 'aloo', 'batata'])
}

export const ITEM_TRANSLATIONS: ItemTranslation[] = [
  // ── VEGETABLES ──
  { english: 'Potato', hindi: 'आलू', hinglish: ['aloo', 'aaloo', 'alu', 'batata'] },
  { english: 'Tomato', hindi: 'टमाटर', hinglish: ['tamatar', 'tamatarr'] },
  { english: 'Onion', hindi: 'प्याज', hinglish: ['pyaz', 'pyaaz', 'kanda', 'pyaj'] },
  { english: 'Lady Finger', hindi: 'भिंडी', hinglish: ['bhindi', 'okra', 'bhendi'] },
  { english: 'Cauliflower', hindi: 'फूलगोभी', hinglish: ['gobhi', 'gobi', 'phoolgobhi', 'fulgobi'] },
  { english: 'Cabbage', hindi: 'पत्तागोभी', hinglish: ['patta gobhi', 'bandgobhi', 'patta gobi'] },
  { english: 'Carrot', hindi: 'गाजर', hinglish: ['gajar', 'gaajar'] },
  { english: 'Radish', hindi: 'मूली', hinglish: ['mooli', 'muli'] },
  { english: 'Green Peas', hindi: 'हरी मटर', hinglish: ['matar', 'mattar', 'hari matar'] },
  { english: 'Spinach', hindi: 'पालक', hinglish: ['palak', 'paalak'] },
  { english: 'Fenugreek', hindi: 'मेथी', hinglish: ['methi'] },
  { english: 'Coriander', hindi: 'धनिया', hinglish: ['dhania', 'dhaniya', 'hara dhania', 'kothmir'] },
  { english: 'Mint', hindi: 'पुदीना', hinglish: ['pudina', 'pudheena'] },
  { english: 'Ginger', hindi: 'अदरक', hinglish: ['adrak', 'aadrak', 'adrakh'] },
  { english: 'Garlic', hindi: 'लहसुन', hinglish: ['lahsun', 'lahsan', 'lassan'] },
  { english: 'Green Chilli', hindi: 'हरी मिर्च', hinglish: ['mirch', 'mirchi', 'hari mirch', 'hari mirchi'] },
  { english: 'Capsicum', hindi: 'शिमला मिर्च', hinglish: ['shimla mirch', 'shimlamirch', 'bell pepper'] },
  { english: 'Brinjal', hindi: 'बैंगन', hinglish: ['baingan', 'baigan', 'bataon', 'eggplant', 'aubergine'] },
  { english: 'Bottle Gourd', hindi: 'लौकी', hinglish: ['lauki', 'ghiya', 'doodhi', 'dudhi'] },
  { english: 'Bitter Gourd', hindi: 'करेला', hinglish: ['karela', 'karelaa'] },
  { english: 'Ridge Gourd', hindi: 'तोरई', hinglish: ['torai', 'tori', 'turai'] },
  { english: 'Pumpkin', hindi: 'कद्दू', hinglish: ['kaddu', 'kashiphal', 'sitaphal'] },
  { english: 'Cucumber', hindi: 'खीरा', hinglish: ['kheera', 'khira', 'kakdi'] },
  { english: 'Beetroot', hindi: 'चुकंदर', hinglish: ['chukandar', 'chukander'] },
  { english: 'Lemon', hindi: 'नींबू', hinglish: ['nimbu', 'neembu', 'limbu'] },
  { english: 'Mushroom', hindi: 'मशरूम', hinglish: ['mashroom', 'khumbi'] },
  { english: 'Corn', hindi: 'मक्का / भुट्टा', hinglish: ['bhutta', 'makka', 'makai', 'sweet corn'] },

  // ── FRUITS ──
  { english: 'Apple', hindi: 'सेब', hinglish: ['seb', 'saeb', 'apple'] },
  { english: 'Banana', hindi: 'केला', hinglish: ['kela', 'kelaa', 'kele'] },
  { english: 'Mango', hindi: 'आम', hinglish: ['aam', 'am'] },
  { english: 'Orange', hindi: 'संतरा', hinglish: ['santara', 'santra', 'narangi', 'mosambi'] },
  { english: 'Sweet Lime', hindi: 'मौसमी', hinglish: ['mosambi', 'mousambi'] },
  { english: 'Grapes', hindi: 'अंगूर', hinglish: ['angoor', 'angur'] },
  { english: 'Papaya', hindi: 'पपीता', hinglish: ['papita', 'papeeta'] },
  { english: 'Watermelon', hindi: 'तरबूज', hinglish: ['tarbooj', 'tarbuz'] },
  { english: 'Muskmelon', hindi: 'खरबूजा', hinglish: ['kharbooja', 'kharbuja'] },
  { english: 'Pomegranate', hindi: 'अनार', hinglish: ['anaar', 'anar'] },
  { english: 'Guava', hindi: 'अमरूद', hinglish: ['amrood', 'amrud'] },
  { english: 'Pineapple', hindi: 'अनानास', hinglish: ['ananas', 'anaanaas'] },
  { english: 'Coconut', hindi: 'नारियल', hinglish: ['nariyal', 'naariyal', 'copra'] },
  { english: 'Dragon Fruit', hindi: 'ड्रैगन फ्रूट', hinglish: ['dragon fruit', 'pitaya'] },
  { english: 'Chikoo', hindi: 'चीकू', hinglish: ['chikoo', 'chiku', 'sapodilla'] },
  { english: 'Pear', hindi: 'नाशपाती', hinglish: ['nashpati', 'naashpati'] },

  // ── DAIRY & BAKERY ──
  { english: 'Milk', hindi: 'दूध', hinglish: ['doodh', 'dudh', 'dhooth'] },
  { english: 'Curd', hindi: 'दही', hinglish: ['dahi', 'dhaai', 'yogurt'] },
  { english: 'Paneer', hindi: 'पनीर', hinglish: ['paneer', 'cottage cheese', 'panir'] },
  { english: 'Butter', hindi: 'मक्खन', hinglish: ['makkhan', 'makhan', 'maska', 'butter'] },
  { english: 'Ghee', hindi: 'देसी घी', hinglish: ['ghee', 'desi ghee', 'ghee'] },
  { english: 'Cheese', hindi: 'चीज़', hinglish: ['cheese', 'cheez'] },
  { english: 'Bread', hindi: 'ब्रेड / पाव', hinglish: ['bread', 'pav', 'paav', 'double roti'] },
  { english: 'Bun', hindi: 'बन / पाव', hinglish: ['bun', 'pav', 'burger bun'] },
  { english: 'Eggs', hindi: 'अंडे', hinglish: ['anda', 'ande', 'egg'] },
  { english: 'Lassi', hindi: 'लस्सी', hinglish: ['lassi', 'chaas', 'buttermilk'] },

  // ── STAPLES, GRAINS & PULSES ──
  { english: 'Rice', hindi: 'चावल', hinglish: ['chawal', 'chaawal', 'rice', 'basmati'] },
  { english: 'Wheat Flour', hindi: 'गेहूं का आटा', hinglish: ['atta', 'aata', 'gehu atta', 'flour'] },
  { english: 'Maida', hindi: 'मैदा', hinglish: ['maida', 'refined flour'] },
  { english: 'Besan', hindi: 'बेसन', hinglish: ['besan', 'gram flour'] },
  { english: 'Sooji', hindi: 'सूजी / रवा', hinglish: ['sooji', 'suji', 'rawa', 'rava', 'semolina'] },
  { english: 'Poha', hindi: 'पोहा / चूड़ा', hinglish: ['poha', 'chuda', 'flattened rice'] },
  { english: 'Sugar', hindi: 'चीनी / शक्कर', hinglish: ['cheeni', 'chini', 'shakkar', 'bura'] },
  { english: 'Jaggery', hindi: 'गुड़', hinglish: ['gud', 'gur', 'jaggery'] },
  { english: 'Salt', hindi: 'नमक', hinglish: ['namak', 'nimak', 'sendha namak'] },
  { english: 'Cooking Oil', hindi: 'तेल', hinglish: ['tel', 'oil', 'sarson tel', 'mustard oil', 'sunflower oil', 'refined oil'] },
  { english: 'Mustard Oil', hindi: 'सरसों का तेल', hinglish: ['sarson ka tel', 'sarso tel', 'mustard oil'] },

  // ── DALS & PULSES ──
  { english: 'Toor Dal', hindi: 'अरहर / तूर दाल', hinglish: ['toor dal', 'arhar dal', 'tuvar dal'] },
  { english: 'Moong Dal', hindi: 'मूंग दाल', hinglish: ['moong dal', 'mung dal'] },
  { english: 'Chana Dal', hindi: 'चना दाल', hinglish: ['chana dal', 'chana'] },
  { english: 'Urad Dal', hindi: 'उड़द दाल', hinglish: ['urad dal', 'udad dal'] },
  { english: 'Masoor Dal', hindi: 'मसूर दाल', hinglish: ['masoor dal', 'masur dal'] },
  { english: 'Rajma', hindi: 'राजमा', hinglish: ['rajma', 'kidney beans'] },
  { english: 'Chole', hindi: 'छोले / काबुली चना', hinglish: ['chole', 'chhole', 'kabuli chana', 'chickpeas'] },

  // ── SPICES & CONDIMENTS ──
  { english: 'Turmeric', hindi: 'हल्दी', hinglish: ['haldi', 'turmeric powder'] },
  { english: 'Red Chilli Powder', hindi: 'लाल मिर्च पाउडर', hinglish: ['lal mirch', 'laal mirch', 'chilli powder'] },
  { english: 'Coriander Powder', hindi: 'धनिया पाउडर', hinglish: ['dhaniya powder', 'dhania powder'] },
  { english: 'Cumin', hindi: 'जीरा', hinglish: ['jeera', 'zeera', 'cumin seeds'] },
  { english: 'Mustard Seeds', hindi: 'राई / सरसों', hinglish: ['rai', 'sarson', 'mustard seeds'] },
  { english: 'Garam Masala', hindi: 'गरम मसाला', hinglish: ['garam masala'] },
  { english: 'Cardamom', hindi: 'इलायची', hinglish: ['elaichi', 'elachi'] },
  { english: 'Black Pepper', hindi: 'काली मिर्च', hinglish: ['kali mirch', 'kaali mirch'] },
  { english: 'Clove', hindi: 'लौंग', hinglish: ['laung', 'long'] },

  // ── BEVERAGES & SNACKS ──
  { english: 'Tea', hindi: 'चाय पत्ती', hinglish: ['chai', 'chaai', 'tea', 'chai patti', 'tata tea'] },
  { english: 'Coffee', hindi: 'कॉफी', hinglish: ['coffee', 'nescafe', 'bru'] },
  { english: 'Biscuits', hindi: 'बिस्कुट', hinglish: ['biscuit', 'cookies', 'parle g', 'rusk'] },
  { english: 'Noodles', hindi: 'मैगी / नूडल्स', hinglish: ['maggi', 'maggie', 'noodles', 'yippee'] },
  { english: 'Namkeen', hindi: 'नमकीन / भुजिया', hinglish: ['namkeen', 'bhujia', 'sev', 'mixture'] },
  { english: 'Soap', hindi: 'साबुन', hinglish: ['sabun', 'soap', 'bath soap'] },
  { english: 'Detergent', hindi: 'डिटर्जेंट / सर्फ', hinglish: ['surf', 'detergent', 'washing powder', 'surf excel', 'tide', 'ariel'] },
  { english: 'Toothpaste', hindi: 'टूथपेस्ट', hinglish: ['toothpaste', 'colgate', 'pepsodent', 'close up'] }
];

/**
 * Find translation entry by any English, Hindi, or Hinglish query
 */
export const findItemTranslation = (name: string): ItemTranslation | null => {
  if (!name || !name.trim()) return null;
  const q = name.trim().toLowerCase();

  for (const item of ITEM_TRANSLATIONS) {
    if (item.english.toLowerCase() === q || item.hindi === q) return item;
    if (item.english.toLowerCase().includes(q) || q.includes(item.english.toLowerCase())) return item;
    if (item.hindi.includes(q) || q.includes(item.hindi)) return item;
    if (item.hinglish.some(h => h.includes(q) || q.includes(h))) return item;
  }
  return null;
};

/**
 * Get Hindi label for an item (e.g. 'आलू / Aaloo')
 */
export const getHindiSubtitle = (itemName: string): string => {
  const trans = findItemTranslation(itemName);
  if (!trans) return '';
  const primaryHinglish = trans.hinglish[0] ? ` (${trans.hinglish[0]})` : '';
  return `${trans.hindi}${primaryHinglish}`;
};

/**
 * Get Bilingual English + Hindi Label for Categories
 */
export const getCategoryBilingualLabel = (category: string): { en: string; hi: string; combined: string } => {
  if (!category) return { en: 'All', hi: 'सभी', combined: 'All / सभी' };
  const upper = category.trim().toUpperCase();

  if (upper === 'ALL') {
    return { en: 'All', hi: 'सभी', combined: 'All / सभी' };
  }
  if (upper.includes('GROCERY') || upper.includes('KIRANA')) {
    return { en: 'Grocery', hi: 'किराना', combined: 'Grocery / किराना' };
  }
  if (upper.includes('VEGETABLE') || upper.includes('SABZI') || upper.includes('SABJI') || (upper.includes('VEG') && !upper.includes('NON-VEG') && !upper.includes('NON VEG') && !upper.includes('BEV'))) {
    return { en: 'Vegetables', hi: 'सब्जियां', combined: 'Vegetables / सब्जियां' };
  }
  if (upper.includes('FRUIT')) {
    return { en: 'Fruits', hi: 'फल', combined: 'Fruits / फल' };
  }
  if (upper.includes('DAIRY') || upper.includes('MILK') || upper.includes('DOODH')) {
    return { en: 'Dairy', hi: 'डेयरी', combined: 'Dairy / डेयरी' };
  }
  if (upper.includes('BAKERY') || upper.includes('BREAD') || upper.includes('CAKE')) {
    return { en: 'Bakery', hi: 'बेकरी', combined: 'Bakery / बेकरी' };
  }
  if (upper.includes('BEV') || upper.includes('DRINK') || upper.includes('TEA') || upper.includes('COFFEE')) {
    return { en: 'Beverages', hi: 'पेय पदार्थ', combined: 'Beverages / पेय पदार्थ' };
  }
  if (upper.includes('SNACK') || upper.includes('NAMKEEN')) {
    return { en: 'Snacks', hi: 'स्नैक्स', combined: 'Snacks / स्नैक्स' };
  }
  if (upper.includes('SPICE') || upper.includes('MASALA')) {
    return { en: 'Spices', hi: 'मसाले', combined: 'Spices / मसाले' };
  }
  if (upper.includes('PERSONAL') || upper.includes('CARE') || upper.includes('BEAUTY')) {
    return { en: 'Personal Care', hi: 'पर्सनल केयर', combined: 'Personal Care / पर्सनल केयर' };
  }
  if (upper.includes('HOUSEHOLD') || upper.includes('CLEANING')) {
    return { en: 'Household', hi: 'घरेलू सामान', combined: 'Household / घरेलू सामान' };
  }

  return { en: category, hi: '', combined: category };
};

/**
 * Intelligent Bilingual Matcher for search queries (Supports English, Devanagari, and Hinglish)
 */
export const matchesBilingualQuery = (itemName: string, category: string | undefined, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  // 1. Direct name/category match
  if (itemName.toLowerCase().includes(q)) return true;
  if (category && category.toLowerCase().includes(q)) return true;

  // 2. Search against item dictionary
  const trans = findItemTranslation(itemName);
  if (trans) {
    if (trans.hindi.includes(q) || q.includes(trans.hindi)) return true;
    if (trans.english.toLowerCase().includes(q)) return true;
    if (trans.hinglish.some(h => h.includes(q) || q.includes(h))) return true;
  }

  // 3. Reverse lookup if query itself is a translation keyword (e.g. query = "bhindi")
  const queryTrans = findItemTranslation(q);
  if (queryTrans) {
    if (itemName.toLowerCase().includes(queryTrans.english.toLowerCase())) return true;
    if (queryTrans.hinglish.some(h => itemName.toLowerCase().includes(h))) return true;
  }

  return false;
};
