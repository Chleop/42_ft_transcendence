import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { StateType } from "@prisma/client";
import {
	FriendRequestAlreadySentError,
	FriendRequestNotFoundError,
	FriendRequestSelfAcceptError,
	FriendRequestSelfRejectError,
	FriendRequestSelfSendError,
} from "src/friend_request/error";
import { UserAlreadyFriendError, UserNotFoundError } from "src/user/error";

@Injectable()
export class FriendRequestService {
	private _prisma: PrismaService;

	constructor() {
		this._prisma = new PrismaService();
	}

	/**
	 * @brief	Make two users become friends, allowing them to :
	 * 			- see each other's status
	 * 			- see each other's channels
	 * 			- see each other's friends
	 * 			- see each other's games history
	 * 			- challenge each other without passing by a channel
	 * 			- spectating each other's games without passing by a channel
	 * 			- invite each other to a channel without passing by a channel
	 * 			It is assumed that the two users exist and are not already friends.
	 * 			Also remove every related pendingFriendRequest.
	 *
	 * @param	user_id0 The id of the first user.
	 * @param	user_id1 The id of the second user.
	 *
	 * @return	An empty promise.
	 */
	private async _make_two_become_friends(user_id0: string, user_id1: string): Promise<void> {
		console.log("Making two users become friends...");
		await this._prisma.user.update({
			data: {
				friends: {
					connect: {
						id: user_id1,
					},
				},
				pendingFriendRequests: {
					disconnect: {
						id: user_id1,
					},
				},
			},
			where: {
				idAndState: {
					id: user_id0,
					state: StateType.ACTIVE,
				},
			},
		});
		await this._prisma.user.update({
			data: {
				friends: {
					connect: {
						id: user_id0,
					},
				},
				pendingFriendRequests: {
					disconnect: {
						id: user_id0,
					},
				},
			},
			where: {
				idAndState: {
					id: user_id1,
					state: StateType.ACTIVE,
				},
			},
		});
		console.log("Two users are now friends.");
	}

