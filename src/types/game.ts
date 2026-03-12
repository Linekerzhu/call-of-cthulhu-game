export interface IPlayerState {
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    baseMaxEnergy: number;
    movement: number;
    maxMovement: number;
    agility: number;
    block: number;
    sanity: number;
    maxSanity: number;
    madness: number;
    sanityLevel: number;
    madnessMutations: string[];
    deck: any[];
    hand: any[];
    drawPile: any[];
    discardPile: any[];
    position: { row: number, col: number };
    badge: string | null;
}

export interface IMapNode {
    id: number;
    type: string;
    parents: number[];
    children: number[];
    visited: boolean;
    available: boolean;
    isHard: boolean;
    icon: string;
}

export interface IMapState {
    floor: number;
    nodes: IMapNode[];
    currentNode: number;
    branches: any[];
}

export interface ICombatState {
    type: string;
    turn: number;
    phase: string;
    grid: any[][];
    enemies: any[];
    log: string[];
    madnessTriggered?: boolean;
    madnessPenalty?: boolean;
    turnPlayedCards?: number;
    ancientRunes?: number;
    lastTurnBlock?: number;
    blockGainedThisTurn?: number;
    madnessDoubler?: number;
    active?: boolean;
    ended?: boolean;
}

export interface ICardEffect {
    type: string;
    value?: number;
    range?: number;
    duration?: number;
    chance?: number;
    summon?: string;
    _mutated?: boolean;
    [key: string]: any;
}

export interface ICard {
    id: string;
    name: string;
    type: 'attack' | 'skill' | 'power' | 'movement';
    cost: number;
    description: string;
    effects?: ICardEffect[];
    rarity: 'basic' | 'common' | 'uncommon' | 'rare';
    forbiddenTier?: number;  // 1-5 禁忌等级
    exhaust?: boolean;
    needsTarget?: boolean;
    targetType?: 'enemy' | 'empty' | 'self';
    mutated?: boolean;
    originalName?: string;
    upgrade?: any;
    upgraded?: boolean;
    [key: string]: any;
}

export interface IEnemy {
    id: string;
    name: string;
    type: string;
    hp: number;
    maxHp: number;
    icon: string;
    speed?: number;
    attackRange?: number;
    actions?: number;
    remainingActions?: number;
    strength?: number;
    sanityDrain?: number;
    intent?: { type: string, value: number };
    [key: string]: any;
}

export interface IBadge {
    id: string;
    name: string;
    icon: string;
    description: string;
    startingCards?: string[];
    [key: string]: any;
}
