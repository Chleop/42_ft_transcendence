import { Client } from './';

export type UpdatedPlayer = {

	// Client socket id
	client_id: Client;

	// Updated position: returned only if cheat occured
	new_position: number | undefined,

	// Updated position of enemy
	enemy_position: number,
	enemy_velocity: number
}
