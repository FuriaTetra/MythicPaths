import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, GameState, Language, PlayerStats } from "../types";

// In-memory cache for images to allow instant reuse and pre-loading
const imageCache = new Map<string, string>();

export const populateImageCache = (key: string, data: string) => {
  imageCache.set(key, data);
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Retry helper for Quota Limits
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for Quota Exceeded (429) or Service Unavailable (503)
    if (retries > 0 && (error?.status === 429 || error?.status === 503 || error?.message?.includes('quota'))) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 0. Generate Consistent Character Visuals
export const generateCharacterVisuals = async (
  gender: string,
  charClass: string,
  language: Language
): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  
  let requiredWeapon = "Weapon";
  let armorStyle = "Armor";
  
  // Class specific visual rules
  if (charClass === 'Elf') {
    requiredWeapon = "Elven Longbow and Quiver";
    armorStyle = "Elegant Leather and Leaf-patterned Cloth";
  }
  if (charClass === 'Human') {
    requiredWeapon = "Steel Longsword and Shield";
    armorStyle = "Plate Mail or Chainmail";
  }
  if (charClass === 'Dwarf') {
    requiredWeapon = "Heavy Warhammer";
    armorStyle = "Heavy Iron Plate with Geometric Engravings";
  }
  if (charClass === 'Mage') {
    requiredWeapon = "Glowing Crystal Staff";
    armorStyle = "Ornate Robes with Arcane Sigils";
  }

  const prompt = `
    Generate a rigid, highly specific visual description for a ${gender} ${charClass} fantasy character.
    This description will be used to generate consistent images of the same character throughout a game.
    
    MANDATORY WEAPON REQUIREMENT:
    The character MUST be holding or carrying a ${requiredWeapon}. This is non-negotiable.
    
    MANDATORY CLOTHING REQUIREMENT:
    The character MUST be wearing ${armorStyle}.

    MANDATORY OUTPUT FORMAT:
    "[Hair Style & Color], [Eye Color/Face Feature], wearing [Specific Armor Material & Color scheme], carrying [${requiredWeapon} & details]."
    
    RULES:
    - Be specific about colors (e.g. "crimson cloak", "obsidian plate", "silver braid").
    - Be specific about materials (e.g. "rusty iron", "shining mithril", "tattered leather").
    - Keep it under 35 words.
    - NO flowery language, just visual facts.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || `${gender} ${charClass} with silver hair and ${requiredWeapon}`;
  } catch (e) {
    return `${gender} ${charClass} adventurer with epic gear`;
  }
};

// 1. Main Story Engine
export const generateStorySegment = async (
  history: string[],
  lastChoice: string,
  gameState: GameState,
  language: Language,
  diceRoll?: number // Optional d20 roll result
): Promise<StorySegment> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash"; 
  
  const playerDesc = gameState.player.visualDescription 
    ? `Main Character Visuals (IMMUTABLE): ${gameState.player.visualDescription}` 
    : `Main Character: ${gameState.player.gender} ${gameState.player.class}`;
    
  const isEnding = gameState.turnCount >= 100;

  // Logic for dice roll interpretation
  let rollContext = "";
  if (diceRoll !== undefined) {
    rollContext = `
      ACTION RESOLUTION:
      The player rolled a ${diceRoll} on a d20 (1=Crit Fail, 20=Crit Success).
      - If 1-5: The action fails badly. Damage taken or setback.
      - If 6-10: Marginal failure or success with cost.
      - If 11-15: Success.
      - If 16-19: Great success.
      - If 20: Perfect execution, epic result.
      NARRATE THE OUTCOME BASED ON THIS ROLL.
    `;
  }

  // Class Archetype Rules
  let classRules = "";
  if (gameState.player.class === 'Mage') {
    classRules = "Player is a MAGE. Strong at Ranged Magic, Weak at Melee physical combat. Spells cost MANA. If Mana is 0, magic fails or is weak.";
  } else if (gameState.player.class === 'Elf') {
    classRules = "Player is an ELF. Master of Bow (Ranged) and Agility. Good perception. Frail in heavy melee.";
  } else if (gameState.player.class === 'Dwarf') {
    classRules = "Player is a DWARF. Master of Melee/Hammer. High constitution (Tank). Cannot use Magic. Slow but sturdy.";
  } else {
    classRules = "Player is HUMAN. Versatile, balanced stats. Good with Sword/Shield.";
  }

  const prompt = `
    Role: Dungeon Master. Language: ${language}.
    Protagonist: ${gameState.player.gender} ${gameState.player.class}. ${playerDesc}.
    CLASS TRAITS: ${classRules}
    Turn: ${gameState.turnCount}/100.
    Context: ${history.slice(-3).join("\n")}
    Choice: "${lastChoice}"
    Stats: Health ${gameState.health}/${gameState.maxHealth}, Mana ${gameState.mana}/${gameState.maxMana}.
    ${rollContext}
    
    Instructions:
    - If Turn >= 100, WRITE A CONCLUSIVE EPIC ENDING.
    - Otherwise, write an engaging story segment (100 words).
    - Address the player as "You".
    - IF PLAYER USES MAGIC: Reduce Mana in narration (logic handled later). If Mana is too low, the spell fizzles.
    
    CRITICAL VISUAL RULES (Object Permanence):
    1. **PLAYER**: You MUST include the exact string "${gameState.player.visualDescription}" in the 'visualDescription' output every time the player is visible.
    2. **NPCs**: If an NPC (e.g., "The Old Witch") has appeared before, you MUST Describe them EXACTLY the same way (clothing, face, age).
    3. **ENVIRONMENT**: If the player is still in the same location (e.g., "The Cave"), maintain the visual details (e.g., "wet dripping walls", "blue crystals"). Do not change the environment visuals unless the player moves.
    4. **ITEMS**: If the player is holding a specific item from the inventory, describe it visually.
    
    Output JSON:
    1. text: Story segment.
    2. options: 3 distinct choices (or [] if Turn >= 100).
    3. visualDescription: A detailed prompt for an image generator. 
       - Structure: "SUBJECT: [Player Stats] doing [Action]. COMPANIONS: [NPC Description if present]. SETTING: [Environment Details]. MOOD: [Atmosphere]."
    4. optionVisualPrompts: 3 short visual predictions for the choices (or [] if ending).
    5. environment: One of 'FOREST', 'CAVE', 'TOWN', 'COMBAT', 'DUNGEON', 'OCEAN'.
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualDescription: { type: Type.STRING },
            optionVisualPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
            environment: { type: Type.STRING, enum: ['FOREST', 'CAVE', 'TOWN', 'COMBAT', 'DUNGEON', 'OCEAN'] }
          },
          required: ["text", "options", "visualDescription", "optionVisualPrompts", "environment"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Failed to generate story segment");
    }

    return JSON.parse(response.text) as StorySegment;
  });
};

