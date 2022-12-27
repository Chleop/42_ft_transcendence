import { ChanType, PrismaClient, Skin } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Delete all data
	await prisma.user.deleteMany({});
	await prisma.channel.deleteMany({});
	await prisma.channelMessage.deleteMany({});
	await prisma.dM.deleteMany({});
	await prisma.game.deleteMany({});
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
				name: "jodufour",
				email: "jodufour@student.42.fr",
				skinId: skin.id,
			},
			{
				name: "etran",
				email: "etran@student.42.fr",
				skinId: skin.id,
			},
			{
				name: "majacque",
				email: "majacque@student.42.fr",
				skinId: skin.id,
			},
			{
				name: "cproesch",
				email: "cproesch@student.42.fr",
				skinId: skin.id,
			},
			{
				name: "nmathieu",
				email: "nmathieu@student.42.fr",
				skinId: skin.id,
			},
		],
	});

	// Create default channels
	await prisma.channel.createMany({
		data: [
			{
				name: "general",
				chanType: ChanType.PRIVATE,
			},
			{
				name: "random",
				chanType: ChanType.PROTECTED,
				// Password: `pouic`
				// Salt: `GEwEKCORKkL6IFO5`
				hash: "$argon2id$v=19$m=16,t=2,p=1$R0V3RUtDT1JLa0w2SUZPNQ$QqeTRY0jOjozzSWEKLaTRw",
			},
			{
				name: "42",
				chanType: ChanType.PUBLIC,
			},
		],
	});

	// Create default userchannels relations
	await prisma.user.update({
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
	await prisma.user.update({
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
	await prisma.user.update({
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
						name: "42",
					},
				],
			},
		},
	});
	await prisma.user.update({
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
						name: "42",
					},
				],
			},
		},
	});
	await prisma.user.update({
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
						name: "42",
					},
				],
			},
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
