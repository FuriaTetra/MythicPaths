
export type Language = 'English' | 'Deutsch' | 'Français' | 'Español' | 'Italiano';

export type Gender = 'Male' | 'Female' | 'Non-Binary';
export type CharacterClass = 'Human' | 'Elf' | 'Dwarf' | 'Mage';

export interface PlayerStats {
  gender: Gender;
  class: CharacterClass;
  visualDescription?: string; // Persistent visual traits (hair, armor, etc.)
}

export interface StorySegment {
  text: string;
  options: string[];
  visualDescription: string;
  optionVisualPrompts: string[]; 
  environment: 'FOREST' | 'CAVE' | 'TOWN' | 'COMBAT' | 'DUNGEON' | 'OCEAN' | 'mysterious';
}

export interface GameState {
  inventory: string[];
  currentQuest: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  player: PlayerStats;
  turnCount: number;
  lastRoll?: number; // Result of the last d20 roll
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export interface StoryHistoryItem {
  text: string;
  imageUri?: string;
  selectedOption?: string;
  healthChange?: number;
  diceRoll?: number;
}
