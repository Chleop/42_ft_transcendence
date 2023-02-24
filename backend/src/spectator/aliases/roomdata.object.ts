import { IUserPublic } from "../../user/interface";

export type RoomData = {
	spectated: IUserPublic;
	opponent: IUserPublic;
};
