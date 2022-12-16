import { PrismaClient, Skin } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const skin: Skin = await prisma.skin.create({
		data: {
			name: "Default",
			url: "resource/skin/default.jpg",
		},
	});

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
