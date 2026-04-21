import { connectDatabase } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { RotaEntryModel } from '../models/RotaEntry.js';
import { OrganizationModel } from '../models/Organization.js';
import { OrganizationMembershipModel } from '../models/OrganizationMembership.js';
import { RoleModel } from '../models/Role.js';

async function runMigration() {
    console.info('[Migration] Starting Enterprise Data Migration...');
    await connectDatabase(process.env.MONGODB_URI!);

    const users = await UserModel.find({ deletedAt: null });
    console.info(`[Migration] Found ${users.length} active users to migrate.`);

    for (const user of users) {
        // Check if user already migrated
        if (user.activeOrganizationId) {
            console.info(`[Migration] User ${user._id} already has activeOrganizationId. Skipping.`);
            continue;
        }

        console.info(`[Migration] Processing user ${user._id} (${user.email})...`);

        // 1. Create Personal Organization
        const orgName = `${user.displayName}'s Personal Workspace`;
        const organization = await OrganizationModel.create({
            name: orgName,
            type: 'PERSONAL',
            billingTier: 'FREE',
            isActive: true
        });

        // 2. Create Default Admin Role
        const role = await RoleModel.create({
            organizationId: organization._id,
            name: 'Admin',
            permissions: ['ROTA_CREATE', 'ROTA_APPROVE', 'ROTA_EDIT', 'USER_MANAGE', 'BILLING_MANAGE', 'ORG_MANAGE'],
            isSystem: true
        });

        // 3. Create Membership
        await OrganizationMembershipModel.create({
            userId: user._id,
            organizationId: organization._id,
            roleIds: [role._id]
        });

        // 4. Update User Profile
        user.activeOrganizationId = organization._id;
        await user.save();

        // 5. Backfill RotaEntries
        const result = await RotaEntryModel.updateMany(
            { userId: user._id, organizationId: { $exists: false } },
            { $set: { organizationId: organization._id } }
        );

        console.info(`[Migration] User ${user._id} migrated successfully. Updated ${result.modifiedCount} RotaEntries.`);
    }

    console.info('[Migration] Migration complete.');
    process.exit(0);
}

runMigration().catch(err => {
    console.error('[Migration] Failed:', err);
    process.exit(1);
});
