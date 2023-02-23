import { Client, PrivateUser, User, UserId } from ".";
import { NOTIFICATIONS } from "../notification";
import { Soon } from "../strawberry";

/**
 * Stores and caches information about users.
 */
export const Users = (function() {
    class UsersClass {
        private users: Record<UserId, Soon<User>>;
        private subs: Map<UserId, Set<(usr: User) => void>>;
        private avatars: Map<UserId, number>;

        private me_: Soon<PrivateUser> | undefined;

        public constructor() {
            this.users = {};
            this.me_ = undefined;
            this.subs = new Map();
            this.avatars = new Map();
        }

        public invalidate_me() {
            delete this.me_;
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
         * Requests a function to be called when a user changes.
         */
        public subscribe(id: UserId, sub: (usr: User) => void): () => void {
            let subs = this.subs.get(id);
            if (!subs) {
                subs = new Set();
                this.subs.set(id, subs);
            }
            subs.add(sub);
            return () => {
                if (subs)
                    subs.delete(sub);
            };
        }

        /** Invalidates the provided avatar, effectively removing it from the cache. */
        public invalidate_avatar(id: UserId) {
            this.avatars.set(id, Math.random() * 1e14);
        }

        public async patch_name(id: UserId | null, name: string) {
            const m = await this.me();
            if (!id) id = m.id;
            if (m.id === id) m.name = name;
            const u = await this.get(id);
            u.name = name;
        }

        /**
         * Returns the requested user's avatar.
         *
         * This function will first look in the cache.
         */
        public get_avatar(id: UserId): string {
            return `/api/user/${id}/avatar?dummy=${this.avatars.get(id) || 0}`;
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

        public async on_user_update(user_update: User | PrivateUser) {
            const me = await this.me();

            const u = await this.get(user_update.id);
            Object.assign(u, user_update);
            this.invalidate_avatar(u.id);

            const subs = this.subs.get(user_update.id);
            if (subs) {
                for (const sub of subs) {
                    sub(u);
                }
            }

            if (me.id === user_update.id) {
                const new_me: PrivateUser = user_update as PrivateUser;
                let friend_found: UserId | undefined;
                for (const new_pending of new_me.pending_friends_ids) {
                    if (me.pending_friends_ids.indexOf(new_pending) === -1) {
                        friend_found = new_pending;
                        break;
                    }
                }

                if (friend_found)
                    NOTIFICATIONS.spawn_friend_invite("aquamarine", friend_found);

                Object.assign(me, user_update);
            }
        }
    }

    return new UsersClass();
})();
