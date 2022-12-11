/* Defines client infos */
export type Client = {

	// Their user infos etc: bound to become an object (decoded jwt)
	id: string,
	
	// The associated socket.id
	socket_id: string
};

