import React, { useState, useEffect, useRef } from 'react';
import { 
  Backpack, 
  Loader2,
  Swords,
  Scroll,
  Heart,
  Volume2,
  VolumeX,
  Menu,
  X,
  Globe,
  FlaskConical,
  Save,
  Download,
  Play,
  User,
  Wand2,
  Hammer,
  TreeDeciduous,
  Shield,
  Sparkles,
  RotateCcw,
  Dices,
  MapPin,
  Skull,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateStorySegment, generateSceneImage, updateGameState, preLoadOptionImages, populateImageCache, generateCharacterVisuals } from './services/geminiService';
import { audioService } from './services/audioService';
import { GameState, StoryHistoryItem, ChatMessage, Language, Gender, CharacterClass } from './types';

// Fallback SVG only used if generation fails or is too slow
const FALLBACK_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBzbGljZSI+DQogIDxkZWZzPg0KICAgIDxmaWxsZXIgaWQ9ImZNm9nIj4NCiAgICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAxIiBudW1PY3RhdmVzPSIzIiByZXN1bHQ9Im5vaXNlIi8+DQogICAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwICAwIDEgMCAwIDAgIDAgMCAxIDAgMCAgMCAwIDAgMC40IDAiLz4NCiAgICA8L2ZpbHRlcj4NCiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InNreSIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPg0KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMDUwODEwIi8+DQogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMTAyMDMiLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICA8L2RlZnM+DQogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSJ1cmwoI3NreSkiLz4NCiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTAwIiByPSIxNTAiIGZpbGw9IiMxZTI5M2IiIG9wYWNpdHk9IjAuMiIgZmlsdGVyPSJ1cmwoI2ZvZykiLz4NCiAgPHBhdGggZD0iTTEwMCA2MDAgTDE1MCAzMDAgTDIwMCA2MDAgWiBNMzAwIDYwMCBMMzUwIDI1MCBMNDAwIDYwMCBaIE02MDAgNjAwIEw2NTAgMjgwIEw3MDAgNjAwIFoiIGZpbGw9IiMwMTAxMDEiIC8+DQogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWx0ZXI9InVybCgjZm9nKSIgb3BhY2l0eT0iMC41Ii8+DQogIDxwYXRoIGQ9Ik0tNTAgNjAwIEwwIDIwMCBMNTAgNjAwIFogTTc1MCA2MDAgTDgwMCAyMjAgTDg1MCA2MDAgWiIgZmlsbD0iIzAwMCIgLz4NCjwvc3ZnPg==`;

// Translation Dictionary
const UI_TEXT = {
  English: { 
    title: "MYTHIC", subtitle: "PATHS", vitality: "Vitality", mana: "Mana", inventory: "Inventory", quest: "Quest", empty: "Empty...", ask: "Ask the spirits...", healing: "You drink the potion.", wounded: "You are wounded.", save: "Save Game", load: "Load Game", saved: "Game Saved!", loaded: "Game Loaded!", storageFull: "Storage Full - Saved without images", start: "Start Adventure",
    selLang: "Select Language", selChar: "Create Character", gender: "Gender", class: "Class",
    male: "Male", female: "Female", nonBinary: "Non-Binary", human: "Human", elf: "Elf", dwarf: "Dwarf", mage: "Mage", next: "Next", turn: "Turn", restart: "Play Again", gameOver: "The End",
    combat: "COMBAT!", roll: "Roll D20", rolling: "Rolling...", critical: "CRITICAL HIT!", miss: "MISS!",
    died: "You have fallen...", return: "Return to Menu", character: "Character", equipped: "Equipped"
  },
  Deutsch: { 
    title: "MYTHISCHE", subtitle: "PFADE", vitality: "Vitalität", mana: "Mana", inventory: "Inventar", quest: "Quest", empty: "Leer...", ask: "Frag die Geister...", healing: "Du trinkst den Trank.", wounded: "Du bist verwundet.", save: "Speichern", load: "Laden", saved: "Gespeichert!", loaded: "Geladen!", storageFull: "Speicher voll - Ohne Bilder gespeichert", start: "Abenteuer Starten",
    selLang: "Sprache wählen", selChar: "Charakter erstellen", gender: "Geschlecht", class: "Klasse",
    male: "Männlich", female: "Weiblich", nonBinary: "Nicht-binär", human: "Mensch", elf: "Elf", dwarf: "Zwerg", mage: "Magier", next: "Weiter", turn: "Runde", restart: "Neu spielen", gameOver: "Ende",
    combat: "KAMPF!", roll: "Würfeln", rolling: "Würfelt...", critical: "KRITISCH!", miss: "DANEBEN!",
    died: "Du bist gefallen...", return: "Zum Menü", character: "Charakter", equipped: "Ausgerüstet"
  },
  Français: { 
    title: "VOIES", subtitle: "MYTHIQUES", vitality: "Vitalité", mana: "Mana", inventory: "Inventaire", quest: "Quête", empty: "Vide...", ask: "Demandez aux esprits...", healing: "Vous buvez la potion.", wounded: "Vous êtes blessé.", save: "Sauvegarder", load: "Charger", saved: "Sauvegardé!", loaded: "Chargé!", storageFull: "Stockage plein - Sauvegardé sans images", start: "Commencer l'aventure",
    selLang: "Choisir la langue", selChar: "Créer un personnage", gender: "Genre", class: "Classe",
    male: "Homme", female: "Femme", nonBinary: "Non-binaire", human: "Humain", elf: "Elfe", dwarf: "Nain", mage: "Mage", next: "Suivant", turn: "Tour", restart: "Rejouer", gameOver: "Fin",
    combat: "COMBAT !", roll: "Lancer D20", rolling: "Lancement...", critical: "COUP CRITIQUE !", miss: "RATÉ !",
    died: "Vous êtes tombé...", return: "Retour au Menu", character: "Personnage", equipped: "Équipé"
  },
  Español: { 
    title: "CAMINOS", subtitle: "MÍTICOS", vitality: "Vitalidad", mana: "Maná", inventory: "Inventario", quest: "Misión", empty: "Vacío...", ask: "Pregunta a los espíritus...", healing: "Bebes la poción.", wounded: "Estás herido.", save: "Guardar", load: "Cargar", saved: "¡Guardado!", loaded: "¡Cargado!", storageFull: "Almacenamiento lleno - Guardado sin imágenes", start: "Comenzar Aventura",
    selLang: "Seleccionar idioma", selChar: "Crear personaje", gender: "Género", class: "Clase",
    male: "Hombre", female: "Mujer", nonBinary: "No binario", human: "Humano", elf: "Elfo", dwarf: "Enano", mage: "Mago", next: "Siguiente", turn: "Turno", restart: "Jugar de nuevo", gameOver: "Fin",
    combat: "¡COMBATE!", roll: "Tirar D20", rolling: "Tirando...", critical: "¡CRÍTICO!", miss: "¡FALLO!",
    died: "Has caído...", return: "Volver al Menú", character: "Personaje", equipped: "Equipado"
  },
  Italiano: { 
    title: "SENTIERI", subtitle: "MITICI", vitality: "Vitalità", mana: "Mana", inventory: "Inventario", quest: "Impresa", empty: "Vuoto...", ask: "Chiedi agli spiriti...", healing: "Bevi la pozione.", wounded: "Sei ferito.", save: "Salva Partita", load: "Carica Partita", saved: "Partita Salvata!", loaded: "Partita Caricata!", storageFull: "Memoria piena - Salvato senza immagini", start: "Inizia Avventura",
    selLang: "Scegli la lingua", selChar: "Crea Personaggio", gender: "Sesso", class: "Classe",
    male: "Maschio", female: "Femmina", nonBinary: "Non Binario", human: "Umano", elf: "Elfo", dwarf: "Nano", mage: "Mago", next: "Avanti", turn: "Turno", restart: "Gioca ancora", gameOver: "Fine",
    combat: "COMBATTIMENTO!", roll: "Lancia D20", rolling: "Lancio...", critical: "COLPO CRITICO!", miss: "MANCATO!",
    died: "Sei caduto...", return: "Torna al Menu", character: "Personaggio", equipped: "Equipaggiato"
  },
};

// --- COMPONENTS ---

const PlayerHUD = ({ gameState, portrait, onUseItem, onPortraitClick, t, isHidden }: { gameState: GameState, portrait: string | null, onUseItem: (item: string) => void, onPortraitClick: () => void, t: any, isHidden: boolean }) => {
  // Regex for Health Potions
  const healthPotions = gameState.inventory.filter(i => i.toLowerCase().match(/(healing|curativa|heiltrank|guérison|curación)/));
  // Regex for Mana Potions
  const manaPotions = gameState.inventory.filter(i => i.toLowerCase().match(/(mana|magic|magia|magique|mágico)/));
  
  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 z-[90] flex items-end animate-in slide-in-from-bottom-10 duration-700 pointer-events-none transition-all duration-500 ease-in-out ${isHidden ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}
    >
       {/* pointer-events-none on container, auto on children to allow clicks */}

       <div className="flex items-end gap-3 pointer-events-auto w-full max-w-4xl mx-auto">
         {/* 1. Portrait (Clickable) */}
         <div 
           onClick={onPortraitClick}
           className="relative w-20 h-20 rounded-lg border-2 border-slate-700 overflow-hidden shadow-lg bg-slate-950 shrink-0 group hover:border-amber-500 transition-colors cursor-pointer z-10"
           title="View Character"
          >
            {portrait ? (
               <img src={portrait} alt="Hero" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
               <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                 <User />
               </div>
            )}
            {/* Class Badge */}
            <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center text-amber-500 font-bold uppercase py-0.5">
               {gameState.player.class}
            </div>
         </div>

         {/* 2. Stats Block (Two Rows) */}
         <div className="flex-1 flex flex-col gap-2 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-2xl p-2 pb-2.5 h-20 justify-center">
            
            {/* Row 1: Health (Red) */}
            <div className="flex items-center gap-2 h-9 w-full">
               {/* Potion Button (Red) */}
               {healthPotions.length > 0 ? (
                  <button 
                    onClick={() => onUseItem(healthPotions[0])}
                    className="w-9 h-9 shrink-0 bg-red-900/20 border border-red-900 rounded flex items-center justify-center hover:border-red-500 hover:bg-red-900/40 transition-all relative group"
                    title="Drink Health Potion"
                  >
                     <FlaskConical className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                     <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{healthPotions.length}</span>
                  </button>
               ) : (
                  <div className="w-9 h-9 shrink-0 bg-slate-950/50 border border-slate-800 rounded flex items-center justify-center grayscale opacity-30">
                     <FlaskConical className="w-5 h-5 text-red-600" />
                  </div>
               )}
               
               {/* Health Bar (Fills remaining width) */}
               <div className="flex-1 flex flex-col justify-center h-full">
                  <div className="flex justify-between text-[10px] font-bold text-red-300 uppercase leading-none mb-1 px-1">
                     <span>HP</span>
                     <span>{gameState.health}/{gameState.maxHealth}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50 relative">
                     <div 
                       className={`h-full transition-all duration-500 ease-out ${gameState.health < gameState.maxHealth * 0.3 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-red-700 to-red-500'}`}
                       style={{ width: `${Math.max(0, (gameState.health / gameState.maxHealth) * 100)}%` }}
                     />
                  </div>
               </div>
            </div>

            {/* Row 2: Mana (Blue) */}
            <div className="flex items-center gap-2 h-9 w-full">
               {/* Potion Button (Blue) */}
               {manaPotions.length > 0 ? (
                  <button 
                    onClick={() => onUseItem(manaPotions[0])}
                    className="w-9 h-9 shrink-0 bg-blue-900/20 border border-blue-900 rounded flex items-center justify-center hover:border-blue-500 hover:bg-blue-900/40 transition-all relative group"
                    title="Drink Mana Potion"
                  >
                     <FlaskConical className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                     <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{manaPotions.length}</span>
                  </button>
               ) : (
                  <div className="w-9 h-9 shrink-0 bg-slate-950/50 border border-slate-800 rounded flex items-center justify-center grayscale opacity-30">
                     <FlaskConical className="w-5 h-5 text-blue-600" />
                  </div>
               )}

               {/* Mana Bar (Fills remaining width) */}
               <div className="flex-1 flex flex-col justify-center h-full">
                  <div className="flex justify-between text-[10px] font-bold text-blue-300 uppercase leading-none mb-1 px-1">
                     <span>MP</span>
                     <span>{gameState.mana}/{gameState.maxMana}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50 relative">
                     <div 
                       className="h-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-700 to-blue-500"
                       style={{ width: `${Math.max(0, (gameState.mana / gameState.maxMana) * 100)}%` }}
                     />
                  </div>
               </div>
            </div>

         </div>
       </div>
    </div>
  );
};

