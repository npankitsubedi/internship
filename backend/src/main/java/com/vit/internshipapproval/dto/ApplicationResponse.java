package com.vit.internshipapproval.dto;

import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import com.vit.internshipapproval.model.Application;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ApplicationResponse(
    UUID id,
    String studentName,
    String registrationNumber,
    String studentEmail,
    String phoneNumber,
    String school,
    String program,
    Integer yearOfStudy,
    Integer earnedCredits,
    String internshipMode,
    String companyName,
    String roleTitle,
    BigDecimal stipend,
    LocalDate startDate,
    LocalDate endDate,
    String locationScope,
    String city,
    String stateName,
    String globalRegion,
    String country,
    String offerLetterUrl,
    String emailProofUrl,
    boolean placementWithdrawalAccepted,
    String placementWithdrawalTypedName,
    ApplicationStatus status,
    Role stage,
    LocalDateTime submittedAt,
    LocalDateTime updatedAt,
    List<ApprovalHistoryResponse> approvalHistory
) {
    public static ApplicationResponse fromEntity(Application application) {
        return new ApplicationResponse(
            application.getId(),
            application.getStudentName(),
            application.getRegistrationNumber(),
            application.getStudentEmail(),
            application.getPhoneNumber(),
            application.getSchool(),
            application.getProgram(),
            application.getYearOfStudy(),
            application.getEarnedCredits(),
            application.getInternshipMode(),
            application.getCompanyName(),
            application.getRoleTitle(),
            application.getStipend(),
            application.getStartDate(),
            application.getEndDate(),
            application.getLocationScope(),
            application.getCity(),
            application.getStateName(),
            application.getGlobalRegion(),
            application.getCountry(),
            application.getOfferLetterUrl(),
            application.getEmailProofUrl(),
            application.isPlacementWithdrawalAccepted(),
            application.getPlacementWithdrawalTypedName(),
            application.getStatus(),
            application.getStage(),
            application.getSubmittedAt(),
            application.getUpdatedAt(),
            application.getApprovalHistory().stream()
                .map(ApprovalHistoryResponse::fromEntity)
                .toList()
        );
    }
}
