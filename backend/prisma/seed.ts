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
        id: "jodufour",
				name: "jodufour",
				email: "jodufour@student.42.fr",
				skinId: skin.id,
			},
			{
				id: "etran",
        name: "etran",
				email: "etran@student.42.fr",
				skinId: skin.id,
			},
			{
				id: "majacque",
        name: "majacque",
				email: "majacque@student.42.fr",
				skinId: skin.id,
			},
			{
        id: "cproesch",
				name: "cproesch",
				email: "cproesch@student.42.fr",
				skinId: skin.id,
			},
			{
        id: "nmathieu",
				name: "nmathieu",
				email: "nmathieu@student.42.fr",
				skinId: skin.id,
			},
		],
	});

  const chan1 = await prisma.channel.upsert({
    where: { name: 'FirstChannel' },
    update: {},
    create: {
      name: 'FirstChannel',
      hash: '123456789',
      members: {
        connect: [
            { name: 'majacque' },
            { name: 'cproesch' },
            { name: 'etran' }
        ]
      },
      operators: {
        connect: { name: 'majacque' },
      },
      messages: {
        create: [{
            senderid: 'majacque',
            content: "Jesus!",
        },
        {
            senderid: 'cproesch',
            content: "Revient!",
        },
        {
            senderid: 'etran',
            content: "Jeeesus revient!",
        },
        {
            senderid: 'majacque',
            content: "Jesus revient parmis les tiens!",
        },
        {
            senderid: 'etran',
            content: "Du haut de ta croix montre nous le chemin",
        },
        ]
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