const DiceModal = ({ onComplete, t }: { onComplete: (roll: number) => void, t: any }) => {
  const [value, setValue] = useState(1);
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      let count = 0;
      interval = setInterval(() => {
        setValue(Math.floor(Math.random() * 20) + 1);
        count++;
        // Play click sound on each number change
        if (count % 3 === 0) audioService.playClick();
        if (count > 20) {
           clearInterval(interval);
           const finalRoll = Math.floor(Math.random() * 20) + 1;
           setValue(finalRoll);
           setIsRolling(false);
           setTimeout(() => onComplete(finalRoll), 1500); // Show result for 1.5s
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRolling, onComplete]);

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-in zoom-in duration-300">
         <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Swords className="w-6 h-6 text-red-500" /> {t.combat}
         </h2>
         <div className="w-32 h-32 flex items-center justify-center relative">
            <Dices className={`w-32 h-32 absolute opacity-10 ${isRolling ? 'animate-spin' : ''}`} />
            <span className={`text-6xl font-black font-mono z-10 ${value === 20 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,1)]' : value === 1 ? 'text-red-500' : 'text-white'}`}>
              {value}
            </span>
         </div>
         <p className="text-amber-500 font-bold animate-pulse">{isRolling ? t.rolling : (value === 20 ? t.critical : (value === 1 ? t.miss : t.roll))}</p>
      </div>
    </div>
  );
};

