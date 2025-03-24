export function calculateCharacterStats(character) {
  // Basic character stats calculation
  return {
    health: character.baseHealth + (character.level * 10),
    attack: character.baseAttack + (character.level * 2),
    defense: character.baseDefense + (character.level * 1),
  };
}

export function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

export function calculateCombatResult(attacker, defender) {
  const attackRoll = rollDice();
  const defenseRoll = rollDice();
  
  return {
    success: attackRoll > defenseRoll,
    damage: attackRoll > defenseRoll ? attacker.attack - defender.defense : 0,
  };
} 