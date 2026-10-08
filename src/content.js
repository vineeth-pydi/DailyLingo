export const languages = [
  { id: 'es', name: 'Spanish', native: 'Español', locale: 'es-419', short: 'ES', color: '#eee3ff', ink: '#7553a3', greeting: 'Hola', description: 'Everyday Spanish, with regional notes.', direction: 'ltr' },
  { id: 'en', name: 'English', native: 'English', locale: 'en-US', short: 'EN', color: '#dce9fc', ink: '#3c6ba0', greeting: 'Hello', description: 'Useful phrases for everyday connection.', direction: 'ltr' },
  { id: 'zh', name: 'Mandarin', native: '普通话', locale: 'zh-CN', short: 'ZH', color: '#ffe3da', ink: '#b74b31', greeting: '你好', description: 'Standard Mandarin with simplified characters.', direction: 'ltr' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', locale: 'hi-IN', short: 'HI', color: '#ffedce', ink: '#946414', greeting: 'नमस्ते', description: 'Standard Hindi in Devanagari.', direction: 'ltr' },
  { id: 'ar', name: 'Arabic', native: 'العربية', locale: 'ar', short: 'AR', color: '#dceee7', ink: '#36765e', greeting: 'مرحبًا', description: 'Modern Standard Arabic; spoken dialects come later.', direction: 'rtl' }
];

// Original starter content, MIT licensed. Each row aligns a communicative idea,
// not a promise of literal equivalence across languages. Native review is pending.
// Order: ID, English, Spanish, Mandarin, Hindi, Arabic, Pinyin, Hindi aid, Arabic aid.
const rows = [
  ['hello', 'Hello', 'Hola', '你好', 'नमस्ते', 'مرحبًا', 'Nǐ hǎo', 'Namaste', 'Marḥaban'],
  ['thanks', 'Thank you', 'Gracias', '谢谢', 'धन्यवाद', 'شكرًا', 'Xièxie', 'Dhanyavād', 'Shukran'],
  ['please', 'Please', 'Por favor', '请', 'कृपया', 'من فضلك', 'Qǐng', 'Kṛpayā', 'Min faḍlik'],
  ['goodbye', 'Goodbye', 'Adiós', '再见', 'अलविदा', 'إلى اللقاء', 'Zàijiàn', 'Alvidā', 'Ilā al-liqāʾ'],
  ['good-morning', 'Good morning', 'Buenos días', '早上好', 'सुप्रभात', 'صباح الخير', 'Zǎoshang hǎo', 'Suprabhāt', 'Ṣabāḥ al-khayr'],
  ['how-are-you', 'How are you?', '¿Cómo estás?', '你好吗？', 'आप कैसे हैं?', 'كيف حالك؟', 'Nǐ hǎo ma?', 'Āp kaise haiṃ?', 'Kayfa ḥāluk?'],
  ['my-name', 'My name is Sam', 'Me llamo Sam', '我叫山姆', 'मेरा नाम सैम है', 'اسمي سام', 'Wǒ jiào Shānmǔ', 'Merā nām Saim hai', 'Ismī Sām'],
  ['your-name', 'What is your name?', '¿Cómo te llamas?', '你叫什么名字？', 'आपका नाम क्या है?', 'ما اسمك؟', 'Nǐ jiào shénme míngzi?', 'Āpkā nām kyā hai?', 'Mā ismuk?'],
  ['friend', 'A friend', 'Un amigo', '一个朋友', 'एक दोस्त', 'صديق', 'Yí ge péngyou', 'Ek dost', 'Ṣadīq'],
  ['family', 'My family', 'Mi familia', '我的家人', 'मेरा परिवार', 'عائلتي', 'Wǒ de jiārén', 'Merā parivār', 'ʿĀʾilatī'],
  ['nice-meet', 'Nice to meet you', 'Mucho gusto', '很高兴认识你', 'आपसे मिलकर खुशी हुई', 'سعيد بلقائك', 'Hěn gāoxìng rènshi nǐ', 'Āpse milkar khuśī huī', 'Saʿīd biliqāʾik'],
  ['where-from', 'Where are you from?', '¿De dónde eres?', '你来自哪里？', 'आप कहाँ से हैं?', 'من أين أنت؟', 'Nǐ láizì nǎlǐ?', 'Āp kahāṃ se haiṃ?', 'Min ayna ant?'],
  ['water', 'Water', 'Agua', '水', 'पानी', 'ماء', 'Shuǐ', 'Pānī', 'Māʾ'],
  ['tea', 'Tea', 'Té', '茶', 'चाय', 'شاي', 'Chá', 'Chāy', 'Shāy'],
  ['bread', 'Bread', 'Pan', '面包', 'ब्रेड', 'خبز', 'Miànbāo', 'Breḍ', 'Khubz'],
  ['menu', 'The menu, please', 'El menú, por favor', '请给我菜单', 'कृपया मेनू दीजिए', 'القائمة من فضلك', 'Qǐng gěi wǒ càidān', 'Kṛpayā menū dījie', 'Al-qāʾima min faḍlik'],
  ['delicious', 'This is delicious', 'Esto está delicioso', '这个很好吃', 'यह स्वादिष्ट है', 'هذا لذيذ', 'Zhège hěn hǎochī', 'Yah svādiṣṭ hai', 'Hādhā ladhīdh'],
  ['bill', 'The bill, please', 'La cuenta, por favor', '请结账', 'कृपया बिल दीजिए', 'الحساب من فضلك', 'Qǐng jiézhàng', 'Kṛpayā bil dījie', 'Al-ḥisāb min faḍlik'],
  ['station', 'Where is the station?', '¿Dónde está la estación?', '车站在哪里？', 'स्टेशन कहाँ है?', 'أين المحطة؟', 'Chēzhàn zài nǎlǐ?', 'Sṭeśan kahāṃ hai?', 'Ayna al-maḥaṭṭa?'],
  ['left', 'Turn left', 'Gira a la izquierda', '向左转', 'बाएँ मुड़िए', 'انعطف يسارًا', 'Xiàng zuǒ zhuǎn', 'Bāeṃ muṛie', 'Inʿaṭif yasāran'],
  ['right', 'Turn right', 'Gira a la derecha', '向右转', 'दाएँ मुड़िए', 'انعطف يمينًا', 'Xiàng yòu zhuǎn', 'Dāeṃ muṛie', 'Inʿaṭif yamīnan'],
  ['ticket', 'One ticket, please', 'Un billete, por favor', '请给我一张票', 'कृपया एक टिकट दीजिए', 'تذكرة واحدة من فضلك', 'Qǐng gěi wǒ yì zhāng piào', 'Kṛpayā ek ṭikaṭ dījie', 'Tadhkira wāḥida min faḍlik'],
  ['price', 'How much does it cost?', '¿Cuánto cuesta?', '多少钱？', 'इसकी कीमत कितनी है?', 'كم الثمن؟', 'Duōshao qián?', 'Iskī qīmat kitnī hai?', 'Kam ath-thaman?'],
  ['bathroom', 'Where is the bathroom?', '¿Dónde está el baño?', '洗手间在哪里？', 'शौचालय कहाँ है?', 'أين الحمام؟', 'Xǐshǒujiān zài nǎlǐ?', 'Śaucālay kahāṃ hai?', 'Ayna al-ḥammām?'],
  ['today', 'Today', 'Hoy', '今天', 'आज', 'اليوم', 'Jīntiān', 'Āj', 'Al-yawm'],
  ['tomorrow', 'Tomorrow', 'Mañana', '明天', 'कल', 'غدًا', 'Míngtiān', 'Kal', 'Ghadan'],
  ['home', 'I am at home', 'Estoy en casa', '我在家', 'मैं घर पर हूँ', 'أنا في البيت', 'Wǒ zài jiā', 'Maiṃ ghar par hūṃ', 'Anā fī al-bayt'],
  ['work', 'I am going to work', 'Voy al trabajo', '我去上班', 'मैं काम पर जा रहा हूँ', 'أنا ذاهب إلى العمل', 'Wǒ qù shàngbān', 'Maiṃ kām par jā rahā hūṃ', 'Anā dhāhib ilā al-ʿamal'],
  ['time', 'What time is it?', '¿Qué hora es?', '现在几点？', 'अभी कितने बजे हैं?', 'كم الساعة؟', 'Xiànzài jǐ diǎn?', 'Abhī kitne baje haiṃ?', 'Kam as-sāʿa?'],
  ['later', 'See you later', 'Hasta luego', '回头见', 'फिर मिलेंगे', 'أراك لاحقًا', 'Huítóu jiàn', 'Phir mileṃge', 'Arāka lāḥiqan'],
  ['help', 'I need help', 'Necesito ayuda', '我需要帮助', 'मुझे मदद चाहिए', 'أحتاج إلى مساعدة', 'Wǒ xūyào bāngzhù', 'Mujhe madad cāhie', 'Aḥtāj ilā musāʿada'],
  ['understand', 'I do not understand', 'No entiendo', '我不明白', 'मैं नहीं समझता', 'لا أفهم', 'Wǒ bù míngbai', 'Maiṃ nahīṃ samajhtā', 'Lā afham'],
  ['repeat', 'Please repeat', 'Repite, por favor', '请再说一遍', 'कृपया फिर से कहिए', 'كرر من فضلك', 'Qǐng zài shuō yí biàn', 'Kṛpayā phir se kahie', 'Karrir min faḍlik'],
  ['slowly', 'Please speak slowly', 'Habla despacio, por favor', '请说慢一点', 'कृपया धीरे बोलिए', 'تكلم ببطء من فضلك', 'Qǐng shuō màn yìdiǎn', 'Kṛpayā dhīre bolie', 'Takallam bibuṭʾ min faḍlik'],
  ['sorry', 'I am sorry', 'Lo siento', '对不起', 'मुझे माफ़ कीजिए', 'أنا آسف', 'Duìbuqǐ', 'Mujhe māf kījie', 'Anā āsif'],
  ['yes-no', 'Yes / No', 'Sí / No', '是 / 不是', 'हाँ / नहीं', 'نعم / لا', 'Shì / Bú shì', 'Hāṃ / Nahīṃ', 'Naʿam / Lā']
];

export const concepts = rows.map(([id, en, es, zh, hi, ar, pinyin, hindi, arabic]) => ({ id, forms: { en, es, zh, hi, ar }, aids: { zh: pinyin, hi: hindi, ar: arabic } }));

export const units = [
  { id: 'greetings', title: 'Start with hello', subtitle: 'Small words. Meaningful connections.', icon: 'wave', ids: rows.slice(0, 6).map(r => r[0]), goal: 'Greet someone and show courtesy.', note: 'Say each phrase aloud, then listen again. A little repetition goes a long way.' },
  { id: 'people', title: 'Meet your people', subtitle: 'Names, friends, and first conversations.', icon: 'people', ids: rows.slice(6, 12).map(r => r[0]), goal: 'Introduce yourself and ask about someone.', note: 'The sample name is Sam. Gender and politeness forms can vary; these phrases use the forms shown, rather than all possible variants.' },
  { id: 'food', title: 'A seat at the table', subtitle: 'Order something good.', icon: 'cup', ids: rows.slice(12, 18).map(r => r[0]), goal: 'Ask for a menu and finish a simple order.', note: 'Spanish “billete” is used for a travel ticket; “boleto” is common in much of Latin America. Hindi “ब्रेड” here means sliced/loaf bread rather than all breads.' },
  { id: 'travel', title: 'Find your way', subtitle: 'A little more confidence, wherever you go.', icon: 'compass', ids: rows.slice(18, 24).map(r => r[0]), goal: 'Ask directions, prices, and for a ticket.', note: 'Our starter phrases prioritize recognition. Requests and directions may have different politeness forms in everyday speech.' },
  { id: 'daily', title: 'Everyday moments', subtitle: 'Home, work, and the plans in between.', icon: 'sun', ids: rows.slice(24, 30).map(r => r[0]), goal: 'Talk about simple daily situations.', note: 'Hindi “कल” can mean yesterday or tomorrow depending on context. “I am going to work” uses a masculine Hindi/Arabic example here; gender variants will expand after review.' },
  { id: 'help', title: 'Keep the conversation going', subtitle: 'Ask, clarify, and try again.', icon: 'chat', ids: rows.slice(30, 36).map(r => r[0]), goal: 'Ask for help or a slower explanation.', note: 'Mandarin yes/no answers often repeat the relevant verb. “是 / 不是” means “is / is not” and is not a universal yes/no translation. Arabic uses MSA throughout this starter course.' }
];

export const findLanguage = id => languages.find(language => language.id === id);
export const findConcept = id => concepts.find(concept => concept.id === id);
export const findUnit = id => units.find(unit => unit.id === id);
