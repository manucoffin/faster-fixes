import { faker } from "@faker-js/faker";
import { PrismaClient } from "../generated/prisma/client";

export async function seedUsers(prisma: PrismaClient) {
  // Clean up existing data to avoid duplicates
  await prisma.member.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  const users = [];

  // Generate 50 users
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        name: `${firstName} ${lastName}`,
        email,
        emailVerified: faker.datatype.boolean(0.7), // 70% verified
        image: faker.image.avatar(),
        role: faker.helpers.arrayElement(["user", "admin"]),
        banned: false,
        onboardingCompleted: faker.datatype.boolean(0.8), // 80% completed
      },
    });

    // Create profile for user
    await prisma.profile.create({
      data: {
        id: faker.string.uuid(),
        firstName,
        lastName,
        userId: user.id,
      },
    });

    // Create default organization for user
    const orgName = faker.company.name();
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${user.id.slice(0, 8)}`;

    const organization = await prisma.organization.create({
      data: {
        id: faker.string.uuid(),
        name: orgName,
        slug,
        isDefault: true,
      },
    });

    // Create member record linking user to organization
    await prisma.member.create({
      data: {
        id: faker.string.uuid(),
        organizationId: organization.id,
        userId: user.id,
        role: "owner",
      },
    });

    users.push({ id: user.id, email, name: user.name });
  }

  console.log(`Seeded ${users.length} users with profiles and organizations`);
}
