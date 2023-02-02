import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { StateType } from "@prisma/client";
import {
	FriendRequestAlreadySentError,
	FriendRequestNotFoundError,
	FriendRequestSelfAcceptError,
	FriendRequestSelfRejectError,
	FriendRequestSelfSendError,
} from "src/friend_request/error";
import { UserAlreadyFriendError, UserBlockedError, UserNotFoundError } from "src/user/error";

@Injectable()
export class FriendRequestService {
	// REMIND: would it be better to make these properties static ?
	// REMIND: check if passing `_prisma` in readonly keep it working well
	private _prisma: PrismaService;
	private readonly _logger: Logger;

	constructor() {
		this._prisma = new PrismaService();
		this._logger = new Logger(FriendRequestService.name);
	}

	/**
	 * @brief	Make a user accept a pending friend request from another user.
	 * 			Accepted user must be active and not the same as the accepting user.
	 * 			Once both of the users become friends, they become able to :
	 * 			- see each other's status
	 * 			- see each other's channels
	 * 			- see each other's friends
	 * 			- see each other's games history
	 * 			- challenge each other without passing by a channel
	 * 			- spectating each other's games without passing by a channel
	 * 			- invite each other to a channel without passing by a channel
	 * 			It is assumed that the provided accepting user id is valid.
	 * 			(user exists and is not DISABLED)
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
		},
		accepted_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!accepting_user) {
			accepting_user = (await this._prisma.user.findUnique({
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
			})) as {
				friends: {
					id: string;
				}[];
				pendingFriendRequests: {
					id: string;
				}[];
			};
		}

		if (!accepted_user) {
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

		if (accepting_user_id === accepted_user_id) {
			throw new FriendRequestSelfAcceptError();
		}

		if (accepting_user.friends.some((friend): boolean => friend.id === accepted_user_id)) {
			throw new UserAlreadyFriendError();
		}

		if (
			!accepting_user.pendingFriendRequests.some(
				(pending_friend): boolean => pending_friend.id === accepted_user_id,
			)
		) {
			throw new FriendRequestNotFoundError();
		}
		await this._prisma.user.update({
			data: {
				friends: {
					connect: {
						id: accepting_user_id,
					},
				},
				pendingFriendRequests: {
					disconnect: {
						id: accepting_user_id,
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
		await this._prisma.user.update({
			data: {
				friends: {
					connect: {
						id: accepted_user_id,
					},
				},
				pendingFriendRequests: {
					disconnect: {
						id: accepted_user_id,
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
		this._logger.log(
			`User ${accepting_user_id} accepted friend request from user ${accepted_user_id}.`,
		);
	}

	/**
	 * @brief	Make a user reject a pending friend request from another user.
	 * 			Rejected user must be active and not the same as the rejecting user.
	 * 			It is assumed that the rejecting user id is valid.
	 * 			(user exists and is not DISABLED)
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
		},
		rejected_user?: {
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!rejecting_user) {
			rejecting_user = (await this._prisma.user.findUnique({
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
			})) as {
				pendingFriendRequests: {
					id: string;
				}[];
			};
		}

		if (!rejected_user) {
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

		if (rejecting_user_id === rejected_user_id) {
			throw new FriendRequestSelfRejectError();
		}

		if (
			!rejecting_user.pendingFriendRequests.some(
				(pending_friend): boolean => pending_friend.id === rejected_user_id,
			)
		) {
			throw new FriendRequestNotFoundError();
		}

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
		this._logger.log(
			`User ${rejecting_user_id} rejected friend request from user ${rejected_user_id}.`,
		);
	}

	/**
	 * @brief	Make a user send a friend request to an other user.
	 * 			Receiving user must be active and not the same as the sendind user.
	 * 			If the sending user has already a pending friend request from the receiving user,
	 * 			it will accept it instead of sending a new one.
	 * 			It is assumed that the sending user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	sending_user_id The id of the user sending the friend request.
	 * @param	receiving_user_id The id of the user receiving the friend request.
	 * @param	sending_user The user sending the friend request. (optional)
	 * @param	receiving_user The user receiving the friend request. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserBlockedError
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
			blocked: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		},
		receiving_user?: {
			blocked: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!sending_user) {
			sending_user = (await this._prisma.user.findUnique({
				select: {
					blocked: {
						select: {
							id: true,
						},
					},
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
			})) as {
				blocked: {
					id: string;
				}[];
				friends: {
					id: string;
				}[];
				pendingFriendRequests: {
					id: string;
				}[];
			};
		}

		if (!receiving_user) {
			receiving_user = await this._prisma.user.findUnique({
				select: {
					blocked: {
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
						id: receiving_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!receiving_user) {
				throw new UserNotFoundError(receiving_user_id);
			}
		}

		if (
			sending_user.blocked.some((blocked): boolean => blocked.id === receiving_user_id) ||
			receiving_user.blocked.some((blocked): boolean => blocked.id === sending_user_id)
		) {
			throw new UserBlockedError();
		}

		if (sending_user_id === receiving_user_id) {
			throw new FriendRequestSelfSendError();
		}

		if (sending_user.friends.some((friend): boolean => friend.id === receiving_user_id)) {
			throw new UserAlreadyFriendError();
		}

		if (
			receiving_user.pendingFriendRequests.some(
				(friend): boolean => friend.id === sending_user_id,
			)
		) {
			throw new FriendRequestAlreadySentError();
		}

		if (
			sending_user.pendingFriendRequests.some(
				(friend): boolean => friend.id === receiving_user_id,
			)
		) {
			return await this.accept_one(
				sending_user_id,
				receiving_user_id,
				sending_user,
				receiving_user,
			);
		} else {
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
			this._logger.log(
				`Sent friend request from ${sending_user_id} to ${receiving_user_id}.`,
			);
		}
	}
}
