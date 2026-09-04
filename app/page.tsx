'use client';

import { PitchDetector } from 'pitchy';
import { useEffect, useRef, useState } from 'react';
import {
  createPluckedString,
  matchPitchToString,
  median,
  PitchMatch,
  TuningString,
} from '@/lib/tuner';

type Language = 'RU' | 'KZ';
type TuningId = 'on' | 'teris' | 'qalys' | 'shalys' | 'tel';
type MicError = '' | 'denied' | 'unavailable' | 'failed';

type Tuning = {
  id: TuningId;
  name: string;
  notes: string;
  interval: Record<Language, string>;
  summary: Record<Language, string>;
  description: Record<Language, string>;
  strings: [TuningString, TuningString];
};

const TUNINGS: Tuning[] = [
  {
    id: 'on',
    name: 'Оң бұрау',
    notes: 'D3 · G3',
    interval: { RU: 'Чистая кварта', KZ: 'Таза кварта' },
    summary: { RU: 'Основной современный строй', KZ: 'Негізгі заманауи бұрау' },
    description: {
      RU: 'Самый распространённый учебный и концертный строй. Подходит для большинства современных переложений и привычной аппликатуры.',
      KZ: 'Ең кең тараған оқу және концерттік бұрау. Қазіргі өңдеулердің көбі мен үйреншікті саусақ басуға қолайлы.',
    },
    strings: [
      { id: 'lower', label: 'II', note: 'D3', frequency: 146.83 },
      { id: 'upper', label: 'I', note: 'G3', frequency: 196 },
    ],
  },
  {
    id: 'teris',
    name: 'Теріс бұрау',
    notes: 'C3 · G3',
    interval: { RU: 'Чистая квинта', KZ: 'Таза квинта' },
    summary: { RU: 'Открытый, широкий резонанс', KZ: 'Кең әрі ашық резонанс' },
    description: {
      RU: 'Один из двух основных традиционных типов. Квинта создаёт широкий бурдон и особое пространство для старинного репертуара.',
      KZ: 'Дәстүрлі негізгі екі бұраудың бірі. Квинта көне репертуарға тән кең бурдондық үн береді.',
    },
    strings: [
      { id: 'lower', label: 'II', note: 'C3', frequency: 130.81 },
      { id: 'upper', label: 'I', note: 'G3', frequency: 196 },
    ],
  },
  {
    id: 'qalys',
    name: 'Қалыс бұрау',
    notes: 'E3 · G3',
    interval: { RU: 'Терция', KZ: 'Терция' },
    summary: { RU: 'Редкий исторический вариант', KZ: 'Сирек тарихи нұсқа' },
    description: {
      RU: 'Близкий по звучанию строй с мягким напряжением между струнами. Встречается реже и требует сверки с традицией конкретного произведения.',
      KZ: 'Ішектер арасында жұмсақ кернеу тудыратын бұрау. Сирек кездеседі, сондықтан нақты күй дәстүрімен салыстырған дұрыс.',
    },
    strings: [
      { id: 'lower', label: 'II', note: 'E3', frequency: 164.81 },
      { id: 'upper', label: 'I', note: 'G3', frequency: 196 },
    ],
  },
  {
    id: 'shalys',
    name: 'Шалыс бұрау',
    notes: 'F3 · G3',
    interval: { RU: 'Большая секунда', KZ: 'Үлкен секунда' },
    summary: { RU: 'Плотное, напряжённое звучание', KZ: 'Тығыз, кернеулі дыбыс' },
    description: {
      RU: 'Струны расположены близко по высоте. Такой строй даёт характерные созвучия и сегодня используется преимущественно в специальном репертуаре.',
      KZ: 'Ішектердің биіктігі бір-біріне жақын. Ерекше үндестік береді және бүгінде көбіне арнайы репертуарда қолданылады.',
    },
    strings: [
      { id: 'lower', label: 'II', note: 'F3', frequency: 174.61 },
      { id: 'upper', label: 'I', note: 'G3', frequency: 196 },
    ],
  },
  {
    id: 'tel',
    name: 'Тел бұрау',
    notes: 'G3 · G3',
    interval: { RU: 'Унисон', KZ: 'Унисон' },
    summary: { RU: 'Обе струны в одну высоту', KZ: 'Екі ішек бір биіктікте' },
    description: {
      RU: 'Обе открытые струны звучат в унисон. Редкий тембровый вариант для отдельных пьес и исполнительских приёмов.',
      KZ: 'Екі ашық ішек бір дыбыста үндеседі. Жеке шығармалар мен орындаушылық тәсілдерге арналған сирек нұсқа.',
    },
    strings: [
      { id: 'lower', label: 'II', note: 'G3', frequency: 196 },
      { id: 'upper', label: 'I', note: 'G3', frequency: 196 },
    ],
  },
];

