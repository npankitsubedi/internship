package com.vit.internshipapproval.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ApplicationSubmissionRequest(
    @NotBlank(message = "Student name is required")
    String studentName,

    @NotBlank(message = "Registration number is required")
    String registrationNumber,

    @NotBlank(message = "Student email is required")
    @Email(message = "Student email must be valid")
    String studentEmail,

    @NotBlank(message = "Phone number is required")
    String phoneNumber,

    @NotBlank(message = "School is required")
    String school,

    @NotBlank(message = "Program is required")
    String program,

    @NotNull(message = "Year of study is required")
    @Min(value = 1, message = "Year of study must be at least 1")
    @Max(value = 6, message = "Year of study must be 6 or less")
    Integer yearOfStudy,

    @NotNull(message = "Earned credits are required")
    @Min(value = 0, message = "Earned credits cannot be negative")
    Integer earnedCredits,

    @NotBlank(message = "Internship mode is required")
    String internshipMode,

    @NotBlank(message = "Company name is required")
    String companyName,

    @NotBlank(message = "Role title is required")
    String roleTitle,

    @NotNull(message = "Stipend is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Stipend cannot be negative")
    BigDecimal stipend,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    @NotNull(message = "End date is required")
    LocalDate endDate,

    @NotBlank(message = "Location scope is required")
    String locationScope,

    @NotBlank(message = "City is required")
    String city,

    String stateName,

    String globalRegion,

    @NotBlank(message = "Country is required")
    String country,

    @NotBlank(message = "Offer letter URL is required")
    String offerLetterUrl,

    @NotBlank(message = "Email proof URL is required")
    String emailProofUrl,

    @NotNull(message = "Placement withdrawal acknowledgement is required")
    Boolean placementWithdrawalAccepted,

    String placementWithdrawalTypedName
) {
}
