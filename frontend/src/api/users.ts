import { Client, PrivateUser, User, UserId, UserUpdate } from ".";
import { Soon } from "../strawberry";

/**
 * Stores and caches information about users.
 */
export const Users = (function () {
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

        /** Invalidates the provided avatar, effectively removing it from the cache. */
        public invalidate_avatar(id: UserId) {
            delete this.avatars[id];
        }

        public async patch_name(id: UserId | null, name: string) {
            const m = await this.me();
            if (!id) id = m.id;
            if (m.id === id) m.name = name;
            const u = await this.get(id);
            u.name = name;
        }

        public set_avatar(id: UserId, avatar: string) {
            this.avatars[id] = new Soon(avatar);
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
            if (this.me_) return this.me_.get();

            this.me_ = new Soon();
            const me = await Client.me();
            this.me_.resolve(me);
            return me;
        }

        public async on_user_update(user_update: UserUpdate) {
            const usr = await this.get(user_update.id);

            if (user_update.game_won)
                usr.games_won_count = user_update.game_won;
            if (user_update.game_played)
                usr.games_played_count = user_update.game_played;
            if (user_update.is_avatar_changed) this.invalidate_avatar(usr.id);
            if (user_update.name) usr.name = user_update.name;
            if (user_update.status) {
                if (user_update.status === "spectating")
                    usr.spectating = user_update.spectating;
                usr.status = user_update.status;
            }
        }
    }

    return new UsersClass();
})();