const TypingEffect = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setDisplayedText(''); 
    const interval = setInterval(() => {
      const chunk = text.slice(index, index + 3); // Faster typing
      setDisplayedText((prev) => prev + chunk);
      index += 3;
      
      if (Math.random() > 0.85) audioService.playTyping();
      
      if (index >= text.length) {
        clearInterval(interval);
        setDisplayedText(text); 
        if (onComplete) onComplete();
      }
    }, 15); 
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

export default function App() {
  // Config
  const [language, setLanguage] = useState<Language>('Italiano');
  
  // App Steps: 'language' -> 'character' -> 'game'
  const [appStep, setAppStep] = useState<'language' | 'character' | 'game'>('language');
  
  const t = UI_TEXT[language];

  // Game State
  const [history, setHistory] = useState<StoryHistoryItem[]>([]);
  const [currentText, setCurrentText] = useState<string>("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [characterPortrait, setCharacterPortrait] = useState<string | null>(null);
  const [weaponImage, setWeaponImage] = useState<string | null>(null);
  const [nextOptionPrompts, setNextOptionPrompts] = useState<string[]>([]);
  const [initialRealImage, setInitialRealImage] = useState<string | null>(null);
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('FOREST');
  
  // Death State
  const [isDead, setIsDead] = useState(false);
  const [deathImage, setDeathImage] = useState<string | null>(null);

  // Popup State
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  
  // Character Creation State
  const [selectedGender, setSelectedGender] = useState<Gender>('Male');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('Human');
  
  // Combat/Dice State
  const [showDice, setShowDice] = useState(false);
  const [pendingOptionIndex, setPendingOptionIndex] = useState<number | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    inventory: ["Pozione Curativa"],
    currentQuest: "Inizia il viaggio",
    health: 20,
    maxHealth: 20,
    mana: 10,
    maxMana: 10,
    player: { gender: 'Male', class: 'Human' },
    turnCount: 1
  });

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default Music OFF
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSceneRef = useRef<HTMLDivElement>(null);

  // 1. On Mount: Check for saved game AND generate/load realistic initial image
  useEffect(() => {
    // Check saved game
    const savedJson = localStorage.getItem('mythicPathsSave');
    if (savedJson) {
      setAppStep('language'); 
    }

    // Check cached realistic image
    const cachedInitImage = localStorage.getItem('mythic_init_image');
    if (cachedInitImage) {
      setInitialRealImage(cachedInitImage);
    } else {
      // Generate in background so it's ready for start
      const initPrompt = "A photorealistic dark forest at night, fog, ancient trees, cinematic lighting, 8k resolution, highly detailed, mysterious atmosphere, no text";
      generateSceneImage(initPrompt, false, undefined, "16:9")
        .then((img) => {
          if (img) {
            setInitialRealImage(img);
            localStorage.setItem('mythic_init_image', img);
          }
        })
        .catch(err => console.log("Bg generation delayed", err));
    }
  }, []);

  const closePopup = () => {
    setIsPopupVisible(false); // Trigger fade out
    setTimeout(() => {
      setShowImagePopup(false); // Unmount after animation
    }, 500); // Matches CSS transition duration
  };

  // Popup logic: show popup when image changes in game mode, but auto-hide
  useEffect(() => {
    if (currentImage && appStep === 'game' && history.length > 0 && !isDead) {
      setPopupImage(currentImage);
      setShowImagePopup(true);
      
      // Small delay to ensure render happens before adding opacity class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPopupVisible(true);
        });
      });

      const timer = setTimeout(() => {
        closePopup();
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentImage, appStep, history.length, isDead]);

  const resetGame = () => {
    setAppStep('language');
    setIsDead(false);
    setDeathImage(null);
    setHistory([]);
    setCurrentOptions([]);
    setCurrentText("");
    setCurrentImage(null);
    setGameState({ ...gameState, turnCount: 1, health: 20 });
  };

  const handleDeath = async () => {
    setIsDead(true);
    audioService.stopAmbience();
    setIsGenerating(true);
    
    // Generate Death Image
    const deathDesc = `GAME OVER. Tragic scene. The ${gameState.player.gender} ${gameState.player.class} (${gameState.player.visualDescription}) lies defeated on the ground in the ${currentEnvironment}. Dark, somber atmosphere, dramatic lighting.`;
    const img = await generateSceneImage(deathDesc, false, gameState.player.visualDescription, "16:9");
    if (img) setDeathImage(img);
    setIsGenerating(false);
  };

  const startNewGame = async () => {
    setAppStep('game');
    setIsGenerating(true);
    
    // Generate persistent visual description
    const visualDesc = await generateCharacterVisuals(selectedGender, selectedClass, language);

    // Initial Stats & Inventory based on Class Balance
    let initialWeapon = 'Weapon';
    let hp = 20;
    let mp = 10;
    let items = [(language === 'Italiano' ? 'Pozione Curativa' : 'Healing Potion')];
    const manaPotion = (language === 'Italiano' ? 'Pozione di Mana' : 'Mana Potion');

    switch(selectedClass) {
      case 'Elf': 
        initialWeapon = (language === 'Italiano' ? 'Arco Lungo' : 'Longbow'); 
        hp = 18; mp = 20; // Agile, magic capable
        items.push(manaPotion);
        break;
      case 'Human': 
        initialWeapon = (language === 'Italiano' ? 'Spada' : 'Sword');
        hp = 22; mp = 12; // Balanced, durable
        break;
      case 'Dwarf': 
        initialWeapon = (language === 'Italiano' ? 'Martello da Guerra' : 'Warhammer');
        hp = 28; mp = 5; // Very tanky, low magic
        break;
      case 'Mage': 
        initialWeapon = (language === 'Italiano' ? 'Bastone Magico' : 'Magic Staff');
        hp = 14; mp = 35; // Glass cannon, high magic
        items.push(manaPotion); items.push(manaPotion); // Start with extra mana
        break;
      default: 
        initialWeapon = (language === 'Italiano' ? 'Pugnale' : 'Dagger');
        break;
    }
    const initialInventory = [initialWeapon, ...items];

    // Update game state with selected char and description
    const newGameState: GameState = {
      ...gameState,
      inventory: initialInventory,
      player: { 
        gender: selectedGender, 
        class: selectedClass,
        visualDescription: visualDesc
      },
      turnCount: 1,
      health: hp,
      maxHealth: hp,
      mana: mp,
      maxMana: mp,
      currentQuest: (language === 'Italiano' ? "Inizia il viaggio" : "Begin the journey")
    };
    // Ensure state is set before generating
    setGameState(newGameState);

    // Generate Character Portrait using the specific description in 9:16 Aspect Ratio
    const portraitPrompt = `Portrait of a ${selectedGender} ${selectedClass}, ${visualDesc}, fantasy rpg character art, detailed face, upper body, cinematic lighting, oil painting style, no text`;
    generateSceneImage(portraitPrompt, false, undefined, "9:16").then(img => {
      if (img) setCharacterPortrait(img);
    });

    // Generate Weapon Image in 1:1 Aspect Ratio
    const weaponPrompt = `Fantasy RPG icon of a ${initialWeapon}, ${visualDesc} style, magical, sharp, highly detailed, cinematic lighting, 8k, no text, no background`;
    generateSceneImage(weaponPrompt, false, undefined, "1:1").then(img => {
      if (img) setWeaponImage(img);
    });

    // INSTANT START
    setCurrentImage(initialRealImage || FALLBACK_SVG);
    setIsImageLoading(false);
    
    let introText = "";
    switch(language) {
      case 'English': introText = `You stand at the edge of the Whispering Woods. The air is cold and thick with fog.`; break;
      case 'Deutsch': introText = `Du stehst am Rand des Flüsterwaldes. Die Luft ist kalt und dichter Nebel umgibt dich.`; break;
      case 'Français': introText = `Vous vous tenez à l'orée du Bois des Murmures. L'air est froid et le brouillard épais.`; break;
      case 'Español': introText = `Te encuentras al borde del Bosque Susurrante. El aire es frío y hay una niebla espesa.`; break;
      case 'Italiano': introText = `Ti trovi ai margini del Bosco dei Sussurri. L'aria è fredda e una nebbia fitta ti avvolge.`; break;
    }
    
    setCurrentText(introText);
    if (!isMuted) audioService.playEnvironment('FOREST');

    try {
      const segment = await generateStorySegment([], introText, newGameState, language);
      
      setCurrentText(segment.text);
      setCurrentOptions(segment.options);
      setNextOptionPrompts(segment.optionVisualPrompts);
      setCurrentEnvironment(segment.environment);
      
      if (!isMuted) audioService.playEnvironment(segment.environment);

      // Preload next images
      preLoadOptionImages(segment.optionVisualPrompts);
      
    } catch (e) {
      console.error(e);
      showNotification("Error starting story. Retrying...");
      // Fallback
      setCurrentOptions(["Entra nel bosco", "Torna indietro", "Cerca un sentiero"]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Watch for late arrival of initial image
  useEffect(() => {
    if (initialRealImage && currentImage === FALLBACK_SVG && history.length === 0) {
      setCurrentImage(initialRealImage);
    }
  }, [initialRealImage, currentImage, history]);

  // Auto-scroll to start of new scene
  useEffect(() => {
    if (currentSceneRef.current) {
       currentSceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [history.length, currentText]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- SAVE & LOAD ---
  const handleSave = () => {
    try {
      const saveData = {
        language,
        history,
        currentText,
        currentOptions,
        currentImage,
        characterPortrait,
        weaponImage,
        nextOptionPrompts,
        gameState,
        currentEnvironment,
        date: new Date().toISOString()
      };
      
      try {
        localStorage.setItem('mythicPathsSave', JSON.stringify(saveData));
        showNotification(t.saved);
      } catch (e) {
        const slimHistory = history.map(h => ({ ...h, imageUri: undefined }));
        const slimData = { ...saveData, history: slimHistory };
        localStorage.setItem('mythicPathsSave', JSON.stringify(slimData));
        showNotification(t.storageFull);
      }
    } catch (error) {
      showNotification("Error saving game");
    }
  };

  const handleLoad = () => {
    try {
      const savedJson = localStorage.getItem('mythicPathsSave');
      if (!savedJson) {
         showNotification("No save found");
         return;
      }

      const data = JSON.parse(savedJson);
      
      setLanguage(data.language);
      setHistory(data.history);
      setCurrentText(data.currentText);
      setCurrentOptions(data.currentOptions);
      setCurrentImage(data.currentImage);
      setCharacterPortrait(data.characterPortrait);
      setWeaponImage(data.weaponImage);
      setNextOptionPrompts(data.nextOptionPrompts);
      setGameState(data.gameState);
      setCurrentEnvironment(data.currentEnvironment || 'FOREST');
      
      setAppStep('game');
      
      if (data.nextOptionPrompts) {
        preLoadOptionImages(data.nextOptionPrompts);
      }
      showNotification(t.loaded);
      
    } catch (error) {
      showNotification("Error loading game");
    }
  };

  const toggleAudio = () => {
    if (isMuted) {
      audioService.setMusicMute(false);
      setIsMuted(false);
    } else {
      audioService.setMusicMute(true);
      setIsMuted(true);
    }
  };

  const handleChoiceClick = (index: number) => {
     if (isGenerating) return;
     audioService.playClick();
     
     // Check for Combat
     if (currentEnvironment === 'COMBAT') {
        setPendingOptionIndex(index);
        setShowDice(true);
     } else {
        processChoice(index);
     }
  };

  const handleDiceComplete = (roll: number) => {
    setShowDice(false);
    if (pendingOptionIndex !== null) {
      setGameState(prev => ({ ...prev, lastRoll: roll }));
      processChoice(pendingOptionIndex, roll);
      setPendingOptionIndex(null);
    }
  };

  const processChoice = async (index: number, diceRoll?: number) => {
    const choice = currentOptions[index];
    setSelectedOptionIndex(index);
    setIsGenerating(true);

    // Archive
    const newHistoryItem: StoryHistoryItem = {
      text: currentText,
      imageUri: currentImage || undefined,
      selectedOption: choice,
      diceRoll: diceRoll
    };
    
    const nextTurn = gameState.turnCount + 1;

    try {
      const storyContext = [...history, newHistoryItem].slice(-4).map(h => h.text);
      const promptToUse = nextOptionPrompts[index];

      // PARALLEL EXECUTION: Start Text and Image generation simultaneously to save time
      // Use 16:9 for story scenes
      const imagePromise = promptToUse 
          ? generateSceneImage(promptToUse, true, gameState.player.visualDescription, "16:9")
          : Promise.resolve(null);
          
      const textPromise = generateStorySegment(
          storyContext, 
          choice, 
          { ...gameState, turnCount: nextTurn }, 
          language,
          diceRoll
      );

      // Wait for both to be ready
      let [nextImage, segment] = await Promise.all([imagePromise, textPromise]);
      
      // If the pre-calculated image failed or didn't exist, generate one now based on the new description
      if (!nextImage) {
         nextImage = await generateSceneImage(segment.visualDescription, false, gameState.player.visualDescription, "16:9");
      }

      // Update State ATOMICALLY
      setHistory(prev => [...prev, newHistoryItem]);
      setGameState(prev => ({ ...prev, turnCount: nextTurn }));
      setCurrentText(segment.text);
      setCurrentOptions(segment.options);
      setNextOptionPrompts(segment.optionVisualPrompts);
      setCurrentEnvironment(segment.environment);
      if (nextImage) setCurrentImage(nextImage);
      
      if (segment.environment) {
        audioService.playEnvironment(segment.environment);
      }

      // Update Game Stats (background)
      updateGameState(segment.text, gameState.inventory, gameState.currentQuest, gameState.health, gameState.mana, gameState.maxHealth, gameState.maxMana, diceRoll ? `Rolled ${diceRoll}` : undefined, language)
        .then(newState => {
          if (newState) {
            if (newState.health !== undefined && newState.health < gameState.health) audioService.playDamage();
            
            const newHealth = newState.health !== undefined ? newState.health : gameState.health;
            const newMana = newState.mana !== undefined ? newState.mana : gameState.mana;
            
            setGameState(prev => ({
              ...prev,
              inventory: newState.inventory || prev.inventory,
              currentQuest: newState.currentQuest || prev.currentQuest,
              health: newHealth,
              mana: newMana
            }));
            
            if (newHealth <= 0) {
              handleDeath();
            }
          }
        });

      preLoadOptionImages(segment.optionVisualPrompts);

    } catch (error) {
      console.error(error);
      showNotification("The mists of time are thick... (Retrying)");
    } finally {
      setIsGenerating(false);
      setSelectedOptionIndex(null);
    }
  };

  const handleUseItem = async (item: string) => {
    const isHealing = item.toLowerCase().match(/(healing|curativa|heiltrank|guérison|curación)/);
    const isMana = item.toLowerCase().match(/(mana|magic|magia|magique|mágico)/);

    if (isHealing || isMana) {
      audioService.playClick();
      const actionText = isHealing ? t.healing : "You drink the Mana potion.";
      const updateAction = isHealing ? "Drink Health Potion" : "Drink Mana Potion";
      
      const newState = await updateGameState(actionText, gameState.inventory, gameState.currentQuest, gameState.health, gameState.mana, gameState.maxHealth, gameState.maxMana, updateAction, language);
      
      if (newState) {
        setGameState(prev => ({ 
          ...prev, 
          health: newState.health || prev.health, 
          mana: newState.mana || prev.mana,
          inventory: newState.inventory || prev.inventory 
        }));
        showNotification(isHealing ? "+ Health" : "+ Mana");
      }
    }
  };

  // --- SCREEN 1: LANGUAGE SELECT ---
  if (appStep === 'language') {
    return (
      <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans items-center justify-center p-4">
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
           <div className="text-center space-y-2">
             <Swords className="w-12 h-12 text-amber-500 mx-auto mb-4" />
             <h1 className="text-3xl font-bold tracking-widest text-white">MYTHIC<span className="text-amber-500">PATHS</span></h1>
             <p className="text-slate-400">{t.selLang}</p>
           </div>
           
           <div className="grid gap-3">
             {['Italiano', 'English', 'Deutsch', 'Français', 'Español'].map((lang) => (
               <button
                 key={lang}
                 onClick={() => setLanguage(lang as Language)}
                 className={`p-4 rounded-lg border text-left transition-all flex justify-between items-center ${language === lang ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50'}`}
               >
                 <span className="font-medium">{lang}</span>
                 {language === lang && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
               </button>
             ))}
           </div>
           
           <div className="space-y-3 mt-4">
             <button 
                onClick={() => setAppStep('character')}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
             >
               <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
               {t.next}
             </button>
             
             {localStorage.getItem('mythicPathsSave') && (
               <button 
                  onClick={handleLoad}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
               >
                 <Download className="w-4 h-4" />
                 {t.load}
               </button>
             )}
           </div>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: CHARACTER CREATION ---
  if (appStep === 'character') {
    return (
      <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-8 animate-in fade-in slide-in-from-right-10 duration-500">
          
          <div className="text-center">
             <User className="w-10 h-10 text-amber-500 mx-auto mb-2" />
             <h2 className="text-2xl font-bold text-white tracking-wider">{t.selChar}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Gender Selection */}
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm uppercase tracking-widest font-bold border-b border-slate-800 pb-2">{t.gender}</h3>
              <div className="grid grid-cols-3 gap-2">
                 <button 
                   onClick={() => setSelectedGender('Male')}
                   className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedGender === 'Male' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                 >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-bold">{t.male}</span>
                 </button>
                 <button 
                   onClick={() => setSelectedGender('Female')}
                   className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedGender === 'Female' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                 >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-bold">{t.female}</span>
                 </button>
                 <button 
                   onClick={() => setSelectedGender('Non-Binary')}
                   className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedGender === 'Non-Binary' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                 >
                    <Sparkles className="w-6 h-6" />
                    <span className="text-xs font-bold text-center leading-tight">{t.nonBinary}</span>
                 </button>
              </div>
            </div>

            {/* Class Selection */}
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm uppercase tracking-widest font-bold border-b border-slate-800 pb-2">{t.class}</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setSelectedClass('Human')} className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedClass === 'Human' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <Shield className="w-5 h-5 text-amber-500" /> {t.human}
                 </button>
                 <button onClick={() => setSelectedClass('Elf')} className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedClass === 'Elf' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <TreeDeciduous className="w-5 h-5 text-green-500" /> {t.elf}
                 </button>
                 <button onClick={() => setSelectedClass('Dwarf')} className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedClass === 'Dwarf' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <Hammer className="w-5 h-5 text-red-500" /> {t.dwarf}
                 </button>
                 <button onClick={() => setSelectedClass('Mage')} className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedClass === 'Mage' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <Wand2 className="w-5 h-5 text-purple-500" /> {t.mage}
                 </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-4">
             <button 
                onClick={() => setAppStep('language')}
                className="px-6 py-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
             >
                Back
             </button>
             <button 
                onClick={startNewGame}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2 group"
             >
               <Swords className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
               {t.start}
             </button>
          </div>

        </div>
      </div>
    );
  }

  // --- DEATH SCREEN ---
  if (isDead) {
    return (
       <div className="flex h-screen w-full bg-black text-slate-200 font-sans items-center justify-center relative overflow-hidden animate-in fade-in duration-1000">
         {deathImage && (
            <div className="absolute inset-0 z-0">
               <img src={deathImage} alt="Death Scene" className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
         )}
         <div className="relative z-10 text-center flex flex-col items-center gap-8 p-8 max-w-lg">
             <Skull className="w-24 h-24 text-red-600 animate-pulse drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
             <h1 className="text-5xl font-black text-red-600 tracking-widest uppercase">{t.died || "YOU DIED"}</h1>
             <p className="text-slate-300 italic text-lg">"{currentText.slice(0, 100)}..."</p>
             <button 
                onClick={resetGame}
                className="px-8 py-4 bg-red-900/50 hover:bg-red-800 border border-red-700 rounded-lg text-white font-bold uppercase tracking-wider transition-all hover:scale-105"
             >
                {t.return || "Return to Menu"}
             </button>
         </div>
       </div>
    );
  }

  // --- SCREEN 3: MAIN GAME ---
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* DICE MODAL */}
      {showDice && (
        <DiceModal onComplete={handleDiceComplete} t={t} />
      )}

      {/* POPUP IMAGE MODAL */}
      {showImagePopup && popupImage && (
        <div 
           className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 cursor-pointer transition-all duration-500 ease-in-out ${isPopupVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
           onClick={closePopup}
        >
          <img 
            src={popupImage} 
            alt="Scene Reveal" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.5)] border-4 border-amber-900/80 ring-2 ring-amber-500/50"
          />
        </div>
      )}

      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-2 rounded-full shadow-lg z-[100] animate-in fade-in slide-in-from-top-5">
          {notification}
        </div>
      )}

      {/* NEW: Player HUD (Fixed Bottom Left) */}
      <PlayerHUD 
         gameState={gameState} 
         portrait={characterPortrait} 
         onUseItem={handleUseItem}
         onPortraitClick={() => {
            setPopupImage(characterPortrait);
            setShowImagePopup(true);
            requestAnimationFrame(() => setIsPopupVisible(true));
         }}
         t={t}
         isHidden={isMobileMenuOpen}
      />

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 flex items-center justify-between px-4 shadow-lg">
         <div className="flex items-center gap-2 flex-1 overflow-hidden">
             <Scroll className="w-4 h-4 text-amber-500 shrink-0" />
             <span className="text-sm font-medium text-slate-200 truncate">
               {gameState.currentQuest} <span className="text-amber-500/80 text-xs">({gameState.turnCount}/100)</span>
             </span>
         </div>
         <div className="flex items-center gap-3 shrink-0">
            <button onClick={toggleAudio} className="text-slate-400">
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-amber-500">
               <Backpack className="w-6 h-6" />
            </button>
         </div>
      </div>

      {/* LEFT: Main Story Area */}
      <main className="flex-1 flex flex-col h-full relative pt-16 md:pt-0">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-slate-800 bg-slate-900/50 items-center justify-between px-6 backdrop-blur-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppStep('language')}>
              <Swords className="text-amber-500 w-6 h-6" />
              <h1 className="text-xl font-bold tracking-wider text-slate-100">{t.title}<span className="text-amber-500">{t.subtitle}</span></h1>
            </div>
            {/* Quest in Header */}
            <div className="flex items-center gap-2 pl-6 border-l border-slate-700/50 text-amber-500/80">
               <MapPin className="w-4 h-4" />
               <span className="text-sm font-medium tracking-wide text-slate-300 italic">
                  "{gameState.currentQuest}" <span className="text-amber-500 not-italic ml-2">[{gameState.turnCount}/100]</span>
               </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={toggleAudio}
               className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-amber-500"
             >
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
             </button>
          </div>
        </header>

        {/* Story Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 scroll-smooth pb-32" // Added extra padding bottom for HUD
        >
          {/* History */}
          {history.map((item, idx) => (
            <div key={idx} className="opacity-60 hover:opacity-100 transition-opacity duration-500 border-l-2 border-slate-800 pl-4 md:pl-6 pb-8">
              {item.imageUri && (
                <img 
                  src={item.imageUri} 
                  alt="Past scene" 
                  className="w-full max-w-md h-32 md:h-48 object-cover rounded-lg mb-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer border-2 border-slate-700"
                  onClick={() => {
                    setPopupImage(item.imageUri!);
                    setShowImagePopup(true);
                    requestAnimationFrame(() => setIsPopupVisible(true));
                  }}
                />
              )}
              {item.diceRoll && (
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-amber-500">
                  <Dices className="w-3 h-3" />
                  Roll: {item.diceRoll}
                </div>
              )}
              <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Current Scene */}
          <div 
            ref={currentSceneRef}
            className="min-h-[50vh] flex flex-col gap-6 animate-in fade-in duration-700 scroll-mt-32"
          >
            
            {/* Main Image */}
            <div className="w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-4 border-amber-900/80 ring-1 ring-amber-500/50 relative shadow-2xl transition-all duration-500 group">
              {isImageLoading && !currentImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-10 backdrop-blur-sm">
                   <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              )}
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt="Current Scene" 
                  className="w-full h-full object-cover transition-all duration-1000 cursor-pointer"
                  onClick={() => {
                    setPopupImage(currentImage);
                    setShowImagePopup(true);
                    requestAnimationFrame(() => setIsPopupVisible(true));
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-black">
                   <span className="animate-pulse">...</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed drop-shadow-md min-h-[100px]">
               {isGenerating && !currentText ? (
                 <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating story...
                 </div>
               ) : (
                 <TypingEffect text={currentText} />
               )}
            </div>
            
            {/* Options */}
            <div className="grid gap-3 mt-4 mb-24">
              {gameState.turnCount >= 100 && !isGenerating ? (
                 <button
                    onClick={() => setAppStep('language')}
                    className="p-6 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-center flex flex-col items-center gap-2 animate-pulse"
                 >
                    <span className="text-xl">{t.gameOver}</span>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                       <RotateCcw className="w-4 h-4" /> {t.restart}
                    </div>
                 </button>
              ) : (
                currentOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoiceClick(idx)}
                    disabled={isGenerating}
                    className={`group relative px-6 py-4 rounded-lg text-left transition-all duration-200 overflow-hidden border
                      ${selectedOptionIndex === idx 
                        ? 'bg-amber-900/40 border-amber-500 ring-1 ring-amber-500 animate-pulse' 
                        : isGenerating 
                          ? 'bg-slate-900/20 border-slate-800 opacity-50 cursor-not-allowed' 
                          : 'bg-slate-900/40 hover:bg-amber-900/20 border-slate-700 hover:border-amber-500/50'
                      }`}
                  >
                    {/* Progress Bar for selected option */}
                    {selectedOptionIndex === idx && (
                      <div 
                        className="absolute bottom-0 left-0 h-1.5 bg-amber-500 transition-all ease-linear"
                        style={{ 
                          width: isGenerating ? '100%' : '0%',
                          transitionDuration: '5000ms' // 5s simulated load time (max)
                        }} 
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className={`relative z-10 font-medium tracking-wide flex justify-between items-center ${selectedOptionIndex === idx ? 'text-amber-200' : 'text-slate-300 group-hover:text-amber-100'}`}>
                      <span>{idx + 1}. {option}</span>
                      {currentEnvironment === 'COMBAT' && (
                        <Dices className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-80 border-l border-slate-800 bg-slate-900 flex-col shadow-2xl z-20">
         <SidebarContent 
           gameState={gameState} 
           portrait={characterPortrait}
           weaponImage={weaponImage}
           t={t} 
           onSave={handleSave}
           onLoad={handleLoad}
         />
      </aside>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col md:hidden animate-in fade-in slide-in-from-right-10">
          <div className="p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
             <h2 className="text-xl font-bold text-amber-500">{t.inventory}</h2>
             <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
               <X className="w-8 h-8" />
             </button>
          </div>
          {/* Fix: Use flex-1 overflow-hidden relative to allow SidebarContent to handle scroll */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
             <SidebarContent 
               gameState={gameState} 
               portrait={characterPortrait}
               weaponImage={weaponImage}
               t={t} 
               onSave={() => { handleSave(); setIsMobileMenuOpen(false); }}
               onLoad={() => { handleLoad(); setIsMobileMenuOpen(false); }}
              />
          </div>
        </div>
      )}
    </div>
  );
}

const SidebarContent = ({ gameState, portrait, weaponImage, t, onSave, onLoad }: { gameState: GameState, portrait: string | null, weaponImage: string | null, t: any, onSave: () => void, onLoad: () => void }) => {
  // Regex for Health Potions
  const healthPotions = gameState.inventory.filter(i => i.toLowerCase().match(/(healing|curativa|heiltrank|guérison|curación)/));
  // Regex for Mana Potions
  const manaPotions = gameState.inventory.filter(i => i.toLowerCase().match(/(mana|magic|magia|magique|mágico)/));

  return (
  <>
    <div className="flex-1 overflow-y-auto pb-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      
      {/* 1. Weapon Section (Prominent) */}
      <div className="p-6 border-b border-slate-800 flex flex-col items-center">
         <h2 className="font-bold uppercase tracking-widest text-xs text-amber-500 mb-4 self-start">{t.equipped}</h2>
         {/* Changed aspect ratio to aspect-square (1:1) as requested */}
         <div className="w-full aspect-square bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl relative group">
           {weaponImage ? (
             <img src={weaponImage} alt="Weapon" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-600">
                <Swords className="w-12 h-12" />
             </div>
           )}
           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
             <div className="text-white font-bold text-lg">{gameState.inventory[0] || "Unarmed"}</div>
           </div>
         </div>
      </div>

      {/* 2. Character Stats Section (Box Personaggio) */}
      <div className="p-6 border-b border-slate-800">
         <h2 className="font-bold uppercase tracking-widest text-xs text-amber-500 mb-3">{t.character}</h2>
         <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 flex flex-col gap-4">
            
            {/* Top: Portrait + Class Info */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-24 bg-slate-900 rounded border border-slate-700 shrink-0 overflow-hidden relative">
                     {portrait ? (
                        <img src={portrait} alt="Portrait" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <User className="w-6 h-6" />
                        </div>
                     )}
                </div>
                <div>
                   <div className="text-amber-500 font-bold uppercase text-sm">{gameState.player.class}</div>
                   <div className="text-slate-400 text-xs">{gameState.player.gender}</div>
                   <div className="text-slate-500 text-[10px] mt-1">Lvl {Math.floor(gameState.turnCount / 10) + 1}</div>
                </div>
            </div>

            {/* Bottom: Stats Bars & Potions */}
            <div className="space-y-3 pt-2 border-t border-slate-700/30">
                {/* HP Row */}
                <div className="flex items-center gap-3">
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-red-300 uppercase mb-1">
                         <span>HP</span>
                         <span>{gameState.health}/{gameState.maxHealth}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                         <div style={{width: `${Math.max(0, (gameState.health/gameState.maxHealth)*100)}%`}} className="h-full bg-red-600" />
                      </div>
                   </div>
                   <div className="relative group">
                       <FlaskConical className="w-4 h-4 text-red-500" />
                       <span className="absolute -top-2 -right-2 text-[9px] bg-red-900 text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center border border-red-700">
                          {healthPotions.length}
                       </span>
                   </div>
                </div>

                {/* MP Row */}
                 <div className="flex items-center gap-3">
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-blue-300 uppercase mb-1">
                         <span>MP</span>
                         <span>{gameState.mana}/{gameState.maxMana}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                         <div style={{width: `${Math.max(0, (gameState.mana/gameState.maxMana)*100)}%`}} className="h-full bg-blue-500" />
                      </div>
                   </div>
                   <div className="relative group">
                       <FlaskConical className="w-4 h-4 text-blue-500" />
                       <span className="absolute -top-2 -right-2 text-[9px] bg-blue-900 text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center border border-blue-700">
                          {manaPotions.length}
                       </span>
                   </div>
                </div>
            </div>
         </div>
      </div>

    </div>
  </>
)};