import { ChanType, PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
	type t_user_fields = {
		id: string;
	};
	type t_channel_fields = {
		id: string;
	};

	// Create skins
	const skin_id: string = (
		await prisma.skin.create({
			data: {
				name: "default",
				background: "resource/skin/background/default.png",
				ball: "resource/skin/ball/default.png",
				paddle: "resource/skin/paddle/default.png",
			},
		})
	).id;
	await prisma.skin.create({
		data: {
			name: "snow",
			background: "resource/skin/background/snow.png",
			ball: "resource/skin/ball/snow.png",
			paddle: "resource/skin/paddle/snow.png",
		},
	});
	await prisma.skin.create({
		data: {
			name: "hamster",
			background: "resource/skin/background/hamster.png",
			ball: "resource/skin/ball/hamster.png",
			paddle: "resource/skin/paddle/hamster.png",
		},
	});

	// Create default users
	const jodufour: t_user_fields = await prisma.user.create({
		data: {
			login: "jodufour",
			name: "jodufour",
			email: "jodufour@student.42.fr",
			skinId: skin_id,
		},
	});
	const etran: t_user_fields = await prisma.user.create({
		data: {
			login: "etran",
			name: "etran",
			email: "etran@student.42.fr",
			skinId: skin_id,
		},
	});
	const majacque: t_user_fields = await prisma.user.create({
		data: {
			login: "majacque",
			name: "majacque",
			email: "majacque@student.42.fr",
			skinId: skin_id,
		},
	});
	const cproesch: t_user_fields = await prisma.user.create({
		data: {
			login: "cproesch",
			name: "cproesch",
			email: "cproesch@student.42.fr",
			skinId: skin_id,
		},
	});
	const nmathieu: t_user_fields = await prisma.user.create({
		data: {
			login: "nmathieu",
			name: "nmathieu",
			email: "nmathieu@student.42.fr",
			skinId: skin_id,
		},
	});

	// Create default channels
	const joke: t_channel_fields = await prisma.channel.create({
		data: {
			name: "joke",
			chanType: ChanType.PRIVATE,
			owner: {
				connect: {
					id: majacque.id,
				},
			},
			members: {
				connect: [
					{
						id: majacque.id,
					},
				],
			},
		},
	});
	const random: t_channel_fields = await prisma.channel.create({
		data: {
			name: "random",
			chanType: ChanType.PROTECTED,
			hash: await argon2.hash("pouic"),
			owner: {
				connect: {
					id: etran.id,
				},
			},
			members: {
				connect: [
					{
						id: etran.id,
					},
					{
						id: majacque.id,
					},
				],
			},
		},
	});
	const general: t_channel_fields = await prisma.channel.create({
		data: {
			name: "general",
			chanType: ChanType.PUBLIC,
			owner: {
				connect: {
					name: "jodufour",
				},
			},
			members: {
				connect: [
					{
						id: jodufour.id,
					},
					{
						id: etran.id,
					},
					{
						id: majacque.id,
					},
					{
						id: cproesch.id,
					},
					{
						id: nmathieu.id,
					},
				],
			},
		},
	});
	await prisma.channel.create({
		data: {
			name: "desert",
			chanType: ChanType.PUBLIC,
		},
	});
	await prisma.channel.create({
		data: {
			name: "public0",
			chanType: ChanType.PUBLIC,
		},
	});
	await prisma.channel.create({
		data: {
			name: "public1",
			chanType: ChanType.PUBLIC,
		},
	});
	await prisma.channel.create({
		data: {
			name: "protected0",
			chanType: ChanType.PROTECTED,
			hash: await argon2.hash("Hello"),
		},
	});
	await prisma.channel.create({
		data: {
			name: "protected1",
			chanType: ChanType.PROTECTED,
			hash: await argon2.hash("World!"),
		},
	});
	await prisma.channel.create({
		data: {
			name: "private0",
			chanType: ChanType.PRIVATE,
			owner: {
				connect: {
					id: cproesch.id,
				},
			},
			members: {
				connect: [
					{
						id: cproesch.id,
					},
				],
			},
		},
	});
	await prisma.channel.create({
		data: {
			name: "private1",
			chanType: ChanType.PRIVATE,
			owner: {
				connect: {
					id: nmathieu.id,
				},
			},
			members: {
				connect: [
					{
						id: nmathieu.id,
					},
				],
			},
		},
	});

	// Create default channel messages
	for (let i = 0; i < 100; i++) {
		await prisma.channelMessage.create({
			data: {
				content: `general: ${i}`,
				senderId: jodufour.id,
				channelId: general.id,
			},
		});
		await delay(10);
	}

	await prisma.channelMessage.create({
		data: {
			content: "Hello World !",
			senderId: jodufour.id,
			channelId: general.id,
		},
	});
	await delay(10);

	await prisma.channelMessage.create({
		data: {
			content: "How are you ?",
			senderId: etran.id,
			channelId: general.id,
		},
	});
	await delay(10);

	await prisma.channelMessage.create({
		data: {
			content: "I'm fine, thanks !",
			senderId: majacque.id,
			channelId: general.id,
		},
	});
	await delay(10);

	await prisma.channelMessage.create({
		data: {
			content: "Hola que tal ?",
			senderId: cproesch.id,
			channelId: random.id,
		},
	});
	await delay(10);

	await prisma.channelMessage.create({
		data: {
			content: "Muy bien, gracias !",
			senderId: nmathieu.id,
			channelId: random.id,
		},
	});
	await delay(10);

	await prisma.channelMessage.create({
		data: {
			content: "Did you get it ?...",
			senderId: majacque.id,
			channelId: joke.id,
		},
	});
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