const COPY = {
  RU: {
    navigation: 'Основная навигация', tuner: 'Тюнер', tunings: 'Строи', guide: 'Как настроить',
    switchLanguage: 'Қазақ тіліне ауыстыру', eyebrow: 'Онлайн-тюнер для домбры',
    headline: 'Точный строй.', headlineAccent: 'Чистое звучание.',
    intro: 'Настройте обе струны на слух или по микрофону. Сервис покажет, когда звук ниже, выше или точно попадает в ноту.',
    chooseTuning: 'Выберите строй', variants: 'вариантов', micOff: 'Микрофон выключен',
    micOn: 'Микрофон слушает', upper: 'Струна I · верхняя', lower: 'Струна II · нижняя', both: 'Обе струны',
    readyLabel: 'Готов к настройке', ready: 'Сыграйте открытую струну',
    listeningLabel: 'Слушаем инструмент', listening: 'Сыграйте струну ещё раз',
    tunedLabel: 'Точно настроено', tuned: 'Можно переходить к другой струне',
    flatLabel: 'Звук ниже цели', flat: 'Плавно подтяните струну',
    sharpLabel: 'Звук выше цели', sharp: 'Немного ослабьте струну',
    start: 'Включить микрофон', stop: 'Остановить тюнер',
    privacy: 'Звук обрабатывается только на вашем устройстве',
    reference: 'Звуковой эталон', playReference: 'Воспроизвести эталон', playing: 'Звучит',
    lowerString: 'Нижняя струна', upperString: 'Верхняя струна',
    noRegistration: 'Без регистрации', browser: 'Работает в браузере', privateAudio: 'Аудио не загружается', free: 'Бесплатно',
    guideEyebrow: 'Три спокойных шага', guideTitle: 'Настройте домбру без спешки',
    guideIntro: 'Лучший результат получается в тихой комнате: держите домбру близко к микрофону и извлекайте звук по одной открытой струне.',
    step1: 'Выберите бұрау', step1Text: 'Сначала уточните строй произведения или рекомендацию преподавателя.',
    step2: 'Сыграйте одну струну', step2Text: 'Дайте ей прозвучать свободно, не прижимая лад. Не играйте обе струны одновременно.',
    step3: 'Поверните колок', step3Text: 'Если звук ниже — подтяните струну. Если выше — ослабьте. Повторите медленно.',
    atlasEyebrow: 'Справочник', atlasTitle: 'Пять традиционных типов строя',
    atlasIntro: 'Названия описывают интервальное соотношение струн. Абсолютная высота могла меняться под голос, инструмент и исполнительскую школу.',
    selected: 'Выбран', useTuning: 'Выбрать этот строй', interval: 'Интервал',
    regionTitle: 'Регион и манера исполнения',
    regionText: 'Не стоит жёстко привязывать один строй к одному региону. Западные төкпе и центрально-восточные шертпе школы отличаются корпусом инструмента, репертуаром и манерой звукоизвлечения, но варианты строя пересекаются. Для архивного күй лучше свериться с записью или педагогом.',
    calibration: 'Калибровка A4 = 440 Hz', sourceTitle: 'Основа справочника', sourceText: 'Названия интервалов сверены с учебными и культурными материалами Казахстана.',
    openSource: 'Open source распознавание', method: 'Pitchy · McLeod Pitch Method · MIT',
    denied: 'Доступ к микрофону запрещён. Разрешите его в настройках браузера и попробуйте снова.',
    unavailable: 'В этом браузере недоступен микрофон. Откройте сайт по HTTPS в современном браузере.',
    failed: 'Не удалось запустить микрофон. Проверьте, не используется ли он другим приложением.',
  },
  KZ: {
    navigation: 'Негізгі навигация', tuner: 'Тюнер', tunings: 'Бұраулар', guide: 'Қалай келтіреді',
    switchLanguage: 'Переключить на русский язык', eyebrow: 'Домбыраға арналған онлайн-тюнер',
    headline: 'Дәл бұрау.', headlineAccent: 'Таза дыбыс.',
    intro: 'Екі ішекті микрофон немесе есту арқылы келтіріңіз. Сервис дыбыстың төмен, жоғары немесе нотаға дәл түскенін көрсетеді.',
    chooseTuning: 'Бұрауды таңдаңыз', variants: 'нұсқа', micOff: 'Микрофон өшірулі',
    micOn: 'Микрофон тыңдап тұр', upper: 'I ішек · жоғарғы', lower: 'II ішек · төменгі', both: 'Екі ішек те',
    readyLabel: 'Келтіруге дайын', ready: 'Ашық ішекті шертіңіз',
    listeningLabel: 'Аспапты тыңдап тұрмыз', listening: 'Ішекті қайта шертіңіз',
    tunedLabel: 'Дәл келтірілді', tuned: 'Екінші ішекке өтуге болады',
    flatLabel: 'Дыбыс төмен', flat: 'Ішекті жайлап қатайтыңыз',
    sharpLabel: 'Дыбыс жоғары', sharp: 'Ішекті сәл босатыңыз',
    start: 'Микрофонды қосу', stop: 'Тюнерді тоқтату',
    privacy: 'Дыбыс тек сіздің құрылғыңызда өңделеді',
    reference: 'Дыбыс эталоны', playReference: 'Эталонды ойнату', playing: 'Ойналып тұр',
    lowerString: 'Төменгі ішек', upperString: 'Жоғарғы ішек',
    noRegistration: 'Тіркелусіз', browser: 'Браузерде жұмыс істейді', privateAudio: 'Аудио жүктелмейді', free: 'Тегін',
    guideEyebrow: 'Үш қарапайым қадам', guideTitle: 'Домбыраны асықпай келтіріңіз',
    guideIntro: 'Тыныш бөлмеде нәтиже жақсырақ болады: домбыраны микрофонға жақын ұстап, әр ашық ішекті жеке шертіңіз.',
    step1: 'Бұрауды таңдаңыз', step1Text: 'Алдымен шығарманың бұрауын немесе ұстаздың нұсқауын анықтаңыз.',
    step2: 'Бір ішекті шертіңіз', step2Text: 'Пернені баспай, ішекті еркін дыбыстатыңыз. Екі ішекті бір уақытта шертпеңіз.',
    step3: 'Құлақты бұраңыз', step3Text: 'Дыбыс төмен болса — ішекті қатайтыңыз. Жоғары болса — босатыңыз. Баяу қайталаңыз.',
    atlasEyebrow: 'Анықтамалық', atlasTitle: 'Бұраудың бес дәстүрлі түрі',
    atlasIntro: 'Атаулар ішектердің интервалдық қатынасын білдіреді. Нақты дыбыс биіктігі дауысқа, аспапқа және орындаушылық мектепке қарай өзгеруі мүмкін.',
    selected: 'Таңдалды', useTuning: 'Осы бұрауды таңдау', interval: 'Интервал',
    regionTitle: 'Өңір және орындау мәнері',
    regionText: 'Бір бұрауды бір ғана өңірге қатаң байламаған дұрыс. Батыстың төкпе және орталық-шығыстың шертпе мектептері аспап пішіні, репертуар және дыбыс шығару мәнерімен ерекшеленеді, бірақ бұрау түрлері тоғысады. Архивтік күй үшін жазбамен немесе ұстазбен салыстырыңыз.',
    calibration: 'Калибрлеу A4 = 440 Hz', sourceTitle: 'Анықтамалық негізі', sourceText: 'Интервал атаулары Қазақстанның оқу және мәдени материалдарымен салыстырылды.',
    openSource: 'Open source тану жүйесі', method: 'Pitchy · McLeod Pitch Method · MIT',
    denied: 'Микрофонға рұқсат берілмеді. Браузер баптауынан рұқсат беріп, қайта көріңіз.',
    unavailable: 'Бұл браузерде микрофон қолжетімсіз. Сайтты HTTPS арқылы заманауи браузерде ашыңыз.',
    failed: 'Микрофонды іске қосу мүмкін болмады. Оны басқа қолданба пайдаланып тұрмағанын тексеріңіз.',
  },
} as const;

