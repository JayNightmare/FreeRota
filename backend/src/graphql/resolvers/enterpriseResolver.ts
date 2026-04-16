import { enterpriseService, type EnterpriseInquiryType } from '../../services/enterpriseService.js';

export const enterpriseResolver = {
    Mutation: {
        submitEnterpriseInquiry: async (
            _parent: unknown,
            args: {
                input: {
                    companyName: string;
                    contactName: string;
                    email: string;
                    phone?: string | null;
                    inquiryType: EnterpriseInquiryType;
                    message: string;
                };
            }
        ) => enterpriseService.submitInquiry(args.input)
    }
};
