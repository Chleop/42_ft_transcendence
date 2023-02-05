import { Client, PrivateUser, User, UserId } from ".";
import { Soon } from "../strawberry";

/**
 * Stores and caches information about users.
 */
export const Users = (function() {
    class UsersClass {
        private users: Record<UserId, Soon<User>>;
        private avatars: Record<UserId, Soon<string>>;

        private me_: Soon<PrivateUser> | undefined;

        public constructor() {
            this.users = {};
            this.avatars = {};
            this.me_ = undefined;
        }

        /**
         * Gets information about a user.
         *
         * If the user is part of our cache, the saved version is returned.
         */
        public async get(id: UserId): Promise<User> {
            if (this.users[id]) {
                return this.users[id].get();
            }

            this.users[id] = new Soon();
            const user = await Client.user(id);
            this.users[id].resolve(user);
            return user;
        }

        /**
         * Returns the requested user's avatar.
         *
         * This function will first look in the cache.
         */
        public async get_avatar(id: UserId): Promise<string> {
            if (this.avatars[id]) {
                return this.avatars[id].get();
            }

            this.avatars[id] = new Soon();
            const url = await Client.user_avatar(id);
            this.avatars[id].resolve(url);
            return url;
        }

        /**
         * Gets information about the currently connected user.
         */
        public async me(): Promise<PrivateUser> {
            if (this.me_)
                return this.me_.get();

            this.me_ = new Soon();
            const me = await Client.me();
            this.me_.resolve(me);
            return me;
        }
    }

    return new UsersClass();
})();
