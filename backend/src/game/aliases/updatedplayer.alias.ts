export type UpdatedPlayer = {
	// Updated position: returned only if cheat occured
	new_position: number | null,

	// Updated position of enemy
	enemy_position: number,
	enemy_velocity: number
};