// 2. Game State Manager
export const updateGameState = async (
  currentNarrative: string,
  currentInventory: string[],
  currentQuest: string,
  currentHealth: number,
  currentMana: number,
  maxHealth: number,
  maxMana: number,
  action?: string, 
  language?: Language
): Promise<Partial<GameState>> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-lite";

  const prompt = `
    Update game status based on story. Lang: ${language || 'English'}
    Story: "${currentNarrative}"
    Action: ${action || "None"}
    Inv: ${JSON.stringify(currentInventory)}
    Quest: "${currentQuest}"
    Stats: HP ${currentHealth}/${maxHealth}, MP ${currentMana}/${maxMana}
    
    Rules:
    - Add/Remove items. Translate new items to ${language}.
    - "Drink Health Potion" -> Remove 'Health Potion', +8 HP.
    - "Drink Mana Potion" -> Remove 'Mana Potion', +15 MP.
    - If Player Casts Spells -> -3 to -5 MP.
    - If Player rests -> Restore HP/MP.
    - Calculate dmg/heal (-1 to -5 or +1 to +5).
    - Caps: HP cannot exceed ${maxHealth}, MP cannot exceed ${maxMana}. Min 0.
    - CRITICAL: Return the FULL inventory list. Do not remove items unless the story explicitly says they are lost, dropped, or consumed.
    
    JSON Output keys: inventory, currentQuest, health, mana.
  `;

  try {
    // Low priority, single retry
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
              currentQuest: { type: Type.STRING },
              health: { type: Type.INTEGER },
              mana: { type: Type.INTEGER }
            },
            required: ["inventory", "currentQuest", "health", "mana"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        return {
          inventory: data.inventory,
          currentQuest: data.currentQuest,
          health: data.health,
          mana: data.mana
        };
      }
      throw new Error("Empty response");
    }, 1, 2000);
  } catch (error) {
    console.error("Error updating game state (non-critical):", error);
    return { inventory: currentInventory, currentQuest, health: currentHealth, mana: currentMana };
  }
};

// 3. Image Generator with Caching
export const generateSceneImage = async (
  description: string,
  useCache: boolean = true,
  characterVisuals?: string, // Pass persistent character traits here
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9"
): Promise<string | null> => {
  
  const cacheKey = `${description.trim().slice(0, 100)}_${aspectRatio}`; 
  
  if (useCache && imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) || null;
  }

  const ai = getAiClient();
  const model = "gemini-2.5-flash-image";
  
  // Strict prompt construction for consistency
  let fullPrompt = description;
  if (characterVisuals) {
    // ENFORCE VISUAL CONSISTENCY
    // We explicitly tell the model that the 'characterVisuals' are the immutable subject.
    fullPrompt = `
      CONSISTENT CHARACTER: ${characterVisuals}.
      SCENE CONTEXT: ${description}.
      
      INSTRUCTIONS:
      1. Render the CONSISTENT CHARACTER exactly as described (hair, armor, weapon).
      2. Place them in the SCENE CONTEXT.
      3. Maintain the clothing and style of the character if they appear in the scene.
    `;
  }

  const stylePrompt = "Cinematic dark fantasy, oil painting, dramatic lighting, 8k resolution, highly detailed, no text, no words, no letters. " + fullPrompt;

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: stylePrompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            // imageSize: "1K" // Optional, 1K is default
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgData = `data:image/png;base64,${part.inlineData.data}`;
          if (useCache) imageCache.set(cacheKey, imgData);
          return imgData;
        }
      }
      return null;
    }, 2, 3000); // Wait longer for image quota
  } catch (e) {
    console.warn("Image generation failed (Quota or Error)", e);
    return null; // Fail gracefully, don't crash app
  }
};

export const preLoadOptionImages = async (prompts: string[]) => {
  // Fire and forget, but with slight staggering to avoid instant rate limit hit
  // OPTIMIZATION: Reduced stagger from 1500ms to 200ms to load images much faster
  // while the user is reading/selecting.
  prompts.forEach((p, i) => {
    setTimeout(() => generateSceneImage(p, true, undefined, "16:9"), i * 200);
  });
};
