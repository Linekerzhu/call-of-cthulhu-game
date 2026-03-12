/**
 * Global Type Definitions for Call of Cthulhu Game
 */

declare global {
    // ----------------------------------------------------------------------
    // Game Core State
    // ----------------------------------------------------------------------
    interface IPlayerState {
        hp: number;
        maxHp: number;
        sanity: number;
        maxSanity: number;
        sanityLevel: number;
        energy: number;
        maxEnergy: number;
        baseMaxEnergy: number;
        defense: number;
        badge: string | null;
        madnessMutations: string[];
        
        deck: ICard[];
        drawPile: ICard[];
        discardPile: ICard[];
        hand: ICard[];
        
        position: {
            row: number;
            col: number;
        };
        facing: number;
    }

    interface ICombatState {
        grid: IGridCell[][];
        enemies: IEnemy[];
        turnCount: number;
        phase: 'COMBAT_START' | 'TURN_START' | 'PLAYER_ACTION' | 'TURN_END' | 'ENEMY_ACTION' | 'COMBAT_END';
    }

    interface IGameState {
        screen: 'title' | 'badge-select' | 'map' | 'combat' | 'event' | 'shop' | 'game-over' | 'victory';
        player: IPlayerState;
        map: IMapNode[];
        currentMapNode: number;
        depth: number;
        combat: ICombatState | null;
    }

    // ----------------------------------------------------------------------
    // Entities
    // ----------------------------------------------------------------------
    interface IEnemy {
        id: string;
        name: string;
        type: string;
        icon: string;
        hp: number;
        maxHp: number;
        defense: number;
        speed: number;
        
        position: {
            row: number;
            col: number;
        };
        
        intent: {
            type: 'attack' | 'defend' | 'buff' | 'debuff' | 'flee' | 'summon' | 'special';
            value: number;
            target?: any;
        };
        
        patterns: Array<(enemy: IEnemy, player: IPlayerState, combat: ICombatState) => void>;
        patternIndex: number;
        remainingActions: number;
    }

    interface IEnemyTemplate {
        id: string;
        name: string;
        icon: string;
        hp?: number;
        hpRange?: [number, number];
        defense?: number;
        speed: number;
        actions: number;
        patterns: Array<(enemy: IEnemy, player: IPlayerState, combat: ICombatState) => void>;
        deathEffect?: (enemy: IEnemy, player: IPlayerState, combat: ICombatState) => void;
    }

    // ----------------------------------------------------------------------
    // Map & Environment
    // ----------------------------------------------------------------------
    interface IMapNode {
        id: number;
        type: 'combat' | 'elite' | 'boss' | 'event' | 'shop' | 'rest' | 'start';
        visited: boolean;
        connectedTo: number[];
        data?: any;
    }

    interface IGridCell {
        row: number;
        col: number;
        terrain: 'normal' | 'obstacle' | 'water' | 'mud' | 'abyss' | 'blood' | 'fire';
        entity: any; 
    }

    // ----------------------------------------------------------------------
    // Cards & Badges
    // ----------------------------------------------------------------------
    interface ICard {
        id: string;
        name: string;
        type: 'attack' | 'skill' | 'power' | 'curse' | 'status' | 'movement' | 'sanity';
        rarity: 'starter' | 'common' | 'uncommon' | 'rare' | 'special';
        forbiddenTier?: number;  // 1-5 禁忌等级
        cost: number;
        description: string;
        range?: number;
        
        effects: Array<{
            type: string;
            [key: string]: any;
        }>;
        
        isConsumable?: boolean;
        isEthereal?: boolean;
        unplayable?: boolean;
        retain?: boolean;
    }

    interface IBadge {
        id: string;
        name: string;
        description: string;
        icon: string;
        startingCards: string[];
        stats: {
            hpBonus?: number;
            energyBonus?: number;
            sanity?: number;
        };
    }

    interface IShopItem {
        id: string;
        type: 'card' | 'relic' | 'service';
        name?: string;
        description?: string;
        price: number;
        effect?: (player: IPlayerState) => void;
    }

    interface IShopData {
        items: {
            services: IShopItem[];
        };
        generateShop: (badge: string) => IShopItem[];
        buyItem: (player: IPlayerState, item: IShopItem) => boolean;
    }

    // ----------------------------------------------------------------------
    // Buff System
    // ----------------------------------------------------------------------
    interface IBuff {
        id: string;
        name: string;
        description: string;
        duration: number; // -1 for infinite
        value: number;
        stacks: number;
        type: 'buff' | 'debuff' | 'special';
        isPermanent: boolean;
        
        onApply?: (target: any, source: any) => void;
        onRemove?: (target: any) => void;
        onTurnStart?: (target: any) => void;
        onTurnEnd?: (target: any) => void;
        onAttack?: (attacker: any, defender: any, damage: number) => void;
        onDefend?: (defender: any, attacker: any, damage: number) => void;
    }

    interface IBuffConfig {
        name: string;
        description?: string;
        duration?: number;
        value?: number;
        stacks?: number;
        type?: 'buff' | 'debuff' | 'special';
        isPermanent?: boolean;
        
        onApply?: (target: any, source: any) => void;
        onRemove?: (target: any) => void;
        onTurnStart?: (target: any) => void;
        onTurnEnd?: (target: any) => void;
        onAttack?: (attacker: any, defender: any, damage: number) => void;
        onDefend?: (defender: any, attacker: any, damage: number) => void;
    }
}

export {};