	/**
	 * @brief	Make an user accept a pending friend request from another user.
	 * 			Both of the users must be active, and not be the same.
	 *
	 * @param	accepting_user_id The id of the user accepting the friend request.
	 * @param	accepted_user_id The id of the user that sent the friend request.
	 * @param	accepting_user The user accepting the friend request. (optional)
	 * @param	accepted_user The user that sent the friend request. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- FriendRequestSelfAcceptError
	 * 			- UserAlreadyFriendError
	 * 			- FriendRequestNotFoundError
	 *
	 * @return	An empty promise.
	 */
	public async accept_one(
		accepting_user_id: string,
		accepted_user_id: string,
		accepting_user?: {
			friends: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
		accepted_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!accepting_user) {
			console.log("Searching for accepting user...");
			accepting_user = await this._prisma.user.findUnique({
				select: {
					friends: {
						select: {
							id: true,
						},
					},
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: accepting_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!accepting_user) {
				throw new UserNotFoundError(accepting_user_id);
			}
		}

		if (!accepted_user) {
			console.log("Searching for accepted user...");
			accepted_user = await this._prisma.user.findUnique({
				select: {
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: accepted_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!accepted_user) {
				throw new UserNotFoundError(accepted_user_id);
			}
		}

		console.log("Checking for self friend request accepting...");
		if (accepting_user_id === accepted_user_id) {
			throw new FriendRequestSelfAcceptError();
		}

		console.log("Checking for already friends...");
		if (accepting_user.friends.some((friend): boolean => friend.id === accepted_user_id)) {
			throw new UserAlreadyFriendError();
		}

		console.log("Checking for pending friend request...");
		if (
			!accepting_user.pendingFriendRequests.some(
				(pending_friend): boolean => pending_friend.id === accepted_user_id,
			)
		) {
			throw new FriendRequestNotFoundError();
		}

		this._make_two_become_friends(accepting_user_id, accepted_user_id);
	}

	/**
	 * @brief	Make an user reject a pending friend request from another user.
	 * 			Both of the users must be active, and not be the same.
	 *
	 * @param	rejecting_user_id The id of the user rejecting the friend request.
	 * @param	rejected_user_id The id of the user that sent the friend request.
	 * @param	rejecting_user The user rejecting the friend request. (optional)
	 * @param	rejected_user The user that sent the friend request. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- FriendRequestSelfRejectError
	 * 			- FriendRequestNotFoundError
	 *
	 * @return	An empty promise.
	 */
	public async reject_one(
		rejecting_user_id: string,
		rejected_user_id: string,
		rejecting_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
		rejected_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!rejecting_user) {
			console.log("Searching for rejecting user...");
			rejecting_user = await this._prisma.user.findUnique({
				select: {
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: rejecting_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!rejecting_user) {
				throw new UserNotFoundError(rejecting_user_id);
			}
		}

		if (!rejected_user) {
			console.log("Searching for rejected user...");
			rejected_user = await this._prisma.user.findUnique({
				select: {
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: rejected_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!rejected_user) {
				throw new UserNotFoundError(rejected_user_id);
			}
		}

		console.log("Checking for self friend request rejecting...");
		if (rejecting_user_id === rejected_user_id) {
			throw new FriendRequestSelfRejectError();
		}

		console.log("Checking for pending friend request...");
		if (
			!rejecting_user.pendingFriendRequests.some(
				(pending_friend): boolean => pending_friend.id === rejected_user_id,
			)
		) {
			throw new FriendRequestNotFoundError();
		}

		console.log("Rejecting friend request...");
		await this._prisma.user.update({
			data: {
				pendingFriendRequests: {
					disconnect: {
						idAndState: {
							id: rejected_user_id,
							state: StateType.ACTIVE,
						},
					},
				},
			},
			where: {
				idAndState: {
					id: rejecting_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		console.log("Friend request rejected.");
	}

	/**
	 * @brief	Make an user send a friend request to an other user.
	 * 			Both of the users must be active, and not be the same.
	 * 			If the sending user has already a pending friend request from the receiving user,
	 * 			it will accept it instead of sending a new one.
	 *
	 * @param	sending_user_id The id of the user sending the friend request.
	 * @param	receiving_user_id The id of the user receiving the friend request.
	 * @param	sending_user The user sending the friend request. (optional)
	 * @param	receiving_user The user receiving the friend request. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- FriendRequestSelfSendError
	 * 			- UserAlreadyFriendsError
	 * 			- FriendRequestAlreadySentError
	 *
	 * @return	An empty promise.
	 */
	public async send_one(
		sending_user_id: string,
		receiving_user_id: string,
		sending_user?: {
			friends: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
		receiving_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!sending_user) {
			console.log("Searching for sending user...");
			sending_user = await this._prisma.user.findUnique({
				select: {
					friends: {
						select: {
							id: true,
						},
					},
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: sending_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!sending_user) {
				throw new UserNotFoundError(sending_user_id);
			}
		}

		if (!receiving_user) {
			console.log("Searching for receiving user...");
			receiving_user = await this._prisma.user.findUnique({
				select: {
					pendingFriendRequests: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: receiving_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!receiving_user) {
				throw new UserNotFoundError(receiving_user_id);
			}
		}

		console.log("Checking for self friend request sending...");
		if (sending_user_id === receiving_user_id) {
			throw new FriendRequestSelfSendError();
		}

		console.log("Checking for already friends...");
		if (sending_user.friends.some((friend): boolean => friend.id === receiving_user_id)) {
			throw new UserAlreadyFriendError();
		}

		console.log("Checking for already sent friend request...");
		if (
			receiving_user.pendingFriendRequests.some(
				(friend): boolean => friend.id === sending_user_id,
			)
		) {
			throw new FriendRequestAlreadySentError();
		}

		console.log("Checking for reciprocal friend request...");
		if (
			sending_user.pendingFriendRequests.some(
				(friend): boolean => friend.id === receiving_user_id,
			)
		) {
			return this.accept_one(
				sending_user_id,
				receiving_user_id,
				sending_user,
				receiving_user,
			);
		} else {
			console.log("Sending friend request...");
			await this._prisma.user.update({
				data: {
					pendingFriendRequests: {
						connect: {
							id: sending_user_id,
						},
					},
				},
				where: {
					idAndState: {
						id: receiving_user_id,
						state: StateType.ACTIVE,
					},
				},
			});
			console.log("Friend request sent.");
		}
	}
}
