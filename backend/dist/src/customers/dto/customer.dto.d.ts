export declare class CreateCustomerDto {
    fullName: string;
    phoneNumber: string;
    phoneNumberSecondary?: string;
    email?: string;
    address?: string;
    customerType: string;
    college?: string;
    studyLevel?: string;
    specialization?: string;
    employerName?: string;
    jobTitle?: string;
    notes?: string;
}
export declare class UpdateCustomerDto {
    fullName?: string;
    phoneNumber?: string;
    phoneNumberSecondary?: string;
    email?: string;
    address?: string;
    college?: string;
    studyLevel?: string;
    specialization?: string;
    employerName?: string;
    jobTitle?: string;
    notes?: string;
    status?: string;
}
export declare class SearchCustomerDto {
    name?: string;
    phone?: string;
    email?: string;
    customerType?: string;
    college?: string;
    employerName?: string;
}
export declare class CustomerResponseDto {
    id: string;
    fullName: string;
    phoneNumber: string;
    phoneNumberSecondary?: string;
    email?: string;
    address?: string;
    customerType: string;
    college?: string;
    studyLevel?: string;
    specialization?: string;
    employerName?: string;
    jobTitle?: string;
    notes?: string;
    status: string;
    firstVisitAt?: Date;
    lastVisitAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CustomersListResponseDto {
    data: CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
