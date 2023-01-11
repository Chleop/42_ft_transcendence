import { Channel, ChanType, PrismaClient, Skin, User } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
	// Delete all data
	await prisma.channelMessage.deleteMany({});
	await prisma.dM.deleteMany({});
	await prisma.game.deleteMany({});
	await prisma.user.deleteMany({});
	await prisma.channel.deleteMany({});
	await prisma.skin.deleteMany({});

	// Create default skin
	const skin: Skin = await prisma.skin.create({
		data: {
			name: "Default",
			url: "resource/skin/default.jpg",
		},
	});

	// Create default users
	await prisma.user.createMany({
		data: [
			{
				login: "jodufour",
				name: "jodufour",
				email: "jodufour@student.42.fr",
				skinId: skin.id,
			},
			{
				login: "etran",
        		name: "etran",
				email: "etran@student.42.fr",
				skinId: skin.id,
			},
			{
				login: "majacque",
        		name: "majacque",
				email: "majacque@student.42.fr",
				skinId: skin.id,
			},
			{
				login: "cproesch",
				name: "cproesch",
				email: "cproesch@student.42.fr",
				skinId: skin.id,
			},
			{
				login: "nmathieu",
				name: "nmathieu",
				email: "nmathieu@student.42.fr",
				skinId: skin.id,
			},
		],
	});

	// Create default channels
	const joke: Channel = await prisma.channel.create({
		data: {
			name: "joke",
			chanType: ChanType.PRIVATE,
			owner: {
				connect: { name: "cproesch" },
			},
		},
	});
	const random: Channel = await prisma.channel.create({
		data: {
			name: "random",
			chanType: ChanType.PROTECTED,
			owner: {
				connect: { name: "cproesch" },
			},
			hash: await argon2.hash("pouic"),
		},
	});
	const general: Channel = await prisma.channel.create({
		data: {
			name: "general",
			chanType: ChanType.PUBLIC,
			owner: {
				connect: { name: "cproesch" },
			},
		},
	});
	await prisma.channel.create({
		data: {
			name: "desert",
			chanType: ChanType.PUBLIC,
			owner: {
				connect: { name: "cproesch" },
			},
		},
	});

	// Create default userchannels relations
	const jodufour: User = await prisma.user.update({
		where: {
			name: "jodufour",
		},
		data: {
			channels: {
				connect: [
					{
						name: "general",
					},
				],
			},
		},
	});
	const etran: User = await prisma.user.update({
		where: {
			name: "etran",
		},
		data: {
			channels: {
				connect: [
					{
						name: "general",
					},
					{
						name: "random",
					},
				],
			},
		},
	});
	const majacque: User = await prisma.user.update({
		where: {
			name: "majacque",
		},
		data: {
			channels: {
				connect: [
					{
						name: "general",
					},
					{
						name: "joke",
					},
				],
			},
		},
	});
	const cproesch: User = await prisma.user.update({
		where: {
			name: "cproesch",
		},
		data: {
			channels: {
				connect: [
					{
						name: "random",
					},
					{
						name: "joke",
					},
				],
			},
		},
	});
	const nmathieu: User = await prisma.user.update({
		where: {
			name: "nmathieu",
		},
		data: {
			channels: {
				connect: [
					{
						name: "general",
					},
					{
						name: "random",
					},
					{
						name: "joke",
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
		await delay(100);
	}

	await prisma.channelMessage.create({
		data: {
			content: "Hello World !",
			senderId: jodufour.id,
			channelId: general.id,
		},
	});
	await delay(100);

	await prisma.channelMessage.create({
		data: {
			content: "How are you ?",
			senderId: etran.id,
			channelId: general.id,
		},
	});
	await delay(100);

	await prisma.channelMessage.create({
		data: {
			content: "I'm fine, thanks !",
			senderId: majacque.id,
			channelId: general.id,
		},
	});
	await delay(100);

	await prisma.channelMessage.create({
		data: {
			content: "Hola que tal ?",
			senderId: cproesch.id,
			channelId: random.id,
		},
	});
	await delay(100);

	await prisma.channelMessage.create({
		data: {
			content: "Muy bien, gracias !",
			senderId: nmathieu.id,
			channelId: random.id,
		},
	});
	await delay(100);

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
