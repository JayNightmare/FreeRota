import { requireAuth } from './helpers.js';
import { shiftTypeService } from '../../services/shiftTypeService.js';

export const shiftTypeResolver = {
    Query: {
        myShiftTypes: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return shiftTypeService.listMyShiftTypes(userId);
        }
    },
    Mutation: {
        createShiftType: async (
            _parent: unknown,
            args: { input: { name: string; color?: string | null } },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return shiftTypeService.createShiftType(userId, args.input);
        },
        updateShiftType: async (
            _parent: unknown,
            args: { id: string; input: { name?: string; color?: string | null } },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return shiftTypeService.updateShiftType(userId, args.id, args.input);
        },
        deleteShiftType: async (
            _parent: unknown,
            args: { id: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return shiftTypeService.deleteShiftType(userId, args.id);
        }
    }
};
