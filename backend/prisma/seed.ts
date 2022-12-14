import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  const user1 = await prisma.user.upsert({
    where: { id: 'User1' },
    update: {},
    create: {
        id: 'User1',
        name: 'FirstUser',
        email: 'user1@42.fr',
        skin: {
            create: {
                id: "skin1",
                name: "skin1",
                url: "skin1",
            },
      },
    },
  })

  const user2 = await prisma.user.upsert({
    where: { id: 'User2' },
    update: {},
    create: {
        id: 'User2',
        name: 'SecondUser',
        email: 'user2@42.fr',
        skin: {
            create: {
                id: "skin2",
                name: "skin2",
                url: "skin2",
            },
      },
    },
  })

  const user3 = await prisma.user.upsert({
    where: { id: 'User3' },
    update: {},
    create: {
        id: 'User3',
        name: 'ThirdUser',
        email: 'user3@42.fr',
        skin: {
            connect: { id: 'skin1' },
      },
    },
  })

  const chan1 = await prisma.channel.upsert({
    where: { name: 'FirstChannel' },
    update: {},
    create: {
        name: 'FirstChannel',
        hash: '123456789',
        members: {
            connect: [
                { id: 'User1' },
                { id: 'User2' },
                { id: 'User3' }
            ]
        },
        operators: {
            connect: { id: 'User1' },
        },
        messages: {
            create: [{
                senderid: 'User1',
                content: "Jesus!",
            },
            {
                senderid: 'User2',
                content: "Revient!",
            },
            {
                senderid: 'User3',
                content: "Jeeesus revient!",
            },
            {
                senderid: 'User1',
                content: "Jesus revient parmis les tiens!",
            },
            {
                senderid: 'User3',
                content: "Du haut de ta croix montre nous le chemin",
            },
            ]
        },
    },
  })

//   console.log({ user1 });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