type MicSession = {
  context: AudioContext;
  stream: MediaStream;
  animationFrame: number;
};

type ReferenceSession = {
  context: AudioContext;
  source: AudioBufferSourceNode;
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('RU');
  const [selectedTuning, setSelectedTuning] = useState<TuningId>('on');
  const [isListening, setIsListening] = useState(false);
  const [detected, setDetected] = useState<(PitchMatch & { clarity: number }) | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [micError, setMicError] = useState<MicError>('');
  const [referenceString, setReferenceString] = useState<'upper' | 'lower' | null>(null);
  const micSessionRef = useRef<MicSession | null>(null);
  const referenceRef = useRef<ReferenceSession | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const lastSignalAtRef = useRef(0);
  const lastPaintAtRef = useRef(0);
  const selected = TUNINGS.find((tuning) => tuning.id === selectedTuning) ?? TUNINGS[0];
  const selectedRef = useRef(selected);
  const t = COPY[language];

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const stopTuner = () => {
    const session = micSessionRef.current;
    if (session) {
      cancelAnimationFrame(session.animationFrame);
      session.stream.getTracks().forEach((track) => track.stop());
      void session.context.close();
    }
    micSessionRef.current = null;
    pitchHistoryRef.current = [];
    setIsListening(false);
    setDetected(null);
    setInputLevel(0);
  };

  useEffect(() => () => {
    const micSession = micSessionRef.current;
    if (micSession) {
      cancelAnimationFrame(micSession.animationFrame);
      micSession.stream.getTracks().forEach((track) => track.stop());
      void micSession.context.close();
    }
    const referenceSession = referenceRef.current;
    if (referenceSession) {
      referenceSession.source.stop();
      void referenceSession.context.close();
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === 'RU' ? 'KZ' : 'RU';
      document.documentElement.lang = next === 'KZ' ? 'kk' : 'ru';
      return next;
    });
  };

  const chooseTuning = (id: TuningId) => {
    setSelectedTuning(id);
    setDetected(null);
    pitchHistoryRef.current = [];
  };

  const startTuner = async () => {
    if (isListening) {
      stopTuner();
      return;
    }

    setMicError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('unavailable');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      const context = new AudioContext();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const highPass = context.createBiquadFilter();
      const lowPass = context.createBiquadFilter();
      const analyser = context.createAnalyser();
      highPass.type = 'highpass';
      highPass.frequency.value = 65;
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 1200;
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(highPass).connect(lowPass).connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(analyser.fftSize);
      const session: MicSession = { context, stream, animationFrame: 0 };
      micSessionRef.current = session;
      lastSignalAtRef.current = 0;
      setIsListening(true);

      const analyse = (timestamp: number) => {
        if (micSessionRef.current !== session) return;
        analyser.getFloatTimeDomainData(input);
        let energy = 0;
        for (let index = 0; index < input.length; index += 1) energy += input[index] ** 2;
        const rms = Math.sqrt(energy / input.length);
        const level = Math.min(1, rms * 16);
        const [pitch, clarity] = detector.findPitch(input, context.sampleRate);

        if (rms > .006 && clarity > .72 && pitch >= 65 && pitch <= 1000) {
          pitchHistoryRef.current.push(pitch);
          if (pitchHistoryRef.current.length > 7) pitchHistoryRef.current.shift();
          const stablePitch = median(pitchHistoryRef.current);
          const match = matchPitchToString(stablePitch, selectedRef.current.strings);
          lastSignalAtRef.current = timestamp;

          if (match && timestamp - lastPaintAtRef.current > 65) {
            setDetected({ ...match, clarity });
            setInputLevel(level);
            lastPaintAtRef.current = timestamp;
          }
        } else if (timestamp - lastPaintAtRef.current > 90) {
          setInputLevel(level);
          lastPaintAtRef.current = timestamp;
          if (timestamp - lastSignalAtRef.current > 900) {
            setDetected(null);
            pitchHistoryRef.current = [];
          }
        }

        session.animationFrame = requestAnimationFrame(analyse);
      };

      session.animationFrame = requestAnimationFrame(analyse);
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      setMicError(denied ? 'denied' : 'failed');
      stopTuner();
    }
  };

  const playReference = async (string: TuningString) => {
    if (referenceRef.current) {
      referenceRef.current.source.stop();
      void referenceRef.current.context.close();
      referenceRef.current = null;
    }

    const context = new AudioContext();
    await context.resume();
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = createPluckedString(context, string.frequency);
    filter.type = 'lowpass';
    filter.frequency.value = 2600;
    filter.Q.value = .65;
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.34, context.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + 2.7);
    source.connect(filter).connect(gain).connect(context.destination);
    referenceRef.current = { context, source };
    setReferenceString(string.id);
    source.onended = () => {
      if (referenceRef.current?.source === source) referenceRef.current = null;
      setReferenceString(null);
      void context.close();
    };
    source.start();
  };

  const fallbackTarget = selected.strings[1];
  const shown = detected ?? { target: fallbackTarget, cents: 0, frequency: fallbackTarget.frequency, clarity: 0 };
  const cents = Math.max(-50, Math.min(50, shown.cents));
  const absCents = Math.abs(shown.cents);
  const tunerState = !isListening || !detected
    ? 'idle'
    : absCents <= 4
      ? 'tuned'
      : shown.cents < 0
        ? 'flat'
        : 'sharp';
  const stateCopy = {
    idle: [isListening ? t.listeningLabel : t.readyLabel, isListening ? t.listening : t.ready],
    tuned: [t.tunedLabel, t.tuned],
    flat: [t.flatLabel, t.flat],
    sharp: [t.sharpLabel, t.sharp],
  }[tunerState];
  const currentStringLabel = selected.id === 'tel'
    ? t.both
    : shown.target.id === 'upper' ? t.upper : t.lower;

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Dombra Tuner">
          <span className="brand-sign">DT</span>
          <span>Dombra Tuner</span>
        </a>
        <nav aria-label={t.navigation}>
          <a className="active" href="#tuner">{t.tuner}</a>
          <a href="#tunings">{t.tunings}</a>
          <a href="#guide">{t.guide}</a>
        </nav>
        <button className="language" type="button" onClick={toggleLanguage} aria-label={t.switchLanguage}>
          {language} <span>↻</span>
        </button>
      </header>

      <section className="hero" id="tuner">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {t.eyebrow}</p>
          <h1>{t.headline}<br /><em>{t.headlineAccent}</em></h1>
          <p className="intro">{t.intro}</p>

          <div className="tuning-picker" id="tunings">
            <div className="picker-heading"><span>{t.chooseTuning}</span><small>{TUNINGS.length} {t.variants}</small></div>
            {TUNINGS.map((tuning, index) => (
              <button
                key={tuning.id}
                className={selectedTuning === tuning.id ? 'selected' : ''}
                type="button"
                onClick={() => chooseTuning(tuning.id)}
                aria-pressed={selectedTuning === tuning.id}
              >
                <span className="tuning-index">0{index + 1}</span>
                <span className="tuning-name"><strong>{tuning.name}</strong><small>{tuning.summary[language]}</small></span>
                <span className="tuning-notes">{tuning.notes}</span>
                <span className="tuning-check">✓</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`tuner-card ${tunerState}`}>
          <div className="card-topline">
            <span><i /> {isListening ? t.micOn : t.micOff}</span>
            <strong>{selected.name} · {selected.notes}</strong>
          </div>

          <div className="meter">
            <div className="meter-labels"><span>−50</span><span>−25</span><span>0</span><span>+25</span><span>+50</span></div>
            <div className="meter-scale">
              {Array.from({ length: 41 }, (_, index) => <i key={index} className={index === 20 ? 'center' : ''} />)}
            </div>
            <span className="needle" style={{ left: `${cents + 50}%` }} />
            <div className="pitch">
              <small>{currentStringLabel}</small>
              <div><strong>{shown.target.note.slice(0, -1)}</strong><sup>{shown.target.note.slice(-1)}</sup></div>
              <span>{detected ? shown.frequency.toFixed(2) : shown.target.frequency.toFixed(2)} Hz</span>
              <b>{detected ? `${shown.cents > 0 ? '+' : ''}${shown.cents.toFixed(1)} cent` : '—'}</b>
            </div>
            <div className="input-level" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => <i key={index} className={inputLevel * 14 > index ? 'active' : ''} />)}
            </div>
          </div>

          <div className="tuner-state">
            <span className="state-mark">{tunerState === 'tuned' ? '✓' : tunerState === 'flat' ? '↑' : tunerState === 'sharp' ? '↓' : '◎'}</span>
            <div><small>{stateCopy[0]}</small><strong>{stateCopy[1]}</strong></div>
          </div>

          {micError && <p className="mic-error" role="alert">{t[micError]}</p>}

          <div className="reference-box">
            <div><span>{t.reference}</span><small>{t.calibration}</small></div>
            <div className="reference-actions">
              {selected.strings.map((string) => (
                <button
                  key={string.id}
                  type="button"
                  onClick={() => void playReference(string)}
                  aria-label={`${t.playReference}: ${string.note}`}
                  className={referenceString === string.id ? 'playing' : ''}
                >
                  <span>{referenceString === string.id ? '■' : '▶'}</span>
                  <b>{string.id === 'lower' ? t.lowerString : t.upperString}</b>
                  <strong>{string.note}</strong>
                </button>
              ))}
            </div>
          </div>

          <button className="start-button" type="button" onClick={() => void startTuner()}>
            <span className="mic-icon">{isListening ? '■' : '●'}</span>
            <span>{isListening ? t.stop : t.start}</span>
            <span>↗</span>
          </button>
          <p className="privacy">{t.privacy}</p>
        </div>
      </section>

      <section className="trust-row" aria-label="Features">
        <span>{t.noRegistration}</span><i /><span>{t.browser}</span><i /><span>{t.privateAudio}</span><i /><span>{t.free}</span>
      </section>

      <section className="guide-section" id="guide">
        <div className="section-heading">
          <p className="eyebrow"><span /> {t.guideEyebrow}</p>
          <h2>{t.guideTitle}</h2>
          <p>{t.guideIntro}</p>
        </div>
        <div className="steps-grid">
          {[
            [t.step1, t.step1Text],
            [t.step2, t.step2Text],
            [t.step3, t.step3Text],
          ].map(([title, text], index) => (
            <article key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="atlas-section">
        <div className="atlas-heading">
          <div>
            <p className="eyebrow"><span /> {t.atlasEyebrow}</p>
            <h2>{t.atlasTitle}</h2>
          </div>
          <p>{t.atlasIntro}</p>
        </div>
        <div className="atlas-grid">
          {TUNINGS.map((tuning, index) => (
            <article className={selectedTuning === tuning.id ? 'active' : ''} key={tuning.id}>
              <div className="atlas-top"><span>0{index + 1}</span><small>{selectedTuning === tuning.id ? t.selected : tuning.interval[language]}</small></div>
              <h3>{tuning.name}</h3>
              <strong>{tuning.notes}</strong>
              <p>{tuning.description[language]}</p>
              <button type="button" onClick={() => { chooseTuning(tuning.id); document.getElementById('tuner')?.scrollIntoView(); }}>
                {t.useTuning} <span>↗</span>
              </button>
            </article>
          ))}
        </div>
        <aside className="region-note">
          <span className="region-mark">DT</span>
          <div><small>{t.regionTitle}</small><p>{t.regionText}</p></div>
        </aside>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-sign">DT</span><div><strong>Dombra Tuner</strong><small>{t.openSource}</small></div></div>
        <div className="footer-method"><span>{t.method}</span><a href="https://github.com/ianprime0509/pitchy" target="_blank" rel="noreferrer">GitHub ↗</a></div>
        <div className="footer-source"><small>{t.sourceTitle}</small><span>{t.sourceText}</span><a href="https://kaznui.edu.kz/content/86/2026/%D0%A2%D0%BE%D2%9B%D1%82%D0%B0%D2%93%D0%B0%D0%BD%20%D0%90.%D0%95.%2C%20%D0%A2%D0%BE%D2%9B%D1%82%D0%B0%D2%93%D0%B0%D0%BD%20%D0%90.%D0%90..pdf" target="_blank" rel="noreferrer">KazNUI ↗</a></div>
      </footer>
    </main>
  );
}
