import { Client, PrivateUser, User, UserId } from ".";

/**
 * Stores and caches information about users.
 */
export const Users = (function() {
    class UsersClass {
        private users: Record<UserId, User>;

        private me_: PrivateUser | undefined;

        public constructor() {
            this.users = {}
            this.me_ = undefined;
        }

        /**
         * Gets information about a user.
         *
         * If the user is part of our cache, the saved version is returned.
         */
        public async get(id: UserId): Promise<User> {
            if (this.users[id]) {
                return this.users[id];
            }

            const user = await Client.user(id);
            this.users[id] = user;
            return user;
        }

        /**
         * Gets information about the currently connected user.
         */
        public async me(): Promise<PrivateUser> {
            if (this.me_)
                return this.me_;

            this.me_ = await Client.me();
            return this.me_;
        }
    }

    return new UsersClass();
})();
